# PlannedHours

`src/models/Projects/PlannedHours.tsx` — grid for allocating a project manager's monthly planned hours per job, for a selected manager/cost-center and month/year. Built on the shared `StandardPageLayout` + `EditableGrid` controls.

## Manager/cost-center selection & access control

Uses the shared `useManagerCostCenterSelect(loginId, "plannedhours", autoSelectDefault=false)` → `useManagers(loginId, "plannedhours")` hook (`src/utils/useMgrCostCenterSelect.ts`, `src/utils/useManagers.ts`), the same role-resolution pattern used elsewhere in the app:

1. `GET /api/Home/UserDesignation/{loginId}` → the caller's job title/role.
2. `GET /api/Home/UserRoleInternalRights/{userRole}/plannedhours` → special-role flag for this page.
3. **Special role** → `GET /api/Home/HOPCManagerList` (all managers), plus a synthetic `"All"` option prepended.
4. **Not special role** →
   - `GET /api/Home/CostcenterDelegates/{loginId}` and (only if the caller's title doesn't contain "manager") `GET /api/Home/EmployeeDetails/{loginId}` run in parallel (`Promise.allSettled`, so one failing doesn't block the other).
   - If the employee lookup succeeds, `reporttopersonid` becomes the "manager cost center id" to look up (delegated user acting on their manager's behalf); otherwise it falls back to `loginId`.
   - If the caller has delegates, the manager list is `HOPCManagerList` filtered down to cost centers returned by `GET /api/Home/ManagerCostcenterInfo/{managerCostCenterId}`.
   - Otherwise it's just `GET /api/Home/ManagerCostcenterInfo/{managerCostCenterId}` directly (handles managers with more than one cost center).

Unlike the manager `SelectControl` on this page, `autoSelectDefault` is `false` here, so — unlike pages that pass `true` — no manager/cost-center is pre-selected on load; the user must pick one from the dropdown (`"Select"` placeholder option is prepended locally in `managerOptionsWithSelect`).

Selecting a manager sets `filters.managerCostCenter` to `selectedManager.costcenter` (or `"All"`).

## Data flow

1. `filters` = `{ month, year, managerCostCenter }`, defaulting to the current month/year and no cost center.
2. An effect (`[filters.month, filters.year, filters.managerCostCenter]`) calls `loadData()`:
   - If `managerCostCenter` is empty, rows are cleared and nothing is fetched.
   - Otherwise `GET /api/Job/PlannedHours?startdate=&enddate=[&costcenter=]` (start/end computed as the first/last day of the selected month via `getMonthDateRange`; `costcenter` is omitted when the value is `"All"`).
   - Response rows are normalized (`normalizeRows`): `id` defaults to `jobNumber` if missing, `monthlyHrs` defaults to `""` if null/undefined.
3. Grid columns (`GRID_COLUMNS`): Job Number, Customer, Project Manager, Start Date, End Date, Efforts, Billed Hrs, Bal Hrs are all read-only; **Planned Hrs** (`monthlyHrs`, numeric) and **Remarks** (free text) are the only editable cells.
4. Editing a cell (`handleRowsChange`) strips disallowed characters from `remarks` via `REMARKS_ALLOWED_CHARS_REGEX` on every change.
5. `handleValidateCellEdit` runs on `monthlyHrs` edits: if the entered value exceeds that row's `balanceHrs`, the cell is flagged `"invalid"`, `hasCellValidationError` is set (disabling Update), and an error toast fires (deduped per `jobNumber-planned-balance` key via `lastInvalidToastKeyRef`). Valid edits clear both.
6. **Update** button (`handleUpdate`): blocked (`toast.error`, no request) if any row's `monthlyHrs` still exceeds `balanceHrs` (`invalidRow`, computed via `useMemo` over `rows`) — this is a second, row-level check independent of the per-cell one. Otherwise it calls `savePlannedHours(rows, filters)`, then `loadData()` again to refresh, then shows a success toast.

## Save payload

`savePlannedHours` builds the month as `YYYY-MM-01` (from `filters.year`/`filters.month`) and **filters out any row where `monthlyHrs` is 0 or blank** — only rows with a positive planned-hours value are sent:

```ts
POST /api/Job/UpdatePlannedHours
[
  {
    jobNumber: string,
    month: "YYYY-MM-01",
    monthlyHrs: number,
    remarks: string,   // REMARKS_ALLOWED_CHARS_REGEX-filtered
  }
]
```

## Backend

`JobController` (`SeemsAPIService/API/Controllers/JobController.cs`) → `JobService` → `JobRepository` (`SeemsAPIService/Infrastructure/Persistence/Repository/JobRepository.cs`):

- **`GET /api/Job/PlannedHours`** (`startdate`, `enddate`, `costcenter?`) → calls the stored procedure `sp_PlannedHours(@start, @end, @costcenter)` and maps into `PlannedHoursData`. All the row math (efforts, billed hours, balance hours) is computed inside that stored procedure, not in application code.
- **`POST /api/Job/UpdatePlannedHours`** (`List<PlannedHoursSaveDto>`) → for each entry, upserts into `billinhrplanner` keyed on `(jobnumber, month.Date)`: updates `monthlyhrs`/`remarks` if a row for that job+month exists, otherwise inserts a new row. `MonthlyHrs` is cast to `int` on write (`(int)(dto.MonthlyHrs ?? 0)`) — fractional hours entered in the UI are truncated, not rounded.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Home/UserDesignation/{loginId}` | Resolve caller's role (via `useManagers`) |
| GET | `/api/Home/UserRoleInternalRights/{role}/plannedhours` | Special-role check for this page |
| GET | `/api/Home/HOPCManagerList[?sessionUserId=]` | Full manager list (special role, or delegate filtering) |
| GET | `/api/Home/CostcenterDelegates/{loginId}` | Whether the caller has delegated users |
| GET | `/api/Home/EmployeeDetails/{loginId}` | Caller's `reporttopersonid` (non-manager, non-special-role case) |
| GET | `/api/Home/ManagerCostcenterInfo/{id}` | Cost center(s) for a given manager/login id |
| GET | `/api/Job/PlannedHours?startdate=&enddate=[&costcenter=]` | Grid rows for the selected month + cost center |
| POST | `/api/Job/UpdatePlannedHours` | Upsert planned hours/remarks per job/month |

## Known gaps / notes

- There are two overlapping "planned hours can't exceed balance hours" checks: the per-cell `handleValidateCellEdit` (marks the cell invalid, disables Update via `hasCellValidationError`) and a redundant row-scan (`invalidRow` via `useMemo`) re-checked again inside `handleUpdate`. Functionally consistent, but the second check is only reachable if the first one's `disabled` state is somehow bypassed.
- A large `handleRowsChange` implementation (with per-row invalid-hours toast logic) is commented out in favor of a simpler version that just sanitizes `remarks`; the invalid-hours toast now happens solely in `handleValidateCellEdit`. Dead code, functioning correctly today but worth deleting.
- The `plannedHours` field name and a `cellClassName` "invalid-cell" branch are present but effectively inert: the grid column is named `monthlyHrs` (the `plannedHours` field/comment is stale), and `cellClassName` always evaluates its `false ? ... : "editable-grid-cell"` condition to the non-invalid branch — cell-level invalid styling is not actually wired to `handleValidateCellEdit`'s return value.
- `monthlyHrs` is typed/edited as a plain number in the UI but truncated to `int` server-side on save; a user entering e.g. `4.5` will silently persist as `4`.
- No client-side guard against selecting a month in a way that conflicts with server expectations (e.g. no min/max year bounds) — relies entirely on `YearMonthFilter`'s own UI constraints, if any.
