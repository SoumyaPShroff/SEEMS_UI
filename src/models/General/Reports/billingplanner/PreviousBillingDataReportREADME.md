# PreviousBillingDataReport

`src/models/General/Reports/billingplanner/PreviousBillingDataReport.tsx` — read-only grid report showing the previous billing cycle's WIP/hourly-rate data, scoped by cost center. Small, single-purpose component (no route registration found under this exact name in `App.tsx` at time of writing — likely rendered as a tab/sub-view inside the billing planner report rather than its own top-level route).

## Data flow

`fetchData` (runs on mount and on "Load Data" click):

1. In parallel: `GET /api/Home/UserDesignation/{loginId}` (role) and `GET /api/Home/EmployeeDetails/{loginId}` (employee record, for cost center) — `loginId` from `sessionStorage.SessionUserID`, default `"guest"`.
2. `GET /api/Home/UserRoleInternalRights/{userRole}/billingplanner` → `hasCompleteRights` (boolean).
3. Cost center is read defensively off the employee response (`costcenter` / `costCenter` / `Costcenter` / `CostCenter`, whichever is populated).
4. `GET /api/Job/PreviousBillingData` — with **no** `costcenter` query param when `hasCompleteRights` is true (server returns data for all cost centers), or `?costcenter={loggedInCostCenter}` otherwise.
5. Response rows are mapped 1:1 into grid rows with a synthetic `id` (`index + 1`).

Any failure in the chain shows a toast (`"Unable to load Previous Billing Data"`) and clears loading state; there's no distinction between "role check failed" and "data fetch failed" — both fall into the same catch.

## Access control

Same `billingplanner` access key as `RptBillingPlanner.tsx`/its sibling report screens (`UserRoleInternalRights/{role}/billingplanner`). Users without that right only ever see their own cost center's rows; the restriction is enforced by passing `costcenter` to the backend, which forwards it into the stored procedure — not a client-side filter of an already-fetched full dataset.

## Grid columns

Job Number, Hourly Rate, Bil PrevDay Hrs (`bilPrevDayHrs`), WipAmount, Costcenter, Name, Working Day (`considered_working_day`). Rendered via the shared `CustomDataGrid2`.

## Export

`handleExport` builds an Excel export via `exporttoexcel`: it appends a synthetic "Total" row summing `wipamount` across all rows (non-finite values coerced to 0), then exports all current grid columns. Does nothing but a warning toast if `rows` is empty.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Home/UserDesignation/{loginId}` | Resolve caller's role |
| GET | `/api/Home/EmployeeDetails/{loginId}` | Caller's cost center |
| GET | `/api/Home/UserRoleInternalRights/{role}/billingplanner` | Complete-rights check |
| GET | `/api/Job/PreviousBillingData[?costcenter=]` | The report data itself |

### Backend

`JobController.PreviousBillingData(string? costcenter)` → `JobService.GetPreviousBillingDataAsync` → `JobRepository.GetPreviousBillingDataAsync` (`SeemsAPIService/Infrastructure/Persistence/Repository/JobRepository.cs`), which calls the stored procedure `sp_PrevBillingData(@costcenter)` via `FromSqlRaw` and maps results onto the `PreviousBillingData` entity. Passing `null` for `costcenter` is what the SP treats as "all cost centers" — the "complete rights" branch relies on that SP behavior rather than any additional backend-side authorization check on the endpoint itself.

## Known gaps / notes

- No backend-side re-validation of `hasCompleteRights` on the `PreviousBillingData` endpoint — it trusts whatever `costcenter` value the client sends (or omits). A user could call the endpoint directly without `costcenter` and get all cost centers' data regardless of their actual rights; the restriction is UI-only, unlike the AddEditCustContLocReg cost-center-45010 rule which is also enforced server-side.
- Cost center is read from the employee response with four different casings tried in sequence — suggests the actual casing returned by `/api/Home/EmployeeDetails` has been inconsistent/uncertain across call sites.
- No pagination or date-range filtering in the UI; the "previous billing cycle" scope is entirely determined by the stored procedure, not any parameter from this component.
