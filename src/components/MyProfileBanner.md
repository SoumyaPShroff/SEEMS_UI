# MyProfileBanner

`components/MyProfileBanner.tsx`

Small fixed-position "flash card" showing the logged-in user's ID, cost center, reporting manager, and team, anchored top-right below the nav bar. Shown/hidden by `Sidebar` when the profile icon is clicked (this component has no visibility prop of its own — mounting it *is* showing it).

## Data source
`GET /api/Home/EmployeeDetails/{loginId}` (`loginId` from `sessionStorage.SessionUserID`, default `"guest"`). Expects a single object response (not an array).

## Behavior notes
- Renders nothing while loading and nothing if the profile fetch fails or returns falsy — no error state shown to the user, just silently absent.
- Entrance animation only (slide-in from the right via `framer-motion`); no exit animation since visibility is controlled by the parent unmounting it.

## Session keys read
`SessionUserID`.
