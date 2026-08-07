# Favourites

`components/Favourites.tsx`

Not a component — a small API/cache module for the favourites feature. `FavouritesContext` is the stateful layer built on top of this file.

## Exports
- `interface FavouriteDto` — `{ pageid, pagename, route }`.
- `favouritesCacheKey(userId)` — returns `UserFavourites_{userId}`, the `sessionStorage` key used for caching.
- `readFavouritesCache(userId)` / `writeFavouritesCache(userId, favourites)` — read/write the cached favourites list; both are defensive (`try/catch`, read returns `null` on any parse failure, write silently no-ops on failure).
- `getFavourites(userId)` — `GET /api/Home/UserFavourites/{userId}`.
- `addFavourite(userId, pageId)` — `POST /api/Home/AddFavourites` with `{ userId, pageId }`.
- `removeFavourite(userId, pageId)` — `DELETE /api/Home/RemoveFavourites/{userId}/{pageId}`.

## Notes
- This module only wraps HTTP calls and session cache read/write — it holds no React state itself. `FavouritesContext.tsx` is the one place that calls these and exposes reactive state (`favourites`, `favouriteLinks`) to the rest of the app.
- The cache is per-tab (`sessionStorage`), keyed by user id, so switching users (e.g. `ImpersonatorUserID` flows) won't leak another user's cached favourites as long as `sessionUserID` passed in differs.
