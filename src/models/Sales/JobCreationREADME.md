# JobCreationForm

`src/models/Sales/JobCreationForm.tsx` — single-purpose form for creating a job against a realised enquiry, for either **Fixed-Cost** or **Time and Material** billing.

Route: `/Home/JobCreationForm` (registered in `App.tsx`).

## Data flow

1. User picks a billing type (`Fixed-Cost` / `Time and Material`) via `handleBillingTypeChange`. This resets `enquiry`/`poNumber`/`billingDate`/`boardRef` and clears `enquiries`/`poDetails`.
2. An effect (`[formState.billingType]`) calls `fetchEnquiries(billingType)` → `GET /api/Sales/RealisedEnquiries?billingType=`, populating the Enquiry Number dropdown.
3. Selecting an enquiry triggers an effect (`[formState.enquiry]`) that calls `fetchPONumbers` → `GET /api/Sales/PONumbersByEnquiry/{enquiryNo}`, populating the PO Number dropdown, and resets `poNumber`/`billingDate`/`boardRef`.
4. Selecting a PO triggers an effect (`[formState.poNumber]`) that calls `fetchPODetails` → `GET /api/Sales/PODetailsAsync/{poNumber}`, populating the Purchase Order Summary card (Total Amount, Total Hours, Balance Hours).
5. **Time and Material** additionally requires a Billing Date field; **Fixed-Cost** shows an optional Board Reference field instead (mutually exclusive, `formState.billingType` gated in the JSX).
6. Submit (`handleSubmit`) validates (`validateForm`), then `POST /api/Sales/CreateJob` with the assembled payload.

## Submit payload

```ts
{
  billingType: 'Fixed-Cost' | 'Time and Material',
  enquiry: string,
  poNumber: string,
  poAmount: number,   // from poDetails.totalAmount
  poHours: number,    // from poDetails.totalHours
  sessionLoginName: string,  // sessionStorage.SessionUserName, default 'System'
  sessionLoginId: string,    // sessionStorage.SessionUserID, default 'system-user'
  boardRef?: string,         // Fixed-Cost only
  billingDate?: string,      // Time and Material only
}
```

## Validation (`validateForm`)

- Enquiry is required.
- PO Number is required.
- Billing Date is required when billing type is `Time and Material`.

## Post-submit behavior

On success (`response.data.jobNumber` returned):
- Shows a success toast with the created job number.
- Resets the form locally (`handleClearForm`), clears `poNumbers`/`poDetails`, and re-fetches the enquiry list for `Fixed-Cost` (`fetchEnquiries('Fixed-Cost')`) — **no full page reload**. Only this component's state refreshes; the rest of the app is untouched.
- `loading` is reset to `false` in a `finally` block, covering both the success and error paths (previously only the removed `window.location.reload()` implicitly reset all state on success, and the error path had no reset at all — the button could get stuck disabled after a failed submit).

On error, `err.response.data` is probed across the common .NET error shapes (`message`, `title`, `detail`, `exceptionMessage`, `Message`, or a raw string body) to build a toast message; `showErrorToast` dedupes so the same message isn't toasted twice in a row.

Toasts render through the single global `<ToastContainer>` in `App.tsx` — this component does not render its own `ToastContainer` (an earlier duplicate instance was removed; two simultaneous containers caused toasts to render twice/behave inconsistently).

## Backend: `POST /api/Sales/CreateJob`

Handled by `SalesController.CreateJob` → `SalesService.CreateJobAsync` → `SalesRepository.CreateJobAsync` (`SeemsAPIService/Infrastructure/Persistence/Repository/SalesRepository.cs`).

### Pre-creation checks

Before any job record is written, the enquiry must pass two gates (both throw `InvalidOperationException`, surfaced to the UI as the error toast):

1. **Estimation completed** — `se_enquiry.esti` (exposed as `EnquiryDetailsDto.Esti`) must equal `"YES"`. Otherwise: *"Estimation has not been completed for this enquiry. Job cannot be created."*
2. **Quotation exists** — at least one `se_quotation` row must exist for the enquiry (`enquiryno` match). Otherwise: *"No quotation has been added for this enquiry. Job cannot be created."*

### Job number / scope job generation

For each required scope (Layout, Analysis, Value Analysis, NPI, Library, CAM — derived from the enquiry's scope requirements), a `job` row is created via the private `CreateJobRecordAsync(dto, projectmode, engineerId, engineerName)` helper.

- **Job number**: for `Time and Material` + `ONSITE` enquiries, the number is built from customer abbreviation + billing month/year/day + the resolved engineer display name (spaces stripped); otherwise it's customer abbreviation + sequence + job name.
- **Designer1 / Designer1Id (Designer1ID on the entity)**: populated only when `BillingType === "Time and Material"`, using the enquiry's `EngineerName` (actually an employee login ID) resolved to a display name via `ReusableRepository.GetUserNameAsync`. For any other billing type both fields are `"-"`.

### Post-creation notification

`CreateJobAsync` fires a job-creation email notification (`SendJobCreationNotificationAsync`) without blocking the response. This runs in its **own DI scope** (`IServiceScopeFactory.CreateScope()` → a fresh `ISalesService`), not the request's scope — the request's scoped `AppDbContext` gets disposed as soon as the HTTP response returns, so reusing it from an un-awaited background task previously threw `ObjectDisposedException` after the job had already been created successfully.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/RealisedEnquiries?billingType=` | Enquiry dropdown options |
| GET | `/api/Sales/PONumbersByEnquiry/{enquiryNo}` | PO Number dropdown options |
| GET | `/api/Sales/PODetailsAsync/{poNumber}` | PO summary (amount/hours/balance) |
| POST | `/api/Sales/CreateJob` | Create the job (see above) |

## Known gaps / notes

- `createScopeBasedJobs` (a separate `POST /api/Sales/CreateScopeBasedJobs` call) is commented out in this component; scope-based job creation happens server-side as part of `CreateJob` instead.
- The commented-out `{error && <Alert>...}` block means inline error display is disabled in favor of toasts only; `error` state is still tracked (used for dedupe via `lastErrorRef`) but never rendered.
- No client-side check for estimation-completed / quotation-exists before submit — those are enforced server-side only, so the user finds out via the error toast after clicking Create Job rather than via disabled controls up front.
