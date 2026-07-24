# SideBarData

`components/SideBarData.tsx` (file name is `SideBarData`, note the capital `B`)

Not a component — a hook, `useSideBarData()`, that fetches and shapes the sidebar menu tree consumed by `Sidebar` / `SubMenu`.

## Exports
- `interface SidebarItem` — `{ title, path?, icon?, iconOpened?, iconClosed?, subNav?, pageId?, route? }`, used recursively for main menu → submenu → page.
- `useSideBarData(): SidebarItem[]` — the hook itself.

## Data source
`GET /api/Home/SideBarAccessMenus/{designationId}` where `designationId` comes from `sessionStorage.SessionDesigID`. Returns a flat list of rows shaped like `{ mainmenu, submenu, pagename, route, pageid, menuimage, subimage, pageimage }`, which this hook folds into a 3-level tree (main → sub → page).

If there's no `designationId` in session, the menu resolves to `[]` (no request made).

## Icon resolution
`resolveMenuIcon(title, route, image)` does keyword matching (case-insensitive) over the combined title+route+image string against a fixed list (dashboard, home, sales, report, billing/finance, quotation/quote, enquiry/inquiry, project, team, profile/user, support/help, settings, calendar, favourite/favorite) and falls back to `RiPieChartLine`. This is purely cosmetic — it doesn't come from the API.

## Gotchas
- Menu grouping is keyed by exact `title` string match (`main.title === item.mainmenu`, `sub.title === item.submenu`) — duplicate/typo'd menu or submenu names in the backend data will silently create separate branches instead of merging.
- Errors fetching the menu are swallowed to `console.error`; the UI just shows an empty sidebar rather than surfacing a failure.
