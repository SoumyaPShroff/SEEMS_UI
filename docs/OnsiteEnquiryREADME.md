# OnsiteEnquiry

`src/models/Sales/OnsiteEnquiry.tsx` — create/edit form for an **ONSITE** sales enquiry (`se_enquiry.enquirytype = "ONSITE"`). Sibling of `OffshoreEnquiry.tsx`; the onsite variant adds resourcing/engagement fields (tool license, logistics, duration, hourly rate, experience range, tentative start date) that the offshore form doesn't need, since onsite work staffs an engineer at the customer's site for a billed duration rather than an offshore project scope (design/layout/analysis checkboxes).

Route: `/Home/OnsiteEnquiry/:enquiryNo` (registered in `App.tsx`) — `enquiryNo` present ⇒ edit mode (`isEditMode`), absent ⇒ add mode.

## Data flow

1. On mount, one `Promise.all` loads all lookups in parallel: customers, states, sales managers, HOPC managers, tools, HOPC tasks, an **unscoped** customer-locations list, an **unscoped** customer-contacts list, and all active employees.
2. Selecting a **Customer** (`handleChange`, `name === "customerId"`) clears `locationId`/`contactName`/`email11` and calls `fetchCustomerLocations(customerId)` → `GET /api/Sales/customerlocations?customerId=`.
3. Selecting a **Location** clears `contactName`/`email11` and calls `fetchCustomerContacts(customerId, locationId)` → `GET /api/Sales/customercontacts?customerId=&locationId=`.
4. Selecting a **Contact** auto-fills `email11` from the matched contact's `email11` (two separate effects do this: one on `form.contactName` alone, one on `[form.contactName, lookups.Contacts]` — functionally redundant, see Known gaps).
5. **Edit mode**: an effect fetches `GET /api/Sales/EnquiryDetailsByEnquiryno/{enquiryNo}`, then sequentially sets `customerId` → awaits `fetchCustomerLocations` → sets `locationId` → awaits `fetchCustomerContacts` → sets the remaining fields (billing type, tool license, logistics, onsite duration, hourly rate, experience range, dates, responsibilities, remarks, uploaded filename, tool id/task id, resource count, type, SI/PI flags, tool name).
6. Submit (`handleSubmit`) validates required fields, builds a `FormData` payload, resolves email recipient lists, and `POST`s (add) or `PUT`s (edit) to the enquiry endpoint.

## Submit payload (`multipart/form-data`)

Matches `EnquiryDto` (`SeemsAPIService/Application/DTOs/EnquiryDto.cs`) field-for-field:

```
customer_id, location_id, contact_id, statename, tm, tool, toolId, taskId,
expFrom, expTo, noOfResources, tentStartDate (ISO), logistics, onsiteDurationType,
hourlyRateType, hourlyReate, onsiteDuration, profReqLastDate (ISO),
quotation_request_lastdate (ISO, set equal to profReqLastDate), salesresponsibilityid,
completeresponsibilityid, type, enquirytype ("ONSITE"), si, pi, toolLicense,
createdBy, createdOn, remarks, referenceBy, ToMailList (JSON string[]),
CCMailList (JSON string[]), inputreceivedthru, file, uploadedfilename, sessionUserId,
enquiryno (edit mode only)
```

Numeric-typed DTO fields (`toolId`, `taskId`, `expFrom`, `expTo`, `noOfResources`, `logistics`, `onsiteDurationType`, `hourlyRateType`, `hourlyReate`, `onsiteDuration`, `toolLicense`) are coerced with `Number(...)` before appending, since `FormData` values are always strings and empty/non-numeric input would otherwise bind as `0`.

### Email recipient resolution

- **To**: `buildEmailRecipientList()` looks up `salesresponsibilityid` and `completeresponsibilityid` against the combined `SalesManagers` + `HOPCManagers` lookup lists, pulls each match's `emailID`, dedupes. Falls back to `["noreply@system"]` if empty.
- **CC**: the current session's login ID is resolved to an email via `GET /api/Home/EmailId/{loginId}`.

## Validation (`handleSubmit`, inline before building `FormData`)

Required: `customerId`, (`tool` or `toolId`), `salesresponsibilityid`, `completeresponsibilityid`, `noOfResources`, `expFrom`, `expTo`, `profReqLastDate`, `tentStartDate`, `hourlyReate`. A single combined `if` shows one of three toast messages (missing tool / missing tool id / generic "Required fields missing") — it does not identify which of the other fields is missing.

Numeric-only input is enforced live via `handleNumericChange` (`expFrom`/`expTo`/`noOfResources`), `handleTwoDigitNumber` (`onsiteDuration`, max 2 digits), and `handleHourlyRateChange` (up to 2 decimals). Remarks are filtered through `REMARKS_ALLOWED_CHARS_REGEX`.

## Task → SI/PI auto-mapping

`handleChange` for `name === "taskId"` sets `SI = "YES"` when the task id is `182`, `PI = "YES"` when it's `183` (magic numbers, presumably specific `se_hopc_task` rows). **This never fires in the current UI** — the Task `SelectControl` that would drive `taskId` is commented out in the JSX (see Known gaps), so `SI`/`PI` are only ever populated in edit mode via the hydrate effect, never through user interaction in add mode.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/customers` | Customer dropdown |
| GET | `/api/Sales/States` | State dropdown |
| GET | `/api/Home/SalesManagers` | Sales Responsibility dropdown + email lookup |
| GET | `/api/Home/HOPCManagerList` | Complete Responsibility dropdown + email lookup |
| GET | `/api/Job/AllTools` | Tool dropdown |
| GET | `/api/Home/HOPCTasks` | Task lookup (fetched, not rendered — see Known gaps) |
| GET | `/api/Sales/customerlocations[?customerId=]` | Location dropdown, scoped once a customer is picked |
| GET | `/api/Sales/customercontacts[?customerId=&locationId=]` | Contact dropdown, scoped once a location is picked |
| GET | `/api/Home/AllActiveEmployees` | Reference By dropdown |
| GET | `/api/Sales/EnquiryDetailsByEnquiryno/{enquiryNo}` | Edit-mode hydration |
| GET | `/api/Home/EmailId/{loginId}` | Resolve current user's email for CC list |
| POST | `/api/Sales/AddEnquiryData` | Create enquiry (`SalesController.AddEnquiry` → `SalesService.AddEnquiryAsync`) |
| PUT | `/api/Sales/EditEnquiryData` | Update enquiry (`SalesController.EditEnquiry` → `SalesService.EditEnquiryAsync`) |

Both `AddEnquiryAsync`/`EditEnquiryAsync` persist the `se_enquiry` row, save the uploaded file (if any), attempt to send the notification email, and return `{ message, FileName, EmailSent }` (serialized as `emailSent` under ASP.NET Core's default camelCase JSON policy) — email failure does not fail the request.

## Known gaps / notes

- **Success toast shown on failure.** In `handleSubmit`, both the `!res.ok` branch and the `catch` block have their `toast.error(...)` calls commented out and instead show `toast.success("✅ Enquiry added successfully.")` (or the `emailSent === false` warning variant) regardless of the actual failure. A user will see a success message even when the save request failed or the network call threw. This looks like a debugging leftover rather than intended behavior.
- **Task dropdown is dead.** The `taskId` `SelectControl` (which would drive the SI/PI auto-mapping) is commented out in the JSX. `HOPCTasks` is still fetched into `lookups` but nothing reads it. In add mode `taskId` stays `""` (sent as `0`) and `SI`/`PI` stay unset unless carried over from edit-mode hydration.
- **`toolId` is a placeholder.** `handleChange` for `name === "tool"` sets `toolId` to the tool's *name* string, not a real numeric id, with an explicit inline comment marking it "temporary: use tool name as ID until we have proper mapping." `toolId` is then `Number(...)`-coerced before submit, so unless the tool name happens to be numeric this sends `0`/`NaN→"0"`.
- **`jobnames` is unused.** Present in `EnquiryForm` and initial state, but its `TextField` ("Project Reference") is commented out in the JSX and the field is never appended to the submit `FormData`.
- **Duplicate email-autofill effects.** Two separate `useEffect`s both auto-fill `email11` from the selected contact — one keyed on `[form.contactName]`, another on `[form.contactName, lookups.Contacts]`. Functionally redundant; the second (broader-keyed) one supersedes the first in practice.
- **Unscoped initial location/contact fetch.** The mount-time `Promise.all` calls `customerlocations`/`customercontacts` with no `customerId`/`locationId` query params, loading the endpoints' default/full result before any customer is selected; those results are immediately overwritten once `fetchCustomerLocations`/`fetchCustomerContacts` run for the chosen customer.
- **Local `<ToastContainer />`.** This component renders its own `<ToastContainer />` (no props) in addition to the global one in `App.tsx` — the same duplicate-container pattern flagged and removed from `JobCreationForm.tsx`; two simultaneous containers can double-render or otherwise misbehave for a single `toast()` call.
- Errors from the initial lookups `Promise.all` are not caught — if any one of the nine parallel fetches rejects, the whole form is left with empty `lookups` and no user-facing error.
