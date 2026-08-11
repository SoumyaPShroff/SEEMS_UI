# RaiseFlagRegister

`src/models/Sales/RaiseFlagRegister.tsx` — a date-ranged register of jobs that have had an invoicing "flag" raised, split into two grids: **Pending** (not yet invoiced) and **Invoiced Details**. Acts as the launch pad into [AddEditInvoice](./AddEditInvoiceREADME.md) via per-row deep links.

Route: `/Home/RaiseFlagRegister` (registered in `App.tsx`).

## Data flow

1. On mount, and whenever **Filter** is clicked, `loadData(from, to)` calls `GET /api/Sales/RaiseFlagInvoiceRegister/{flagStartDate}/{flagEndDate}` (`from`/`to` default to the **current calendar month**, computed client-side via `monthStart()`/`monthEnd()`). Both dates are required — an empty date shows a `toast.error` and the request is skipped.
2. The response is a single flat list; the component splits it client-side into `pendingRows` (`!r.isInvoiced`) and `invoicedRows` (`r.isInvoiced`) — there's no separate "pending" vs "invoiced" backend call.
3. Each split is deduplicated (`dedupeRows`, `JSON.stringify`-based exact-row dedupe) before being given a synthetic per-split `id` (`` `${jobnumber}-${index}` ``) for the DataGrid — see Known gaps for why dedup is needed at all.

### Per-row actions

- **Pending** grid: "Add Invoice" link → `navigate(buildInvoiceDeepLink(jobnumber, totalHrs, true))`, where `totalHrs = projectApprovedHrs + ecoApprovedHrs` (both nullable, defaulted to `0` if missing).
- **Invoiced** grid: "Edit Invoice" link → `navigate(buildInvoiceDeepLink(jobnumber, 0, false))` (hours not needed for edit — `AddEditInvoice` looks the existing invoice up by job number).
- Both build the same legacy-format deep link: `` /Home/AddEditInvoice?jobnumber=<jobnumber> TotalHrs=<n> Click=<True|False> `` (URL-encoded) — a string format inherited from the old `invoicing.aspx` page, consumed by `AddEditInvoice.tsx` on mount to auto-select the job and open in Add (`Click=True`) or Edit (`Click=False`) mode.
- A standalone **Add/Edit Invoice** button (top-right of the filter bar) navigates to `/Home/AddEditInvoice` with no query string, for the manual/no-deep-link entry path.

## Backend

`SalesController.GetRaiseFlagInvoiceRegister` → `SalesService.GetRaiseFlagInvoiceRegisterAsync` → `SalesRepository.GetRaiseFlagInvoiceRegisterAsync` (`SeemsAPIService/Infrastructure/Persistence/Repository/SalesRepository.cs`), which is a thin wrapper around one stored procedure call:

```csharp
string sql = "CALL sp_RaiseFlagRegisterRpt(@flagStartDate, @flagEndDate)";
return await _context.sp_RaiseFlagRegisterRpt
    .FromSqlRaw(sql, new MySqlParameter("@flagStartDate", flagStartDate), new MySqlParameter("@flagEndDate", flagEndDate))
    .ToListAsync();
```

`sp_RaiseFlagRegisterRpt` (`Domain/Entities/sp_RaiseFlagRegisterRpt.cs`) is a `[Keyless]` entity — same pattern as other stored-procedure-backed report entities in this codebase (e.g. `ThreeMonthConfirmedOrders`) — mapping directly to the proc's result columns (`jobnumber`, `FlagRaiseOn`, `ProjectApprovedHrs`, `ECOApprovedHrs`, `InvoiceAmount`, `FlagStatus`, `projectmanager`, `InvoiceDate`, `IsInvoiced`, `EmailId`, `PhoneNo`, `POComments`, `PaymentTerms`). All business logic (what counts as a "flag", pending vs. invoiced, hours/amount aggregation) lives inside the stored procedure itself, not in the .NET layer.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/RaiseFlagInvoiceRegister/{flagStartDate}/{flagEndDate}` | Raise-flag register rows for the date range (both pending and invoiced) |

## Known gaps / notes

- `sp_RaiseFlagRegisterRpt`'s underlying joins can fan out and return the **same job more than once** for a given date range (per an explicit code comment in the component) — the frontend compensates with a full-row `JSON.stringify` dedupe rather than the stored proc being fixed to return distinct rows. If the proc ever returns two genuinely different rows for the same job (e.g. two different flag events), this dedupe would only catch exact duplicates, not near-duplicates.
- The proc call has no server-side date validation — `flagStartDate`/`flagEndDate` are passed straight through as strings from the route, so an invalid or reversed date range's behavior is entirely up to the stored procedure (not visible from the C#/TS layers alone).
- `totalHrs` for the "Add Invoice" deep link silently treats missing `projectApprovedHrs`/`ecoApprovedHrs` as `0` (`|| 0`) rather than surfacing that the row is missing approved-hours data before sending the user into `AddEditInvoice`.
- No pagination — both grids render every row the stored proc returns for the selected range in one `CustomDataGrid2` each.
