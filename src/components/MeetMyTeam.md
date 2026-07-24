# MeetMyTeam

`components/MeetMyTeam.tsx`

Data-grid view listing the current user's direct reports (name, title, cost center, email, description, age, cell number).

## Props
| Prop | Type | Purpose |
|---|---|---|
| `members` | `TeamMember[]?` | If provided (non-empty), used directly and no fetch happens — lets a parent (e.g. a "switch employee" view) supply another manager's team. |

## Data source
When `members` isn't supplied, fetches `GET /api/Home/EmployeeDetails/{loginId}` (`loginId` from `sessionStorage.SessionUserID`, default `"guest"`) and reads `teamMembers` (or `teamMember`, for API inconsistency) off the response, mapping the raw API shape (`teamMemID`, `teamMemName`, `teamMemJobTiTle`, `teamMemCostcenter`, `teamMemEmailId`, ...) to the flatter `TeamMember` shape via `mapApiMember`.

## Behavior notes
- Column widths adapt slightly based on row count (`effectiveMembers.length > 5`).
- Email column renders a `mailto:` link with an envelope icon; empty email renders the icon with no href.
- Uses `CustomDataGrid2` (shared reusable grid) with built-in search over all displayed fields.

## Session keys read
`SessionUserID` (only when `members` prop is omitted).
