# PurchaseOrder

`src/models/Sales/PurchaseOrder.tsx` — Purchase Order Management: a list of all POs (`poenquiries` rows) plus an Add/Edit dialog (`PoModal`) that computes the PO amount from per-scope Qty × Rate against an enquiry's enabled scopes.

Route: `PurchaseOrder`, registered in `App.tsx`. No `:id` param — Add/Edit both happen in the same modal, opened either via "New PO" (Add) or clicking a grid row / its Edit icon (Edit, `po` prop set to that row).

## List (`PurchaseOrder`)

- Loads `GET /api/Sales/poenquiries` on mount — returns the raw `poenquiries` entities (no DTO), so any new entity field is automatically available in `rows` without a backend change on the read side. Each row is given a synthetic `id` (`Number(row.id) || index + 1`) for the DataGrid.
- Columns: PO Number, Enquiry, PO Amt, Bal Amt, PO Date, Quote, PaymentTerms, Comments, Actions (Edit always; Delete only if `useRoleAccess(loginId, "adminuser")` is true).
- Delete asks for optional remarks in a confirm dialog, then `POST /api/Sales/DeletePO/{id}?sessionUserId=&delRemarks=`.
- Relies solely on the **global** `<ToastContainer>` mounted once in `App.tsx` — this component used to also render its own local `<ToastContainer>`, which caused a duplicate/stuck toast after a successful Add/Edit (both containers reacting to the same `toast.success(...)` call); the local one was removed.

## Add/Edit dialog (`PoModal`)

### Enquiry-driven scope config

Selecting **Enquiry No** (`onEnquiryChange`) drives everything else:
1. `fetchScopeConfig(enqNo)` — `GET /api/Sales/EnquiryDetailsByEnquiryno/{enqNo}` for `enquirytype`/`type`, then `GET /api/Sales/JobScopesConfig/{enqNo}` for which scopes (`layout`/`analysis`/`va`/`npi`/`dfm`/`library`) are enabled for that enquiry.
   - **ONSITE is special-cased**: regardless of what `JobScopesConfig` returns, the config is forced to `{ layout: true, everything else: false, isOnsite: true }` — for ONSITE enquiries only the Layout Qty/Rate row is used, and it represents onsite hours/rate rather than a layout scope.
   - If no scope is enabled (and it's not ONSITE), a `toast.warn` fires telling the user to fix the enquiry's scope.
2. `GET /api/Sales/QuotationDetailsByEnqQuote/{enqNo}` populates the **Quote No** dropdown.

Edit mode runs the equivalent of both fetches in parallel (`Promise.all`) on open, then `reset()`s the form from `po` — including remapping `layQty`/`layRateperhr` from `onsiteQty`/`onsiteRateperhr` when the enquiry type is ONSITE (the DB stores ONSITE hours under the `onsite*` columns, but the UI always edits them through the Layout row).

### Scope & Breakdown grid

Six Qty/Rate pairs (Layout, Analysis, VA, NPI, DFM, Library), each disabled unless its scope is enabled in `scopeConfig` (Add mode only — in Edit mode fields aren't force-disabled, since `useEffect` at line ~628 zeroes disabled scopes' Qty/Rate but explicitly `return`s early `if (po)`).

- **Qty fields only** go through `registerQty()` (wraps `register()`): non-negative (stripped live via `sanitizeQtyInput`, plus `min: 0` as an RHF rule), capped at `MAX_QTY_DIGITS = 6` integer digits, and `blockNegativeAndExponentKeys` prevents typing `-`/`+`/`e`/`E` in the first place. **Rate fields are plain `register(..., { valueAsNumber: true })`** — no negative/digit guard.
- `ppoamount` is recomputed live (`useEffect` on all Qty/Rate watches + `scopeConfig` + `enquiryType`) as the sum of `qty * rate` for every **enabled** scope (ONSITE sums only the Layout row regardless of `scopeConfig`, since ONSITE forces `layout: true`).
- `pbalanceamt` is set to the same total, but **only in Add mode** (`if (!po)`) — editing a PO never overwrites the balance from the Qty/Rate totals.

### SEZ

A checkbox, default **unchecked** (`sez: "NO"`), placed beside the Comments field (`sm:6` Comments / `sm:2` SEZ, after Payment Terms `sm:4`). Rendered small/compact (`Checkbox size="small"`, `0.75rem` label, `1.1rem` icon) to read as an inline toggle rather than a full field. Bound via `watch("sez") === "YES"` / `setValue("sez", ...)` rather than plain `register`, same pattern as `pcurrency_id`/`ppaymentterm`. Sent to the backend as `"YES"`/`"NO"` (`finalPayload.sez = data.sez === "YES" ? "YES" : "NO"`).

### Duplicate PO checks (Add mode only)

1. Client-side: `isDuplicate` — same trimmed/lower-cased `pponumber` + same `penquiryno` already present in `existingPos` (the grid's current rows), excluding the PO being edited.
2. Server-side: `GET /api/Sales/CheckSamePOExistsForDifferentCustomer/{pponumber}/{penquiryno}` — catches the case where the same PO number was already used for a *different* customer's enquiry (which the client-side check, scoped to one enquiry, can't see).

Both block save with a `toast.error`; the Save button is also `disabled` while `isDuplicate` is true.

### Save payload

`onSubmit` builds `finalPayload` from the RHF `data` in three passes: ONSITE vs OFFSHORE field remapping (moves Layout Qty/Rate into `onsite`/`onsiteQty`/`onsiteRateperhr` and zeroes the rest for ONSITE; zeroes the `onsite*` fields for OFFSHORE), then **stringifies** every numeric field ("to satisfy strict backend JSON parsing"), then **re-converts most of them back to `Number`** a few lines later before posting — `pconvrate`/`pcurrency_id` end up staying as strings (the final reassignment for those two overrides the numeric one). This double-conversion is confusing but intentional-looking legacy behavior; see Known gaps below.

- Add: `POST /api/Sales/AddPO/{sessionUserId}`
- Edit: `PUT /api/Sales/EditPO/{po.id}/{sessionUserId}` (preserves original `pcreatedby`, sets `pupdatedby`)

## Backend

`SalesController` (`AddPO` / `EditPO`) → `SalesService.AddPOAsync` / `EditPOAsync` → `SalesRepository.AddPOAsync` / `EditPOAsync` (`SeemsAPIService/Infrastructure/Persistence/Repository/SalesRepository.cs`), against `Domain/Entities/poenquiries.cs`. `PODto` (`Application/DTOs/PODto.cs`) is the wire type for both.

`sez` (`string`, defaults to `"NO"` in the entity) is normalized server-side too — `string.IsNullOrWhiteSpace(poDto.sez) ? "NO" : poDto.sez` — in both Add and Edit, so a blank/missing value never persists as null.

**No EF migrations in this project** (`UseMySql`, no `Migrations` folder, no `EnsureCreated`) — the `poenquiries.sez` column must be added to the database manually:

```sql
ALTER TABLE poenquiries
  ADD COLUMN sez ENUM('YES','NO') NOT NULL DEFAULT 'NO';
```

`GetPoEnquiriesAsync` (backing the list's `GET /api/Sales/poenquiries`) returns the raw `List<poenquiries>` entity, so `sez` (and any other entity field) flows to the frontend automatically without a DTO change.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/poenquiries` | List all POs (raw entity) for the grid |
| POST | `/api/Sales/DeletePO/{id}?sessionUserId=&delRemarks=` | Delete a PO |
| GET | `/api/Sales/AllEnquiries?status=Realised` | Enquiry No dropdown options |
| GET | `/api/Sales/EnquiryDetailsByEnquiryno/{enqNo}` | Enquiry type/category, used for the ONSITE special-case |
| GET | `/api/Sales/JobScopesConfig/{enqNo}` | Which scopes (layout/analysis/va/npi/dfm/library) are enabled for the enquiry |
| GET | `/api/Sales/QuotationDetailsByEnqQuote/{enqNo}` | Quote No dropdown options |
| GET | `/api/Sales/CheckSamePOExistsForDifferentCustomer/{pponumber}/{penquiryno}` | Cross-customer duplicate PO Number check (Add only) |
| POST | `/api/Sales/AddPO/{sessionUserId}` | Create a PO |
| PUT | `/api/Sales/EditPO/{id}/{sessionUserId}` | Update a PO |

## Known gaps / notes

- `onSubmit` stringifies every numeric field, then converts most of them back to `Number` a few lines later, then re-stringifies `pconvrate`/`pcurrency_id` at the very end — the net effect (numbers as numbers, `pconvrate`/`pcurrency_id` as strings) works, but the back-and-forth reads like leftover debugging rather than a deliberate contract; worth simplifying to a single pass if this file is touched again.
- Only **Qty** fields are guarded against negative values and long input (`registerQty`/`sanitizeQtyInput`/`blockNegativeAndExponentKeys`); the matching **Rate** fields have no such guard, so a negative or arbitrarily long rate can still be entered and will feed directly into the `ppoamount`/`pbalanceamt` calculation.
- In Edit mode, disabled-scope fields are not force-zeroed the way they are in Add mode (the zeroing `useEffect` explicitly skips edit mode) — editing a PO whose enquiry scope changed after the PO was created can therefore show/keep values for a scope that's no longer enabled on the enquiry.
- `sez` is a plain `string` (not a boolean) end-to-end, matching the existing YES/NO-string convention used throughout `poenquiries`/`se_enquiry` rather than introducing a new boolean pattern.
