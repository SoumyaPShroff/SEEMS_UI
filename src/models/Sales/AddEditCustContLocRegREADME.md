# AddEditCustContLocReg

`src/models/Sales/AddEditCustContLocReg.tsx` — unified customer registration screen. A single form combines what were previously separate Customer / Contact / Location screens, split across four tabs, with three modes (New Entry, Edit, Delete) driven by one `formMode` state.

Route: `/Home/AddEditCustContLocReg` (registered in `App.tsx`).

## Modes

State: `formMode: "new" | "edit" | "delete"`.

- **New Entry** — blank form, all fields cleared, tab reset to Basic Info.
- **Edit** / **Delete** — shows an "Existing Customer Reference" lookup card (`SelectControl` fed by `customerOptions`). Selecting a customer and clicking **Load Record** calls `loadCustomerForMode`, which fetches the customer, its locations, and its contacts in parallel and hydrates the form (`hydrateCustomer`, `hydrateLocations`, `hydrateContacts`).
- Delete mode currently only locks the form (`isDeleteMode` disables fields); actual delete is not wired up (`handleSaveBundle` shows a toast and returns early for `formMode === "delete"`).

Switching modes (`handleModeChange`) clears `form`, `locations`, and `contacts` back to their empty defaults.

## Tabs

| Index | Tab | Contents |
|---|---|---|
| 0 | Basic Info | Customer Type, Sales Responsibility, Company Name, Customer Abbreviation, GST No, PAN No, Currency, Industry, Mode of Invoice (`Portal` / `Email`) |
| 1 | Addresses | Repeatable location blocks (Bill To / Ship To): Location Type, Address, City, State, Country, Pincode, Phone 1, Phone 2, Email |
| 2 | Contacts | Repeatable contact rows: Role, Title, Contact Name, Phone, Alternate Phone, Email |
| 3 | Commercial & SAP | Sales Organization, Distribution Channel, Payment Terms, Tax Classification, Shipping Conditions, Incoterms, SAP Customer Code |

### Tab access control

Access has two independent layers: which tabs are *visible/clickable* (`allowedTabs`), and which tabs' *fields are editable* (`canEditOtherTabs` for tabs 0–2, `canEditCommercial` for tab 3). A tab can be visible but read-only.

Both depend on the logged-in user (`loginId` from `sessionStorage.SessionUserID`):

- **`hasSpecialRole`** — `useRoleAccess(loginId, "viewcustomers")` resolves this by calling `GET /api/Home/UserDesignation/{loginId}` then `GET /api/Home/UserRoleInternalRights/{userRole}/viewcustomers`.
- **`costcenter`** — fetched via `GET /api/Home/EmployeeDetails/{loginId}` (`costcenter` field).

Derived flags:

| User | `allowedTabs` (visible) | Tabs 0–2 editable? | Tab 3 (Commercial & SAP) editable? |
|---|---|---|---|
| Special role, cost center ≠ `45010` | `[0,1,2,3]` | Yes | Yes |
| Special role, cost center = `45010` (`isCommercialOnlyUser`) | `[0,1,2,3]` | No (view-only) | Yes |
| Non-special, cost center = `45010` (`isCostCenterRestricted`) | `[3]` only | n/a (not shown) | Yes |
| Non-special, cost center ≠ `45010` | `[0,1,2,3]` | Yes | No (view-only) |

So for a regular (non-special, non-45010) user, Commercial & SAP is **not** hidden — the tab stays visible and clickable so its data can always be reviewed; only its input controls are disabled (`canEditCommercial` is false). Only cost-center-45010 non-special users actually lose tab access entirely (`allowedTabs = [3]`, tabs 0–2 not in the `<Tab>` list at all).

Implementation: `allowedTabs` (derived each render from `hasSpecialRole` + `costcenter`) drives `disabled` on each `<Tab>`; `canEditOtherTabs` / `canEditCommercial` drive `disabled` on the field controls within each tab. An effect clamps `tab` to `allowedTabs[0]` whenever it falls outside the allowed set (e.g. once the async role/cost-center checks resolve).

This is a UI-level restriction only for tabs 0–2 (nothing stops a network request), but the Commercial & SAP-edit restriction for cost center `45010` is also enforced server-side — see below.

### Customer list scoping (Edit/Delete lookup)

`loadCustomers` decides whether to filter the "Existing Customer Reference" dropdown by the caller's own customers:

- In `formMode === "edit"` **and** the user does not have the special role, it calls `GET /api/Sales/Customers?sales_resp_id={loginId}` (own customers only).
- Otherwise (new mode, delete mode, or special-role users) it calls `GET /api/Sales/Customers` (full list).

The role check inside `loadCustomers` re-derives `hasSpecialRole` inline via the same `UserDesignation` → `UserRoleInternalRights` calls (mirrors the pattern used in `ViewAllEnquiries.tsx`), independent of the `useRoleAccess` hook used for tab gating.

## Data model

- `form: CustomerForm` — Basic Info + Commercial & SAP fields, plus unused legacy bill/ship address fields kept for type compatibility.
- `locations: CustomerLocation[]` — one entry per Bill To / Ship To address; `phone1`/`phone2` both supported.
- `contacts: ContactRow[]` — one entry per contact person.

`buildCustomerDetailsPayload(customerId?)` assembles the save payload:

```ts
{
  SessionLoginId: loginId,
  Customer: { ItemNo, Customer, Customer_Abb, Sales_Resp, Sales_Resp_Id, Customer_Type,
              Gst_No, SapCustCode, industry, modeOfInvoice, currency, panNo, salesorg,
              distributionchannel, cuspaymentterms, taxclassification, shippingconditions,
              incoterms, AddedBy },
  Locations: [{ Location_Id, Customer_Id, Location, Address, PhoneNo1, PhoneNo2,
                AddressType, LocEmail, LocState, LocCountry, LocPincode }],
  Contacts: [{ Contact_Id, Location_Id, Customer_Id, ContactTitle, ContactName,
               Email11, Mobile1, Mobile2, contactrole }],
}
```

`SessionLoginId` is sent purely so the backend can independently apply the cost-center-45010 restriction (see below) — it is not otherwise used by the UI.

Only locations/contacts with at least one populated field are included (`activeLocations`, `isContactRowPopulated`).

## Validation

`validateForm()` (client-side, before save):

- Customer Type, Sales Responsibility, Customer Abbreviation, Company Name required.
- GST No and PAN No required unless Customer Type is `Export`.
- Payment Terms and Incoterms required, but only for users who can edit Commercial & SAP (`canEditCommercial`) — users limited to view-only on that tab aren't forced to fill in fields they can't touch.
- At least one location with data; for any location with data, City/State/Country/Phone 1 are required.
- At least one contact (`validateContactRows`): Role, Title, Name, Mobile required per populated row.

## API endpoints used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/Sales/Customers[?sales_resp_id=]` | Customer lookup list (Edit/Delete reference dropdown) |
| GET | `/api/Sales/CustomerById?itemno=` | Load a single customer for edit |
| GET | `/api/Sales/customerlocations?customerId=` | Load a customer's locations |
| GET | `/api/Sales/customercontacts?customerId=` | Load a customer's contacts |
| GET | `/api/Sales/CustomerIndustry` | Industry options |
| GET | `/api/Sales/CustomerPaymentTerms` | Payment terms options |
| GET | `/api/Sales/LocationCodes` | State/City/Country options |
| GET | `/api/Home/SalesManagers` | Sales Responsibility options |
| GET | `/api/Home/UserDesignation/{loginId}` | Resolve caller's role (special-role + owner-filter checks) |
| GET | `/api/Home/UserRoleInternalRights/{role}/{key}` | Role → access-flag lookup (`viewcustomers`, and inline in `loadCustomers`) |
| GET | `/api/Home/EmployeeDetails/{loginId}` | Caller's cost center (for the 45010 restriction) |
| POST | `/api/Sales/AddCustomerDetails` | Create customer + locations + contacts |
| PUT | `/api/Sales/EditCustomerDetails/{customerId}` | Update customer (+ locations/contacts, unless cost-center-restricted) |

## Backend: cost-center-45010 restriction (defense in depth)

`SalesRepository.EditCustomerDetails` (`SeemsAPIService/Infrastructure/Persistence/Repository/SalesRepository.cs`) enforces the same rule server-side, independent of what the UI sends:

1. Update the `customer` table row from `dto.Customer`.
2. Look up `general_employee.costcenter` for `dto.SessionLoginId`.
3. If that cost center equals `"45010"`, commit and return immediately — **locations and contacts are never read, inserted, updated, or deleted** for that request.
4. Otherwise, proceed with the normal location/contact insert-update-delete sync as before.

This means even if a `45010` user's request is replayed or crafted outside the UI with location/contact data attached, the backend silently ignores that part of the payload. `AddCustomerDetails` (brand-new customer creation) is not restricted this way — a cost-center-45010 user cannot reach that flow anyway since they only ever have the Commercial & SAP tab, and creating a customer requires Basic Info at minimum.

## Known gaps / notes

- Delete mode has no backend call wired up yet (`handleSaveBundle` short-circuits with a toast).
- `CustomerForm` still carries unused `billAddress`/`shipAddress`-family fields left over from an earlier single-address design; the active address model is the `locations` array.
- The "Existing Customer Reference" dropdown and Commercial & SAP options (`salesOrganizationOptions`, `distributionChannelOptions`, `taxClassificationOptions`) are hardcoded in the component rather than fetched from the API.
