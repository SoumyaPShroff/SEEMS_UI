# HomeDashboard

`components/HomeDashboard.tsx`

Landing page shown after login. Renders the default action-card grid, the user's favourites, and a floating help-chat widget.

## Data sources
- `GET /api/Home/EmployeeDetails/{loginId}` — profile + team info, used only to compute the "Team" card's member-count badge and disabled state.
- `fetchDefaultActionCards()` (`const/DashboardActionCards`) — the default cards shown to every user, based on `SessionDesigID`.
- `useRoleAccess(loginId, "adminuser")` — when true, prepends a "Query Builder" card (`/Home/QueryBuilder`).
- `useFavourites()` (`FavouritesContext`) — supplies `favouriteLinks` and `removeFavourite` for the Favourites section.
- `POST /api/Chat` — plain-text chatbot backend for the help widget.

## Behavior notes
- Cards are de-duplicated by `route` after merging the admin-only Query Builder card in.
- The "Meet My Team" card is disabled (no navigation) when `reporteeCount` is 0; a `${count} Members` badge is shown instead.
- Removing a favourite calls `event.stopPropagation()` so the click doesn't also trigger the card's navigate handler.
- Chat is client-local state (`ChatMessage[]`); nothing is persisted — refreshing clears history.

## Session keys read
`SessionUserID`, `SessionDesigID`.
