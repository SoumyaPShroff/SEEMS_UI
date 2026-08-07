# EnquiryStatus

`src/models/Sales/EnquiryStatus.tsx` — small standalone form for transitioning a single enquiry's status. Reached from `ViewAllEnquiries.tsx` by clicking an enquiry's status cell, which navigates here with the enquiry number and the status the user came from.

Route: `/Home/EnquiryStatus?enquiryno={enquiryNo}&fromStatus={status}` (registered in `App.tsx`). Both query params are read via `useSearchParams`; `fromStatus` is only used to decide where to navigate back to after a successful update.

## Load sequence

On mount, two independent calls run in parallel:

- `loadEnquiry()` — `GET /api/Sales/EnquiryDetailsByEnquiryno/{enquiryno}` to read the enquiry's current `status`, `enquirytype`, `salesresponsibilityid`, `completeresponsibilityid`. The current status is excluded from the dropdown (see below); `status` itself starts blank so the user must explicitly pick a new one.
- `checkQuoteExists()` — `GET /api/Sales/QuotationDetailsByEnqQuote/{enquiryno}` to check whether at least one quotation exists. If none, an error toast (`toastId: "quote-required"`, deduped) fires immediately and the **Submit** button stays disabled (`disabled={!hasQuote || checkingQuote}`) — a quote is a hard prerequisite for any status change.

## Allowed status transitions (`buildStatusOptions`)

The dropdown options depend on the enquiry's *current* status:

- **Open** → any of the default list except `Open` itself: `Tentative`, `Confirmed`, `Realised`, `Hold`, `Cancelled`, `Rejected By Customer`, `Rejected By Sienna`.
- **Hold** → `Cancelled`, `Confirmed`, `Rejected By Sienna`, `Rejected By Customer` only.
- **Confirmed** → `Realised`, `Hold`, `Tentative`, `Cancelled`, `Rejected By Sienna`, `Rejected By Customer`.
- Any other current status → the default list minus the current status.

`Realised` is in the default list but is treated as a special case rather than a "reason" status once selected (see form fields below).

## Conditional form fields

- **Billing Date** — shown only when `enquiryType === "ONSITE"` and `status === "Realised"`; required in that combination (`validate` in `handleSubmit`).
- **Reason** — shown for `Rejected By Customer`, `Rejected By US`, `Cancelled`, `Hold`, `Confirmed`, `Tentative`.
- **Status Remarks** — shown only for `status === "Realised"`; input is filtered live through `REMARKS_ALLOWED_CHARS_REGEX`.
- **Tentative Start Date** — shown only for `status === "Confirmed"`; required when `enquiryType === "OFFSHORE"`.

## Validation (`handleSubmit`)

- Enquiry number must be present (from the query string).
- A quote must exist (`hasQuote`).
- Status must be selected.
- Tentative Start Date required if `status === "Confirmed"` and `enquiryType === "OFFSHORE"`.
- Billing Date required if `status === "Realised"` and `enquiryType === "ONSITE"`.

## Submit payload

Before submitting, the recipient list is resolved from login IDs to email addresses via `GET /api/Home/EmailId/{commaSeparatedLoginIds}`:
- `ToMailList` ← `salesResponsibilityId` + `completeResponsibilityId` (from the loaded enquiry).
- `CCMailList` ← the current session user (`loginId`).

If that lookup fails, both lists silently fall back to empty (`toList`/`ccList` stay `[]`; only a console warning is logged).

```ts
PUT /api/Sales/UpdateEnquiryStatus
{
  enquiryno: string,
  status: string,
  billingDate: string | null,      // only when enquiryType === "ONSITE"
  tentativeDate: string | null,    // only when enquiryType === "OFFSHORE"
  reason: string | null,           // only when status is one of the default (reason-eligible) statuses
  statusremarks: string | null,    // only when status === "Realised"
  ToMailList: string,              // JSON-stringified string[]
  CCMailList: string,              // JSON-stringified string[]
}
```

Any 2xx response (or any response with a body) is treated as success. On success: a success toast fires and, after a 1s delay, the user is navigated to `/Home/ViewAllEnquiries?status={fromStatus || status}` — i.e. back to whichever status list they came from, or the newly-set status if `fromStatus` wasn't supplied.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/EnquiryDetailsByEnquiryno/{enquiryno}` | Load current status, enquiry type, sales/complete responsibility IDs |
| GET | `/api/Sales/QuotationDetailsByEnqQuote/{enquiryno}` | Check whether a quotation exists (gates Submit) |
| GET | `/api/Home/EmailId/{loginIds}` | Resolve login IDs → email addresses for To/CC lists |
| PUT | `/api/Sales/UpdateEnquiryStatus` | Apply the status change (see below) |

## Backend: `PUT /api/Sales/UpdateEnquiryStatus`

`SalesController.UpdateEnquiryStatus` → `SalesService.UpdateEnquiryStatus(UpdateEnquiryStatusDto)` (`SeemsAPIService/Application/Services/SalesServices.cs`):

1. Validates `enquiryno` and `status` are non-empty; loads the `se_enquiry` row (404-equivalent `InvalidOperationException` if missing).
2. Sets `enquiry.status = dto.status`, then applies status-specific fields:
   - `Realised` → `enquiry.statusremarks = dto.statusremarks`.
   - `Rejected By Customer` / `Rejected By Sienna` / `Rejected By US` / `Cancelled` / `Hold` / `Confirmed` → `enquiry.reason = dto.reason`; additionally for `Confirmed`, sets `enquiry.billingDate` (if `ONSITE` and provided) or `enquiry.tentStartDate` (if `OFFSHORE` and provided).
3. Saves via `SalesRepository.UpdateEnquiryAsync` + `SaveAsync`.
4. Sends a status-change notification email (`SendEnquiryStatusEmailAsync`, built by `BuildEnqStatusChangedEmailBody`) using the `ToMailList`/`CCMailList` from the request.

## Known gaps / notes

- Both the save step (`UpdateEnquiryAsync`/`SaveAsync`) and the email step are wrapped in try/catch blocks that only log (`_logger.LogError`) and never rethrow. If the save fails, the controller still returns `200 OK` and the frontend still shows "Enquiry status updated." and navigates away — the UI has no way to detect a persistence failure.
- `"Rejected By US"` appears in the frontend's Reason-field visibility list and in the backend's reason-status branch, but it is not one of the statuses ever offered by `buildStatusOptions`/`defaultStatusOptions` (which uses `"Rejected By Sienna"`) — effectively dead/unreachable code on both ends.
- `isReasonStatus` (gating whether `reason` is sent) is computed from `defaultStatusOptions.includes(status)`, which also includes `Realised` — so if `Realised` is ever selected, `reason` would be sent too (in addition to `statusremarks`), even though the Reason input field isn't shown for `Realised`. It would just be `""`/whatever stale value `reason` last held.
- `checkQuoteExists` unconditionally shows the "please add a quote" toast whenever no quote is found, even before the user has interacted with the form — there's no way to dismiss it other than it auto-expiring or the user navigating away.
- Renders its own `<ToastContainer />` rather than relying on the app-level one in `App.tsx` (see `AddEditCustContLocRegREADME.md`/`JobCreationREADME.md` for the duplicate-container issue found and fixed in other components) — not touched here since out of scope for this doc-only pass.
