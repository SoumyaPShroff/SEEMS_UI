# RptBillingPlanner

`src/models/General/Reports/billingplanner/RptBillingPlanner.tsx` — billing planner report. Lets a manager pick a cost center and a month/year, then shows a summary table, four charts, a full billing data grid, and a pending-invoices grid for that period.

Route: `/Home/RptBillingPlanner` (registered in `App.tsx`).

## Manager / cost-center selection

`useManagerCostCenterSelect(loginId, "billingplanner")` (`src/utils/useMgrCostCenterSelect.ts`, wrapping `src/utils/useManagers.ts`) drives the "Select Manager" dropdown:

- Resolves the caller's role via `GET /api/Home/UserDesignation/{loginId}`, then checks `GET /api/Home/UserRoleInternalRights/{role}/billingplanner`.
- **Has the special role** — dropdown is populated from `GET /api/Home/HOPCManagerList` (all HOPC managers) plus a synthetic `"All"` option, and `"All"` is auto-selected by default.
- **Does not have the special role** — falls back to the caller's own cost center(s):
  - Checks `GET /api/Home/CostcenterDelegates/{loginId}` for delegated cost centers.
  - If the caller isn't a manager by job title, resolves their manager via `GET /api/Home/EmployeeDetails/{loginId}` (`reporttopersonid`).
  - If they have delegates, cross-references `GET /api/Home/HOPCManagerList?sessionUserId=` against `GET /api/Home/ManagerCostcenterInfo/{managerCostCenterId}` to build the option list; otherwise just uses `GET /api/Home/ManagerCostcenterInfo/{managerCostCenterId}` directly.
  - Auto-selects the single manager if there's only one option.

Selecting a manager stores `{ hopc1id, hopc1name, costcenter }` as `selectedManager`; the report is generated for `selectedManager.costcenter` ("All" is passed through and excluded from the query params in `useBillingData`, i.e. no `costcenter` filter is sent).

There is a **second, separate, unused** role check in the component itself: an effect calls `UserDesignation` → `UserRoleInternalRights/.../billingplanner` again and stores the result via `setHasCompleteRights`, but the read half of that state is discarded (`const [, setHasCompleteRights] = useState(false)`), so `hasCompleteRights` is computed and thrown away — it gates nothing. See Known gaps.

## Column defaults by employee "functional"

A separate effect fetches `GET /api/Home/EmployeeDetails/{loginId}` and reads `employee.functional`. If it equals `"Selling"`, `isSellingFunctional` is set, and a one-time effect (`hasAppliedFunctionalDefaultRef` guards it from re-running) collapses `columnVisibilityModel` down to a smaller "sales" column set (Job Number, Customer, EnqType, Enquiry No, govt_tender, Estimated Hrs, PO Number, Hourly Rate, PO Rcvd, PO Amount, Billing Type, Flag Raised On, Cost Center, Project Manager, Sales Manager) instead of the default ~14-column view.

## Generating the report

`handleGenerate` (bound to the **Generate** button, requires `selectedManager`) computes `startdate`/`enddate` as the first/last day of the selected `month`/`year`, then fires four requests in parallel via `Promise.all`:

| Call | Endpoint | Purpose |
|---|---|---|
| `fetchBillingData` (`useBillingData` hook) | `GET /api/Job/BillingPlanner?startdate=&enddate=&costcenter=` | Main billing rows (job/customer/dates/hours/PO/etc.) |
| Invoice dictionary | `GET /api/Job/InvoiceDictionary/{startdate}/{enddate}` | `{ jobnumber, month, year }` list, turned into a `Set<"jobnumber_month_year">` used to color-code invoiced rows |
| Pending invoices | `GET /api/Sales/PendingInvoices/{costcenter}` | Rows for the "Invoice Pending Data" grid |
| Lib-worked jobs summary | `GET /api/Job/BillSummaryofLibWorkedJobs?startdate=&enddate=` | Per-category Library/Analysis/NPI/VA/CAM hour buckets, used to re-bucket summary amounts (see below) |

On success: builds the category summary (`buildSummaryFromData`), the pending-invoice summary (`buildPendingSummary`), sums `wipAmount` into `wipSumData` and `poAmount` into `totalDesignVA` (both fed to the Design vs WIP chart), and flips `showResults` to true. Any failure clears `summary`/`showResults` and logs to console (no toast).

## Summary calculation (client-side)

`buildSummaryFromData` groups billing rows into 4 categories via `mainCategoryFor(enqType, type)`:

- `OFFSHORE` + `Export` → **At Office Export**
- `OFFSHORE` + `Domestic` → **At Office Domestic**
- `ONSITE` + `Export` → **Onsite Export**
- `ONSITE` + `Domestic` → **Onsite Domestic** (also the default fallback for unrecognized combinations)

Within each category bucket (`TotalsRow`), each row's `poAmount` is added to one of `Layout / Analysis / GovtLayout / GovtAnalysis / Library / DFM / VA / NPI` based on the job number suffix (`columnFor`): `_VA` → VA, `_NPI` → NPI, `_DFM`/`_CAM`/`_CEG` → DFM, `_Lib` → Library, `_Analysis` → Analysis (or GovtAnalysis if `govt_tender === "YES"`), anything else → Layout (or GovtLayout). `ECO` is summed separately and not part of the job-number classification. `GrandTotal` is the sum of the other columns (excluding ECO).

After the base buckets are built, `libWorkedAdjustmentRules` (~30 rules covering Lib/Analysis/NPI/VA/CAM × Onsite/Offshore × Domestic/Export combinations) move amounts *within* a bucket from the non-library columns into `Library` or `DFM`, using the per-category numeric fields returned by the lib-worked-jobs endpoint (`moveAmount` deducts proportionally from the source columns up to the amount available). `buildPendingSummary` does the same category/column bucketing for the pending-invoice rows (grand total there excludes VA/NPI, only Layout+Analysis+GovtLayout+GovtAnalysis+Library+DFM).

## Charts

`ChartsSection` renders four charts (all under `./billingplancharts/`), each fed the same `data` array (all billing rows) plus the two aggregate numbers:

- `ProjectionVsTargetChart`
- `SegmentWiseBillingChart`
- `ProjectManagerChart`
- `SalesManagerChart`
- `DesignVsWipChart` — takes `totalDesignVA`, `wipSumData`, and a hardcoded `targetAbs={50000000}`.

## Billing data grid

`CustomDataGrid` (MUI DataGrid wrapper) with ~35 columns (job number through NDA validity). Notable behavior:

- **Expand/collapse**: each row has a `+`/`-` button (`expandedRows` set) that inserts a synthetic detail row directly beneath it showing `TaskType | EnquiryNo | PONumber` (`rowsWithExpansion`, built via `colSpan` on the job-number column for detail rows).
- **Row color coding** (`getRowClassName`), evaluated in order:
  1. `row-detail` — synthetic expansion row.
  2. PO not received (`poRcvd` is `"NO"`/empty): `row-red` if the realised date is more than 7 days old, else `row-purple`.
  3. A flag date (`flagRaisedOn`) is present: `row-green` if the job+month+year key exists in the invoice dictionary Set; else `row-blue` if the flag was raised in the currently selected month/year; else `row-black`.
  4. No flag date: `row-black`.
  The legend shown above the grid (blue = flag raised this month, magenta = job without PO, green = invoiced, red = PO overdue) doesn't fully enumerate `row-purple`/`row-black`.
- **Search**: `SearchControl` filters `filteredData` client-side (case-insensitive substring match across every field of every row) — not a server call.
- **Column visibility**: persisted to `localStorage["billingPlannerColumnVisibility"]` on every change, but nothing reads that key back on mount (see Known gaps).
- **Export**: "Export to Excel" button calls `exporttoexcel` with the *filtered* (not expanded/detail) rows and the same column definitions, producing `BillingPlanner-Data.xlsx`; a second export button on the pending-invoices grid produces `BillingPlanner-PendInv.xlsx` from the *unfiltered* `data` (main billing rows, not the pending rows — see Known gaps) using `pendingInvoiceColumns`.

A link at the top of the results ("Previous Billing Data") navigates to `/Home/PreviousBillingDataReport`.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Home/UserDesignation/{loginId}` | Role lookup (manager-select access + the unused `hasCompleteRights` check) |
| GET | `/api/Home/UserRoleInternalRights/{role}/billingplanner` | Special-role flag for manager selection (and the unused duplicate check) |
| GET | `/api/Home/EmployeeDetails/{loginId}` | Caller's cost center/manager/`functional` (drives both manager fallback and column defaults) |
| GET | `/api/Home/CostcenterDelegates/{loginId}` | Delegated cost centers for the manager dropdown |
| GET | `/api/Home/HOPCManagerList[?sessionUserId=]` | All HOPC managers (special-role case, or cross-reference for delegates) |
| GET | `/api/Home/ManagerCostcenterInfo/{loginId}` | Cost center(s) for a specific manager |
| GET | `/api/Job/BillingPlanner?startdate=&enddate=&costcenter=` | Main billing report rows |
| GET | `/api/Job/InvoiceDictionary/{startdate}/{enddate}` | Invoiced job/month/year keys, for row color-coding |
| GET | `/api/Job/BillSummaryofLibWorkedJobs?startdate=&enddate=` | Per-category Library/Analysis/NPI/VA/CAM hour buckets |
| GET | `/api/Sales/PendingInvoices/{costcenter}` | Pending-invoice rows |

All confirmed against `JobController.cs` (`BillingPlanner`, `InvoiceDictionary`, `BillSummaryofLibWorkedJobs`) and `SalesController.cs` (`PendingInvoices`), plus `HomeController.cs` for the Home endpoints.

## Known gaps / notes

- **~1,100 lines of commented-out dead code** at the bottom of the file (from `// ----------------   live code without lib,va hrs addons-------------` to EOF) — an entire earlier version of the component, left in as a comment block rather than removed (source control already has the history).
- `hasCompleteRights` is computed via a redundant `UserDesignation`/`UserRoleInternalRights` check but its setter's paired value is discarded (`const [, setHasCompleteRights] = useState(false)`), so the check runs on every mount for no effect.
- `columnVisibilityModel` is written to `localStorage["billingPlannerColumnVisibility"]` on every change but is never read back on mount — the persistence is a no-op today.
- Pending-invoices "Export to Excel" (`handleInvPenExport`) exports `data` (the main billing rows) with `pendingInvoiceColumns`, not `invoicePendingData` (the actual pending-invoice rows shown in that grid) — likely a copy-paste bug, since the columns and the displayed grid both refer to pending invoices but the exported dataset doesn't match.
- Several `console.log`/`console.error` debug statements are left in production code, including a "Debug CAM ->" log inside `buildSummaryFromData` that fires on every generate for every lib-worked-jobs row/rule combination.
- `YEARS` is a hardcoded `2020..2031` range (12 entries) — will need updating (or making dynamic) once 2031 passes.
- `DesignVsWipChart`'s `targetAbs={50000000}` is a hardcoded target with no UI to configure it.
- A cost-center `"45240"` exclusion for the Project Manager chart exists only in the commented-out dead code (`ChartsSection`'s old version filtered it out via `projectManagerChartData`); the live `ChartsSection` passes the full `data` to every chart, so that exclusion is not currently applied.
