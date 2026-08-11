# POApproval / POApprovalDetails

`src/models/Sales/POApproval.tsx` (list) + `src/models/Sales/POApprovalDetails.tsx` (detail/approve) — the sales-side approval step that runs after a PO is added via [PurchaseOrder](./PurchaseOrderREADME.md)'s Add/Edit dialog: an email is fired to sales users on Add, and this pair of pages is where they review the PO against SAP's own PO data and flip it to approved.

Routes (both registered in `App.tsx`, under `/Home`):
- `POApproval` — list of POs pending approval.
- `POApprovalDetails/:id` — single PO's full detail + Approve action, keyed by `poenquiries.id` (not PO number, since PO numbers aren't guaranteed unique across customers).

## List (`POApproval`)

- Loads `GET /api/Sales/PendingPOApprovals` on mount — server-side filtered to `poenquiries` rows where `Approvalstatus != "YES"` (so already-approved POs never appear here; there's no "show approved too" toggle).
- Columns: PO Number, Enquiry, PO Amount, PO Date, Payment Terms, Status (a colored `Chip` — "Approved" / "Pending Approval" — rendered from the raw `YES`/`NO` `approvalstatus` value; in practice every row shows "Pending Approval" since the endpoint already filters to unapproved rows, but the column is left in case that filter is loosened later).
- Row click navigates to `/Home/POApprovalDetails/{id}`.
- **Export to Excel** button (`ExportButton` + `exporttoexcel`, same pattern as `PurchaseOrder.tsx`): exports the currently loaded rows with `approvalstatus` remapped to the readable "Approved"/"Pending Approval" text (not the raw `YES`/`NO`) before handing off to `exporttoexcel`.

## Detail + Approve (`POApprovalDetails`)

Fetches `GET /api/Sales/PoApprovalDetails/{id}` on mount (and again after a successful approve, to refresh the status chip/button state in place rather than navigating away).

Three read-only sections, laid out as compact gradient-header `Card`s (same visual language as `AllocatePOtoJob.tsx` — `sectionCardStyle`/`sectionHeaderStyle`/`readOnlyLabelStyle`/`readOnlyValueStyle`, small bold dark-blue values on grey caption labels):

1. **PO Details** — PO Number, Enquiry No, Quote No, PO Date, PO Amount, Balance Amount, Currency (resolved server-side from `pcurrency_id`: `2→USD`, `3→EURO`, else `INR`), Conversion Rate, Payment Terms, SEZ, Comments.
2. **Scope of Work** — one row per scope (Layout/Analysis/VA/NPI/Library/DFM/Onsite) with Qty/Rate-per-Hr/Amount, **filtered to only scopes with `qty > 0`** (a PO that only used, say, Layout won't show six empty rows for the other scopes). Section is omitted entirely if no scope has a positive qty.
3. **SAP PO Data** — a table of matching rows from the `sappodata` table (Customer Name, PO Number, PO Date, Sales Order Qty, Total Order Qty, Open Qty, Payment Term, Currency, Net Price), joined server-side on trimmed `PurchaseOrderNumber == poenquiries.pponumber`. **One-to-many**: a single PO commonly has multiple SAP line items (confirmed in prod data — e.g. one PO number mapped to 10 rows), so this renders as a table, not a single record. Shows a "No SAP PO data found for this PO number" message when the join returns nothing (SAP data import hasn't run yet, or the PO number doesn't match anything on the SAP side).

**Approve button**: `POST /api/Sales/ApprovePO/{id}/{sessionUserId}` (`sessionUserId` from `sessionStorage.SessionUserID`, default `"guest"`) — sets `poenquiries.Approvalstatus = "YES"`, `pupdatedby`, `pupdatedon`. Disabled once `approvalStatus === "YES"` (button label becomes "Approved") and while the request is in flight ("Approving..."). No role restriction — any logged-in user can approve (decided to match how most of this module works: only PO **Delete** is gated behind `useRoleAccess(loginId, "adminuser")`, nothing else in the PO pages currently checks role).

## Backend

New endpoints on `SalesController`, backed by `SalesService`/`SalesRepository`:

- `GET PendingPOApprovals` → `_service.GetPoEnquiriesAsync()` filtered to `Approvalstatus != "YES"`.
- `GET PoApprovalDetails/{id}` → `SalesRepository.GetPoApprovalDetailsAsync(id)`: `FindAsync` the `poenquiries` row, then queries `_context.sappodata` (see below) for all rows whose trimmed `PurchaseOrderNumber` matches the PO's trimmed `pponumber`, and maps everything into `PoApprovalDetailsDto` (`Application/DTOs/PoApprovalDto.cs`).
- `POST ApprovePO/{id}/{sessionUserId}` → `SalesRepository.ApprovePOAsync(id, sessionUserId)`: sets `Approvalstatus = "YES"` + audit fields, `SaveChangesAsync`.

### `sappodata` — newly wired into EF Core

`Domain/Entities/sappodata.cs` mirrors a real, pre-existing MySQL table (confirmed via direct `DESCRIBE sappodata`) that had **no EF Core wiring at all** before this feature — no `DbSet`, and the table itself has no primary key. It's now registered as `[Keyless]` (same pattern as `ThreeMonthConfirmedOrders.cs` and other stored-proc/report entities in this codebase) and exposed as `AppDbcontext.sappodata`. How this table gets populated from SAP (import job, manual load, etc.) is outside this feature's scope — it's read-only here.

### PO-added email now links here

`SalesService.SendPOApprovalEmailAsync` (fired from `AddPOAsync` after a successful insert) now includes a "Review & Approve PO" button/link pointing at `{ClientApp:BaseUrl}/Home/POApprovalDetails/{id}`. This required changing `AddPOAsync`'s return type from `Task<bool>` to `Task<long>` (the new row's `id`, `0` on failure) all the way through `ISalesRepository` → `SalesRepository` → `ISalesService`/`SalesServices` (the public service-layer method is still `Task<bool>`, converted from `newId > 0`, so the controller/frontend contract for `POST /api/Sales/AddPO/{sessionUserId}` didn't change).

`ClientApp:BaseUrl` is a new config section in `appsettings.json` (`IOptions<ClientAppSettings>`, injected into `SalesService`), following the same commented multi-environment pattern already used for `ConnectionStrings:Conn` (local / test server / prod, one active line + the others commented out) — whichever one is deployed needs its own value here since the API has no other way to know the frontend's host/port.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/PendingPOApprovals` | List rows for the pending-approval grid |
| GET | `/api/Sales/PoApprovalDetails/{id}` | Full PO + scope + SAP PO Data detail for one PO |
| POST | `/api/Sales/ApprovePO/{id}/{sessionUserId}` | Approve the PO (`Approvalstatus = "YES"`) |

## Known gaps / notes

- Approval is a one-way flip — there's no "reject"/"un-approve" action anywhere in this pair of pages (or elsewhere in the app, as far as this feature goes).
- `GET PendingPOApprovals` re-derives its rows from `GetPoEnquiriesAsync()` (the same call `PurchaseOrder.tsx` uses) filtered in the controller rather than a dedicated repository query — an extra `Where` on an already-loaded list rather than pushing the filter into the DB query, negligible at current data volumes but worth revisiting if the `poenquiries` table grows large.
- The SAP PO Data join is a plain trimmed string match (`PurchaseOrderNumber == pponumber`) with no normalization beyond `Trim()` — a PO number that differs only in case or punctuation between `poenquiries` and `sappodata` won't match, and the section will silently show "No SAP PO data found" instead of surfacing a near-match.
- No pagination/date-range filter on the pending list — as the approval backlog grows, `PendingPOApprovals` returns every unapproved PO in one response.
