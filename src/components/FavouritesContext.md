# FavouritesContext

`components/FavouritesContext.tsx`

React context/provider exposing the current user's favourites (starred pages) app-wide, built on top of `Favourites.tsx`'s API/cache functions.

## Exports
- `FavouritesProvider` — `{ children, sessionUserID }`, wraps the app (or the authenticated portion of it) and owns the favourites state.
- `useFavourites()` — hook returning `{ favourites, favouriteLinks, addFavourite, removeFavourite, isFavourite, loading }`. Throws if called outside a `FavouritesProvider`.

## State shape
- `favourites: number[]` — just the `pageid`s, for quick `isFavourite` lookups.
- `favouriteLinks: FavouriteDto[]` — full `{pageid, pagename, route}` entries, used to render favourite cards/links (e.g. in `HomeDashboard`).

## Behavior notes
- On mount (or when `sessionUserID` changes), first checks `sessionStorage` cache (`readFavouritesCache`) — if present, it's used immediately with no network call. Otherwise fetches `GET /api/Home/UserFavourites/{sessionUserID}` and populates the cache.
  - This means the cache is never invalidated/refetched from the server after the first load in a tab session except via explicit add/remove — if favourites are changed elsewhere (another tab, another session), this tab won't see it until the cache key is cleared or the tab is closed.
- `addFavourite`/`removeFavourite` optimistically update both `favourites` and `favouriteLinks` (and the cache) only after the API call succeeds; on failure they just `console.error` and leave state unchanged.
- `addFavourite` is a no-op if `sessionUserID` is falsy or the pageId is already favourited (`favourites.includes(pageId)`).

## Consumers
`Sidebar` (header star + `SubMenu` stars), `SubMenu` (per-item stars), `HomeDashboard` (favourites grid + remove button).
