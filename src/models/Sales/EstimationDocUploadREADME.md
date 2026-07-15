# EstimationDocUpload

`src/models/Sales/EstimationDocUpload.tsx` — single-purpose form for uploading the estimation document for an enquiry, marking that enquiry's estimation as complete.

Route: `/Home/EstimationDocUpload?enquiryno={enquiryNo}` (registered in `App.tsx`). The enquiry number is read from the query string via `useSearchParams`, not a path param; if missing, the component renders only an error message ("Enquiry number is missing.") instead of the form.

## Behavior

1. User picks **Enquiry Type** (`OFFSHORE` / `ONSITE`, default `OFFSHORE`) via a radio group.
2. If `ONSITE`, an additional **Hours** number field appears and is required before upload.
3. User picks a file via **Choose File** (native `<input type="file">`, no client-side type/size restriction).
4. **Upload Document** is disabled until a file is selected. On click (`handleUpload`):
   - For `ONSITE` with blank Hours, shows an error toast and aborts.
   - Renames the file client-side (see below) and posts it as `multipart/form-data`.

## Client-side file naming

`buildEstimationFileName(originalFileName)` renames the file before upload:

```
{enquiryNo without single quotes}-{sessionLogin}-{day}-{month}-{year}-{hour}-{minute}-{second}-{originalFileName}
```

`sessionLogin` is `sessionStorage.SessionUserID`, falling back to `SessionUserName`, then `"guest"`. The renamed `File` object (same content/type, new name) is what's actually uploaded — the original filename is preserved only as the trailing segment.

## Upload payload

`POST /api/Sales/UploadEstimationDoc` as `multipart/form-data`:

```
file: File            // renamed per buildEstimationFileName
enquiryno: string
sessionUserId: string  // sessionStorage.SessionUserID, may be ""
enquiryType: "OFFSHORE" | "ONSITE"
Hrs?: string            // only appended when enquiryType === "ONSITE"
```

## Post-upload behavior

On success, shows a persistent success toast (`autoClose: false`) containing a **Return to ViewAllEnquiries** button (navigates to `/Home/ViewAllEnquiries`). If the backend's `emailSent` flag is `false`, the toast text changes to note the email notification failed, but the upload itself is still treated as successful. On failure, shows an error toast with the HTTP status/status text if available, otherwise a generic failure message.

This component renders its own local `<ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />` in addition to the global one in `App.tsx` — see "Known gaps" below.

## Backend: `POST /api/Sales/UploadEstimationDoc`

Handled by `SalesController.UploadEstimationDoc` → `SalesService.UploadEstimationDocAsync` (`SeemsAPIService/Application/Services/SalesServices.cs`).

1. Validates `enquiryno`, `file` (non-null/non-empty), `enquiryType` are present, and `Hrs` is present when `enquiryType == "ONSITE"`.
2. Looks up the enquiry (`GetEnquiryByNoAsync`); 404s (throws) if not found.
3. Ensures the estimation-docs upload folder exists (`UploadFilePathProvider.GetFolderPath(Constants.ESTIMATION_DOCS)`) and writes the file to disk using the **already-renamed filename sent by the client** (no server-side renaming or collision handling — a second upload with the same client-generated name overwrites the first).
4. Inserts a `se_estimation_docs` row (`EnqNo`, `EnqType`, `pathofDoc` = `~/EstimationDocs/{filename}`, `Hrs` for ONSITE only, `uploadedby`, `uploadeddate`).
5. **Marks the enquiry's estimation as complete**: sets `enquiry.esti = "DONE"` and clears `enquiry.EngineerName = ""`, then saves.
6. Sends a notification email (`SendEstimationUploadEmailAsync`, recipients resolved via `IEmailRecipientService.GetRecipientsAsync("EstCreated")`). Failure here is caught and reported back as `EmailSent: false` in the response rather than failing the whole request.
7. Returns `{ message, enquiryNo, enquiryType, filePath, EmailSent }`.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/Sales/UploadEstimationDoc` | Upload the file, mark estimation complete, notify by email |

Related endpoints exist on the same controller but are not called from this component: `GET /api/Sales/EstimationDocs` (list) and `GET /api/Sales/DownloadEstimationDoc/{enquiryNo}` (download) — used elsewhere (see `EstimationDocList.tsx`).

## Known gaps / notes

- **`esti` value mismatch risk**: this upload flow sets `se_enquiry.esti = "DONE"` to mark estimation complete. Any other code that gates on `esti` should check against `"DONE"`, not `"YES"` — e.g. `SalesRepository.CreateJobAsync`'s pre-creation "Estimation completed" check (see `JobCreationREADME.md`) currently compares `Esti` against `"YES"`, which would never match what this upload path actually writes. Worth confirming which value is correct/intended.
- Duplicate `ToastContainer`: this component renders its own local one on top of the global one in `App.tsx`, the same pattern already found and removed from `JobCreationForm.tsx` — can cause toasts to render twice or behave inconsistently.
- No client-side file type or size validation before upload; whatever the OS file picker returns is sent as-is.
- The uploaded file is saved server-side under the exact filename the client generated, with no collision/overwrite protection — two uploads within the same second for the same enquiry/user would need to differ only by original filename to avoid clobbering each other, otherwise they'd collide (same second-granularity timestamp).
- `enquiry.EngineerName` is cleared as a side effect of uploading an estimation doc; not obviously related to "estimation upload" from the UI's perspective — likely intentional (resetting a stale engineer assignment) but not explained in code.
- The component always defaults `enquiryType` to `OFFSHORE` regardless of the enquiry's actual type; it does not fetch the real enquiry type to pre-select the radio button, so the user must know/re-select it correctly.
