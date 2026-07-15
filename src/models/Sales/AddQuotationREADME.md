# AddQuotation

`src/models/Sales/AddQuotation.tsx` — creates or edits a quotation (header + line items + terms) against an enquiry, with support for multiple quotes per enquiry and multiple versions per quote.

Route: `AddQuotation/:enquiryNo` (optionally with a `quoteNo` param too, per `useParams<{ enquiryNo, quoteNo }>`), registered in `App.tsx`.

## Header data

On mount (`[enquiryNo]` effect), loads the enquiry/customer header via `GET /api/Sales/EnqCustLocContData?penquiryNo={enquiryNo}` — Customer, Contact Name, Location, Address, Enquiry Type, Location Id, and the enquiry's Board Ref (`enquiryBoardRef`, kept separate from the editable `boardRef` so "+ New Quote" can reset back to it).

`enquiryType` (`OFFSHORE` / `ONSITE`) selects the default Terms & Conditions text (`OFF_TERMS_AND_CONDITIONS` / `ON_TERMS_AND_CONDITIONS`, from `./const/QuoteOffTermsConditions` and `./const/QuoteOnTermsConditions`) — overridden by the loaded quotation's stored `tandc` once a quote is loaded.

## Quote / version selection

- All quotes for the enquiry load via `GET /api/Sales/QuotationDetailsByEnqQuote/{enquiryNo}` and are de-duplicated by `quoteNo` (the endpoint returns one row per version, so a `Map` keyed on `quoteNo` collapses them) into the "Select Quote" dropdown. If nothing is selected yet, the first quote found is auto-selected.
- Selecting a quote loads its available version numbers via `GET /api/Sales/QuotationCompleteDetailsByQuote/{quoteNo}` (returns all versions for that quote number) into the "Version No" dropdown, defaulting back to version 1.
- Once `enquiryNo` + `selectedQuoteNo` + `selectedVersionNo` + the description master list are all available, `GET /api/Sales/QuotationDetailsByEnqQuote/{enquiryNo}?quoteNo=&versionNo=` loads that specific version's items and `board_ref`/`tandc`, mapping each API item back to a `QuotationItem` row (re-deriving `taxName`/`taxRate` from the description master by matching `layout`, and recomputing `amount`/`taxAmount`/`incTaxAmount`).
- **+ New Quote** (`startNewQuote`) clears `selectedQuoteNo`, resets version to 1, restores `boardRef` to the enquiry's original board ref, and starts with a single empty line item — i.e. it does not create anything server-side by itself, it just resets the form to "add" mode.
- `isEditMode = Boolean(selectedQuoteNo)` — a `quoteNo` being selected/loaded is what switches the form from "ADD" to "EDIT" mode (button label, and whether "SAVE TO NEW VERSION" is shown).

## Line items

Each row (`QuotationItem`): Description (`descriptionId`, from the `QuoteBoardDescriptions` master), Currency (`INR`/`USD`/`EURO`), Qty, Duration (`Month`/`Week`/`Day`/`Hour`/`Number`/`Time`/`Set`), Unit Rate, plus **read-only, client-computed** Amount / Tax Name / Tax Rate / Tax Amount / Amount Including Tax.

`handleItemChange` recalculates on every field change:
- looks up the selected description's tax rate for the row's currency (`tax_INR` / `tax_USD` / `tax_EURO` on the matching `DescriptionItem`),
- `amount = qty * rate`
- `taxAmount = amount * taxRate / 100`
- `incTaxAmount = amount + taxAmount`

`grandTotal` sums `incTaxAmount` across all rows and is displayed (not sent to the backend — recomputed server-side from stored qty/rate/currency/description if needed).

Deleting a row (`deleteItem`) removes it from `items`; if it had a persisted `slNo`, that ID is pushed onto `deletedSlNos` so the backend knows to delete it on save.

**Add New Description** — `handleSaveCustomDescription` posts a new line-item description (`Layout`, hardcoded `Taxname: "GST"`, `tax_INR: 18`, `tax_USD: 0`, `tax_EURO: 0`, `location: '-'`) to `POST /api/Sales/AddQuoteDescription`, then refreshes the description master list. There is no UI to set the new description's tax values beyond this hardcoded GST 18%/USD 0%/EURO 0% default.

## Save payload

`buildQuoteItemsPayload(forceNewSlNo?)` maps `items` to the wire shape, failing (and toasting) if any row is missing a matched description or a resolved `location_id`:

```ts
items: [{
  slNo: number,        // 0 for new lines, or forced to 0 when forceNewSlNo (new-version save)
  layout: string,       // from the matched description
  quantity: number,
  unit_rate: number,
  currency_id: 1 | 2 | 3,   // INR | USD | EURO
  durationtype: string,
  location_id: number,
  updatedbyid: string,  // loginId
  versionNo: number,
}]
```

**Save / Edit** (`handleSaveQuotation`) → `POST /api/Sales/AddQuotation` (when `selectedQuoteNo` is empty) or `POST /api/Sales/EditQuotation` (when editing), with:

```ts
{
  enquiryno, quoteNo: selectedQuoteNo ?? "", board_ref, createdBy: loginId,
  versionNo: 1, tandc: terms, items: quoteItems, deletedSlNos,
}
```

Note `versionNo` is hardcoded to `1` here regardless of `selectedVersionNo` — this path is for adding a brand-new quote or editing the currently-loaded version in place, not for creating a new version (see below). On success the page does a full reload via `navigate(0)` after the success toast closes.

**Save To New Version** (`handleSaveNewVersion`, only shown when `isEditMode`) → always `POST /api/Sales/AddQuotation` (never Edit) with `quoteNo: selectedQuoteNo` (existing quote number kept) and `versionNo: selectedVersionNo + 1`, items built with `forceNewSlNo = true` (every line item's `slNo` forced to `0`, `deletedSlNos: []`). Because the quote number is unchanged but `versionNo` is new, the backend inserts a new `se_quotation`/`se_quotation_items` row set sharing the same `quoteNo` — this is how multiple versions of one quote coexist. On success, `selectedVersionNo` is bumped locally and the new version number is added to `availableVersions` (no page reload, unlike the normal save path).

## Backend

`SalesController` (`AddQuotation` / `EditQuotation`) → `SalesService.AddQuotationAsync` / `EditQuotationAsync` → `SalesRepository` (`SeemsAPIService/Application/Services/SalesServices.cs`, `.../Infrastructure/Persistence/Repository/SalesRepository.cs`), against `se_quotation` / `se_quotation_items`.

- **Add**: if `dto.quoteNo` is blank, the service generates the next quote number via `GetMaxQuoteNumberAsync() + 1` and defaults `versionNo` to `1` if it was `0`; if `quoteNo` is already set (the "Save To New Version" case), it's used as-is. The DTO is mapped to a new `se_quotation` entity (`IEntityMapper<QuotationDto, se_quotation, string?>.MapForAdd`) and inserted.
- **Edit**: requires `quoteNo`; loads the existing `se_quotation` (by `quoteNo` + `versionNo`) via `GetQuotationDetailsAsync`, throws `InvalidOperationException` if not found, then `MapForEdit` reconciles items (add/update/delete) against `dto.Items` / `dto.deletedSlNos` before saving.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/QuoteBoardDescriptions` | Line-item description master (with per-currency tax rates) |
| GET | `/api/Sales/EnqCustLocContData?penquiryNo=` | Enquiry/customer header (customer, contact, location, address, enquiry type, board ref) |
| GET | `/api/Sales/QuotationDetailsByEnqQuote/{enquiryNo}` | List quotes for the enquiry (dedup'd by quoteNo); also used with `?quoteNo=&versionNo=` to load a specific version's items/board ref/terms |
| GET | `/api/Sales/QuotationCompleteDetailsByQuote/{quoteNo}` | All versions for a given quote number |
| POST | `/api/Sales/AddQuotation` | Create a new quote, or add a new version of an existing quote |
| POST | `/api/Sales/EditQuotation` | Update the currently loaded quote/version in place |
| POST | `/api/Sales/AddQuoteDescription` | Add a new custom line-item description to the master list |

## Known gaps / notes

- Tax amounts and the grand total are computed entirely client-side from the description master; nothing prevents a stale/tampered `unit_rate`/`quantity` from producing a payload inconsistent with what's displayed, since the backend receives raw `quantity`/`unit_rate`/`currency_id`/`layout` rather than the computed amounts.
- `handleSaveQuotation` always sends `versionNo: 1`, which only makes sense for new quotes or in-place edits of an already-loaded version; version-aware saving is only handled by the separate `handleSaveNewVersion` path.
- New custom descriptions added via "Enter and Save New Description" always get `Taxname: "GST"`, `tax_INR: 18`, `tax_USD: 0`, `tax_EURO: 0` — there's no way to set USD/EURO tax rates or a different tax name from this screen.
- `QuotationApiResponse`/list-vs-single-object handling (`Array.isArray(data) ? data : [data]`) suggests the same endpoint can return either an array or a single object depending on query params — brittle but currently handled defensively at each call site.
- This component renders its own local `<ToastContainer>` in addition to the global one in `App.tsx` (same duplicate-container pattern seen — and removed — in `JobCreationForm.tsx`); not fixed here since it was out of scope for this doc pass.
