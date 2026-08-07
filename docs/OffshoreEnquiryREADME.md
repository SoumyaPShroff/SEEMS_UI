# OffshoreEnquiry

`src/models/Sales/OffshoreEnquiry.tsx` — Add/Edit form for an `OFFSHORE`-type sales enquiry (customer, contact, scope-of-work, and responsibility assignment). Same shape and backend endpoints as `OnsiteEnquiry.tsx`; the two are separate components rather than one parameterized form, differing mainly in the fixed `enquirytype` value (`"OFFSHORE"` here) and in `OnsiteEnquiry` carrying extra onsite-specific fields (tool license/duration/rate — not present here).

Route: `OffshoreEnquiry/:enquiryNo` (registered in `App.tsx`). `enquiryNo` present → edit mode (`isEditMode = Boolean(enquiryNo)`); absent → add mode.

## Data flow

1. On mount, fetches all dropdown lookups in parallel (`fetchLookups`): customers, active employees, analysis managers, sales managers, design managers, sales/NPI users, PCB tools, customer locations (unscoped), and states.
2. **Edit mode only**: once `lookups.customers` has loaded, `GET /api/Sales/EnquiryDetailsByEnquiryno/{enquiryNo}` fetches the existing enquiry, then loads that customer's locations and contacts, and hydrates `form` — including re-deriving the checked scope checkboxes from the enquiry's YES/NO columns (`getCheckedArrayFromAPI`). Guarded by `isInitialLoad` ref so it only runs once even though its effect depends on `lookups.customers.length`.
3. Selecting a **Customer** re-fetches that customer's locations (`fetchCustomerLocations`) and resets Location/Contact/Email/Address. In edit mode, changing an already-selected customer prompts a `window.confirm` first.
4. Selecting a **Location** fills Address from the matched location record and re-fetches Contacts for that customer+location (`fetchCustomerContacts`); if exactly one contact comes back (add mode only), it's auto-selected and its email filled in.
5. Selecting a **Contact** fills Email from the matched contact; Address is never touched by contact selection (it's location-derived only).
6. **Scope Details** — four cards (Layout, Analysis, VA, ATS) driven by `scopeConfig`, each a set of checkboxes plus a conditional "Responsibility" dropdown that appears once at least one checkbox in that section is checked. In add mode, Layout hides `QA/CAM`, `DFA`, `Fabrication`, `Testing` (`layoutHideForAdd`) — those are edit-only checkboxes.
7. "Complete Responsibility" (`completeresponsibilityid`) options are dynamically built from whichever scope-responsibility people are currently selected (`getCompleteRespOptions`); a separate effect also maintains a human-readable `completeResp` string (comma-joined responsibility IDs) whenever any of the four responsibility fields change.
8. Submit (`handleSubmit`) validates, builds a `FormData` payload (multipart, for the optional file upload), computes an email recipient list from the selected responsibility people plus the current user, resolves CC emails via `/api/Home/EmailId/{loginIds}`, and posts.

## Validation (`handleSubmit`, client-side)

- Customer, Location, Contact, Sales Responsibility, Billing Type (`tm`) required.
- For each scope section with at least one checkbox checked, its Responsibility dropdown is required (Layout/Analysis/VA/ATS).
- The primary submit button is additionally disabled whenever no responsibility field at all is set (`isResponsibilitySelected`), independent of `handleSubmit`'s own checks.

Server-side (`SalesService.ValidateEnquiry`, shared by both Add and Edit) also requires `customer_id`, `contact_id`, `type`, `salesresponsibilityid`, `completeresponsibilityid`, and `createdBy` — duplicating/backstopping some of the client checks.

## Submit payload

`multipart/form-data`, built by merging `dtoBlankDefaults` (backend-required scope/status fields the UI doesn't collect directly, all defaulted `"NO"`/`"Open"`) with `form`, then:

- Mapping the four checkbox arrays (`layout`, `analysis`, `va`, `npi`) to their individual YES/NO backend columns (e.g. `Design` → `design`, `SI` → `si`, `BOM Procurement` → `NPINew_BOMProc`) via `layoutMap`/`analysisMap`/`vaMap`/`npiMap`.
- Building `appendreq` as a comma-joined list of every checked scope label across all four sections (`"NA"` if none).
- Appending core fields individually (`customer_id`, `contact_id`, `location_id`, `type`, `currency_id`, `inputreceivedthru`, `salesresponsibilityid`, `completeresponsibilityid`, `govt_tender`, `quotation_request_lastdate`, `createdBy`, `referenceBy`, `appendreq`, `Remarks`, `statename`, `tm`, `sessionUserId`), then all remaining `postPayload` keys generically (arrays appended as repeated form fields).
- `enquiryno` appended only in edit mode.
- `ToMailList` / `CCMailList` appended as JSON-stringified arrays.
- `file` + `uploadedfilename` appended if a file was chosen (`file` input, single file only — multiple files must be zipped by the user first, per the on-screen note).

Add mode: `POST /api/Sales/AddEnquiryData`. Edit mode: `PUT /api/Sales/EditEnquiryData`.

## Email recipients

`buildEmailRecipientList()` collects the emails of whichever Layout/Analysis/VA/ATS responsibility people are currently selected, by matching their IDs across `designMngrs`, `AnalysisManagers`, `salesnpiusers`, `AllActiveEmployees`, `SalesManagers` (`getUserEmail` normalizes the several casings of an email field these lookup shapes use) — sent as `ToMailList`. Separately, `completeResp` IDs plus the current `loginId` are resolved to emails via `GET /api/Home/EmailId/{commaSeparatedLoginIds}` and sent as `CCMailList`. The backend (`SalesService.SendEnquiryCreatedEmailAsync`, add-path only) merges these with a DB-configured recipient list for the `"EnqCreated"` notification key and dedupes.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/customers` | Customer dropdown |
| GET | `/api/Home/AllActiveEmployees` | Active employees (Reference By, email lookups) |
| GET | `/api/Home/AnalysisManagers` | Analysis responsibility options |
| GET | `/api/Home/SalesManagers` | Sales Responsibility options |
| GET | `/api/Home/DesignManagers` | Layout/VA responsibility options |
| GET | `/api/Home/SalesNpiUsers` | ATS responsibility options |
| GET | `/api/Job/AllTools` | Tool dropdown |
| GET | `/api/Sales/customerlocations[?customerId=]` | Location dropdown (unscoped on mount, scoped once a customer is picked) |
| GET | `/api/Sales/States` | State dropdown |
| GET | `/api/Sales/customercontacts?customerId=&locationId=` | Contact dropdown |
| GET | `/api/Sales/EnquiryDetailsByEnquiryno/{enquiryno}` | Load existing enquiry (edit mode) |
| GET | `/api/Home/EmailId/{loginIds}` | Resolve login IDs → emails for CC list |
| POST | `/api/Sales/AddEnquiryData` | Create enquiry (multipart, file optional) |
| PUT | `/api/Sales/EditEnquiryData` | Update enquiry (multipart, file optional) |

Backend: `SalesController.AddEnquiry` / `EditEnquiry` → `SalesService.AddEnquiryAsync` / `EditEnquiryAsync` (`SeemsAPIService/Application/Services/SalesServices.cs`). `AddEnquiryAsync` generates the next enquiry number (`GenerateEnquiryNumberAsync`), defaults every scope YES/NO column not explicitly set to `"NO"` (`DefaultNo`), saves the uploaded file to disk under a per-enquiry name pattern (`{enquiryNo}-{sessionUserId}-{timestamp}-{originalFileName}`), and fires the creation email (failure there is caught and reported back as `EmailSent: false` rather than failing the whole request). `EditEnquiryAsync` loads the existing `se_enquiry` row and applies changes via `IEntityMapper<EnquiryDto, se_enquiry, string?>.MapForEdit` — it does not return an `EmailSent` flag (no notification email is sent on edit).

## Known gaps / notes

- No `useRoleAccess` / role-based restriction on this form — anyone who can reach the route can add or edit any offshore enquiry; access is presumably gated further up (route-level auth in `Home`/`App.tsx`) rather than in this component.
- `handleFileChange` accepts a single file (`e.target.files[0]`); the UI tells users to zip multiple files themselves rather than supporting multi-file upload.
- The success-toast branch in `handleSubmit` checks `data.emailSent === false`, which only ever comes back from the Add path (`EmailSent` in the response) — on Edit, `data.emailSent` is `undefined`, so it always falls through to the plain "OFFSHORE Enquiry Updated" toast; this is correct behavior but coincidental (the check silently does nothing for edits).
- The `!res.ok` branch's fallback messaging is inverted/dead in practice: it calls `res.text()` for the error body but then still shows a **success**-styled toast (`toast.success("✅ Enquiry added successfully.")`) when `data.emailSent !== false`, i.e. a failed HTTP response can still surface as a success toast unless the (add-only) `emailSent` flag happens to be `false`.
- `getCompleteRespOptions` reads `emp.hopC1ID`/`emp.hopC1NAME` (lowercase `hopC1ID`) while the `Manager` interface and most other lookups in this file use `HOPC1ID`/`HOPC1NAME` — likely dead/no-op fallback casing rather than a real second API shape; worth confirming which casing the `/api/Home/*Managers` endpoints actually return.
- A large commented-out inline `standardInputStyle` object remains at the top of the file; the real one is imported from `./styles/standardInputStyle`.
- `dtoBlankDefaults` and the scope checkbox/label maps are duplicated verbatim (or nearly) between this component and `OnsiteEnquiry.tsx` — a shared module would remove that duplication, but each file currently owns its own copy.
