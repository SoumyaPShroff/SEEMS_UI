# SubMenu

`components/SubMenu.tsx`

Recursive menu-row renderer used by `Sidebar` to draw one `SidebarItem` (and, recursively, its children) as either a leaf link or an expandable group. Renders differently depending on whether the sidebar is collapsed (flyout) or expanded (inline dropdown).

## Props
| Prop | Type | Purpose |
|---|---|---|
| `item` | `SubMenuItem` (structurally same shape as `SidebarItem`) | The menu node to render. |
| `collapsed` | `boolean` | Sidebar collapsed state — switches between flyout and inline rendering. |
| `isFlyout` | `boolean?` | True when this instance is being rendered inside a parent's flyout (affects whether the label text shows). |

## Behavior notes
- **Leaf vs. group**: an item with `item.path` navigates directly on click; an item with `subNav` toggles open/closed instead.
- **Flattening quirk**: if a node's only child has the same `title` as the parent and itself has `subNav`, that single wrapper level is skipped (`effectiveSubNav`) — a defensive fix for a specific backend data shape rather than general-purpose logic.
- **Auto-open**: expands automatically when the active route is somewhere in its subtree and the sidebar isn't collapsed; auto-closes whenever the sidebar collapses.
- **Collapsed mode**: children render in a fixed-position `Flyout` positioned at `left: 72px` (hardcoded to the collapsed sidebar's width) rather than being anchored to the row itself.
- **Favourite star**: each leaf and the parent row (if it has a `pageId`) shows a hover-revealed star that calls `addFavourite`/`removeFavourite` from `FavouritesContext`; clicks call `stopPropagation`/`preventDefault` so starring never triggers navigation or toggles the parent group.
- Recurses into itself for nested `subNav` in both the flyout and inline-dropdown branches.

## Dependencies
`FavouritesContext` (`useFavourites`), `resusablecontrols/Label`, `framer-motion` for open/close and flyout animation.
