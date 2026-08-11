# SalesMeetingRecorder

`src/models/Sales/SalesMeetingRecorder.tsx` — log a customer call/meeting record, and browse previously recorded meetings. Migrated from the legacy `SalesMeetingRecorder.aspx` / `SalesMeetingRecorder.aspx.vb` WebForms page (noted directly in the backend code comments).

Route: `/Home/SalesMeetingRecorder` (registered in `App.tsx`). Single page, no `:id` param — it's a log-and-browse form, not an edit workflow (no update/delete of existing records anywhere in this component or its API).

## Data flow

1. On mount, `GET /api/Sales/SalesMeetingCustomers` populates the Customer Name dropdown — every distinct non-empty `customer.Customer` value in the DB (not scoped to a sales responsibility or "active" flag; every customer ever entered shows up).
2. The form itself (Customer Name*, Contact Person*, Called Date*, Reached By*, Mode of Meeting, Remarks, Next Followup Date) is plain local state, not React Hook Form — `handleSubmit` runs manual required-field checks (`toast.error` per missing field) before posting.
3. Submit → `POST /api/Sales/AddSalesMeetingRecord` with the four required fields trimmed, `modeOfMeeting`/`remarks`/`followupDate` sent as `null` when blank, plus `sessionLoginId`/`sessionLoginName` from `sessionStorage`. On success, the form clears (`clearFields`, which resets Called Date back to today rather than blanking it) and, if the history panel is already open, silently re-fetches it so the new record appears without the user needing to click "View Meeting History" again.
4. **View Meeting History** is opt-in — `showHistory` starts `false`, so `GET /api/Sales/SalesMeetingHistory` (all rows, no filter/pagination) only fires when the button is clicked, not on page load.
5. **Export to Excel** (only visible once history is loaded) reformats `calledDate`/`followupDate` through `formatDateYYYYMMDD` before handing off to `exporttoexcel`, so the exported sheet doesn't show raw ISO timestamps.

## Backend

`SalesController` (`SalesMeetingCustomers` / `AddSalesMeetingRecord` / `SalesMeetingHistory`) → `SalesService` (pure passthrough, no logic — `GetSalesMeetingCustomersAsync`/`AddSalesMeetingRecordAsync`/`GetSalesMeetingHistoryAsync` each just call the matching `_salesRepository` method) → `SalesRepository` → `Domain/Entities/SalesMeetRecorder.cs`, mapped to/from `Application/DTOs/SalesMeetingRecorderDtos.cs` (`AddSalesMeetingRecordRequestDto` in, `SalesMeetingHistoryRowDto` out).

- **Customers**: `_context.customer.Where(Customer != null && != "").Select(Customer).Distinct().OrderBy(...)`.
- **Add**: `Seqno` (the `[Key]` primary key on `SalesMeetRecorder`) is **not** DB auto-increment — it's computed as `MAX(Seqno) + 1` in application code (`_context.SalesMeetRecorder.MaxAsync(x => (int?)x.Seqno) ?? 0`), matching the legacy VB page's own behavior rather than delegating to the table. `UpdatedTime` is stored as a plain `DateTime.Now.ToString()` string (culture-dependent format, not a `DateTime` column).
- **History**: `_context.SalesMeetRecorder.AsNoTracking().OrderByDescending(Seqno)`, mapped straight into `SalesMeetingHistoryRowDto` — most-recently-added record first.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/SalesMeetingCustomers` | Customer Name dropdown options (distinct `customer.Customer`) |
| POST | `/api/Sales/AddSalesMeetingRecord` | Log a new meeting/call record |
| GET | `/api/Sales/SalesMeetingHistory` | All recorded meetings, newest (`Seqno` desc) first |

## Known gaps / notes

- **`Seqno` race condition**: computing `MAX(Seqno) + 1` in application code instead of using a DB auto-increment/identity column means two concurrent `AddSalesMeetingRecord` requests can read the same max value and attempt to insert the same `Seqno` — the second insert would fail on the primary-key constraint (or silently collide, depending on how the caller handles the resulting exception). No retry/locking around this.
- **`FollowupDate` nullability mismatch**: `AddSalesMeetingRecordRequestDto.FollowupDate` is a non-nullable `DateTime` (no `[Required]`, but also no `?`), while the frontend explicitly sends `followupDate: null` whenever the optional Next Followup Date field is left blank. With this project's `System.Text.Json`-based body binding, a JSON `null` against a non-nullable `DateTime` property typically fails deserialization before the controller action (and its try/catch) ever runs, surfacing as a generic 400 rather than a friendly toast — leaving Next Followup Date blank is likely to error rather than save with an empty date. The matching entity property (`SalesMeetRecorder.FollowupDate`) has the same non-nullable `DateTime` shape, so even if binding succeeded there's no clean way to persist "no followup date" (it would default to `0001-01-01`).
- No edit or delete for existing meeting records anywhere in this feature — once logged, a record can only be viewed/exported, never corrected or removed through the UI.
- History has no date-range filter or pagination — `GetSalesMeetingHistoryAsync` always returns every row in the table.
- `GetSalesMeetingCustomersAsync` returns every customer ever created, with no scoping to the logged-in user's sales responsibility (unlike some other Sales pages, e.g. `Customers?sales_resp_id=`) — a large customer master list will make this dropdown correspondingly long.
