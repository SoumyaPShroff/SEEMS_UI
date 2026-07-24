# Sidebar

`components/Sidebar.tsx`

Top nav bar + collapsible left sidebar shell for the whole app. Hosts the logo/menu toggle, page title, release-notes bell, optional `headerRight` slot, profile menu, and logout, plus renders the menu tree via `SubMenu`.

## Props
| Prop | Type | Purpose |
|---|---|---|
| `sessionUserID` | `string` | Current user id, used to fetch display name. |
| `setUserId` | `Dispatch<SetStateAction<string \| null>>` | Cleared on logout. |
| `collapsed` / `setCollapsed` | `boolean` / setter | Sidebar collapsed state, lifted to parent. |
| `headerRight` | `ReactNode?` | Optional extra content (e.g. "employee switch") rendered in a popover from the top-right icon. |

## Data sources
- `useSideBarData()` (`SideBarData.tsx`) — builds the `menu` tree from `SessionDesigID`.
- `GET /api/Home/UserName/{sessionUserID}` — resolves display name; falls back to `sessionStorage.SessionUserName`, then `"User"`.
- `useFavourites()` — star/unstar the currently active page from the header.
- `ReleaseNotesText` — array of release note entries; `[0].version` is treated as "latest".

## Behavior notes
- Mobile breakpoint is `window.innerWidth < 768`; below it the sidebar slides off-canvas instead of just narrowing.
- Release notes "new" badge is driven by comparing `localStorage.lastSeenReleaseVersion` to the latest version; clicking the bell clears the badge and persists the seen version.
- Clicking outside the release-notes or header-right popovers closes them (`mousedown` listener with ref containment check).
- `findActiveItem` recursively walks the menu tree to match `location.pathname`, used to show/hide the header favourite star.
- Logout clears `SessionUserID`, `SessionUserName`, `SessionDesigID`, `ImpersonatorUserID` from `sessionStorage` and navigates to `/Login`.

## Children
`SubMenu` (one per top-level menu item), `MyProfileBanner` (shown when the profile icon is clicked), `ReleaseNotes`.
