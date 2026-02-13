import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Label from "./resusablecontrols/Label";
import { FaStar, FaRegStar } from "react-icons/fa";
import { useFavourites } from "./FavouritesContext";

/* ======================================================
   TYPES
====================================================== */

interface SubMenuItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  iconOpened?: React.ReactNode;
  iconClosed?: React.ReactNode;
  subNav?: SubMenuItem[];
  pageId?: number;
  route?: string;
}

interface SubMenuProps {
  item: SubMenuItem;
  collapsed: boolean;
  isFlyout?: boolean;
}

/* ======================================================
   STYLES
====================================================== */

const SidebarRow = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  color: ${({ $active }) => ($active ? "#f8fafc" : "#c7d2da")};
  background: ${({ $active }) => ($active ? "#2e4760" : "transparent")};
  cursor: pointer;
  white-space: nowrap;
  position: relative; 
  transition: background 0.2s ease, color 0.2s ease;
  &:hover {
    background: #243447;
    color: #f1f5f9;
  }
  &:hover ${"" /* make menu icons clearer on hover */} span[role="img"],
  &:hover ${"" /* icon badge */} .menu-icon-badge {
    color: #ffffff;
    background: rgba(76, 201, 167, 0.25);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
  }

  ${({ $active }) =>
    $active &&
    `
    .menu-icon-badge {
      color: #ffffff;
      background: rgba(76, 201, 167, 0.22);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16);
    }
  `}

  &:focus-visible {
    outline: none;
    background: #243447;
  }
  &:hover .fav-star {
    opacity: 1;
    transform: translateX(0);
  }
`;

const DropdownContainer = styled(motion.div)`
  background: #1e2a38;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
`;

const DropdownLink = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding-left: 52px;
  padding-right: 14px;
  text-decoration: none;
  color: ${({ $active }) => ($active ? "#f8fafc" : "#d7dee6")};
  background: ${({ $active }) =>
    $active ? "rgba(76, 201, 167, 0.22)" : "transparent"};
  font-size: 14px;
  transition: background 0.2s ease, color 0.2s ease;
  &:hover {
    background: #243447;
    color: #ffffff;
  }
  &:hover .menu-icon-badge {
    color: #ffffff;
    background: rgba(76, 201, 167, 0.25);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18);
  }

  ${({ $active }) =>
    $active &&
    `
    .menu-icon-badge {
      color: #ffffff;
      background: rgba(76, 201, 167, 0.22);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.16);
    }
  `}

  &:hover .fav-star {
    opacity: 1;
    transform: translateX(0);
  }
`;

const MenuIcon = ({
  icon,
  size = 25,
}: {
  icon?: React.ReactNode;
  size?: number;
}) => {
  if (!icon) return null;

  // const renderedIcon = React.isValidElement(icon)
  //   ? React.cloneElement(icon, { color: "currentColor" })
  //   : icon;
const renderedIcon = React.isValidElement(icon)
  ? React.cloneElement(icon as React.ReactElement<any>, {
      color: "currentColor",
    })
  : icon
  return (
    <IconBadge className="menu-icon-badge" $size={size}>
      {renderedIcon}
    </IconBadge>
  );
};

const IconBadge = styled.span<{ $size: number }>`
  width: ${({ $size }) => $size + 14}px;
  height: ${({ $size }) => $size + 14}px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  color: #e6edf3;
  font-size: ${({ $size }) => $size}px;
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
`;

//  left: 72px; /* collapsed sidebar width */
const Flyout = styled(motion.div)`
  position: fixed;
  left: 72px;
  background: #1e2a38;
  min-width: 220px;
  border-radius: 6px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 2000;
`;

const FavouriteStar = styled.span`
  display: flex;
  align-items: center;
  opacity: 0;
  transform: translateX(6px);
  transition: all 0.2s ease;
  cursor: pointer;

  &.fav-star {
    pointer-events: auto;
  }

  &.is-fav {
    opacity: 1;
    transform: translateX(0);
  }
`;

/* ======================================================
   COMPONENT
====================================================== */

const SubMenu: React.FC<SubMenuProps> = ({ item, collapsed, isFlyout = false, }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isFavourite: checkIsFavourite, addFavourite, removeFavourite } = useFavourites();

  const isFavourite = item.pageId ? checkIsFavourite(item.pageId) : false;
  /* ---------- Active route helpers ---------- */
  const isRouteActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  const isAnyChildActive = (items?: SubMenuItem[]): boolean =>
    items?.some(
      sub =>
        isRouteActive(sub.path) ||
        isAnyChildActive(sub.subNav)
    ) ?? false;

  /* ---------- Flatten edge case ---------- */
  const effectiveSubNav =
    item.subNav &&
      item.subNav.length === 1 &&
      item.subNav[0].title === item.title &&
      item.subNav[0].subNav
      ? item.subNav[0].subNav
      : item.subNav;

  /* ---------- Auto-open when route active ---------- collpases once page loads*/
  useEffect(() => {
    if (!collapsed && isAnyChildActive(effectiveSubNav)) {
      setOpen(true);
    } else if (collapsed) {
      setOpen(false); // auto-close when sidebar is collapsed
    }
  }, [location.pathname, collapsed]);

  const toggleFavourite = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 🚨 prevents menu click / navigation
    if (!item.pageId) return;

    try {
      if (isFavourite) {
        await removeFavourite(item.pageId);
      } else {
        await addFavourite(item.pageId, item.title, item.route || '');
      }
    } catch (err) {
      console.error("Favourite toggle failed", err);
    }
  };

  /* ======================================================
     RENDER
  ===================================================== */
  return (
    <>
      {/* ================= PARENT ROW + FLYOUT WRAPPER ================= */}
      <div style={{ position: "relative" }}>
        <SidebarRow
          $active={
            isRouteActive(item.path) ||
            isAnyChildActive(effectiveSubNav)
          }
          tabIndex={0}
          title={collapsed ? item.title : ""}
          onClick={() => {
            // If this item has a path → navigate
            if (item.path) return;

            // If it has children → toggle submenu
            if (effectiveSubNav) {
              setOpen(prev => !prev);
            }
          }}

          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (item.path) return;
              if (effectiveSubNav) setOpen(prev => !prev);
            }
            if (e.key === "ArrowRight") setOpen(true);
            if (e.key === "ArrowLeft") setOpen(false);
          }}
        >
          {/* Icon */}
          <MenuIcon icon={item.icon} size={20} />

          {/* Text */}
          {(!collapsed || isFlyout) && (
            <>
              <Label text={item.title} variant="menu" />
              {item.pageId && (
                <FavouriteStar
                  className={`fav-star ${isFavourite ? "is-fav" : ""}`}
                  onClick={toggleFavourite}
                  title={isFavourite ? "Remove from favourites" : "Add to favourites"}
                >
                  {isFavourite ? (
                    <FaStar color="#FFD700" size={20} />
                  ) : (
                    <FaRegStar size={14} />
                  )}
                </FavouriteStar>
              )}
            </>
          )}

          {/* Arrow */}
          {!collapsed && effectiveSubNav && (
            <span style={{ marginLeft: "auto" }}>
              {open ? item.iconOpened : item.iconClosed}
            </span>
          )}
        </SidebarRow>

        {/* ================= FLOATING SUBMENU (Collapsed) ================= */}
        <AnimatePresence>
          {collapsed && open && effectiveSubNav && (
            <Flyout
              initial={{ opacity: 0, x: -10 }}
              //animate={{ opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: collapsed ? 0 : 0 }} // fix x position
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {effectiveSubNav.map((subItem, index) =>
                subItem.subNav ? (
                  <SubMenu
                    key={index}
                    item={subItem}
                    collapsed={collapsed}
                    isFlyout
                  />
                ) : (
                  <DropdownLink
                    key={index}
                    to={subItem.path ?? "#"}
                    $active={isRouteActive(subItem.path)}
                  >

                    {(() => {
                      const pageId = subItem.pageId;
                      if (!pageId) return null;

                      // const fav = checkIsFavourite(pageId);

                      return (
                        <FavouriteStar
                          className={`fav-star ${checkIsFavourite(pageId) ? "is-fav" : ""}`}
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // if (checkIsFavourite(subItem.pageId)) {
                            //   await removeFavourite(subItem.pageId);
                            if (checkIsFavourite(pageId)) {
                              await removeFavourite(pageId);
                            } else {
                              await addFavourite(
                                // subItem.pageId,
                                pageId,
                                subItem.title,
                                subItem.route || ""
                              );
                            }
                          }}
                          title={
                            // checkIsFavourite(subItem.pageId)
                            checkIsFavourite(pageId)
                              ? "Remove from favourites"
                              : "Add to favourites"
                          }
                        >
                          {checkIsFavourite(pageId) ? (
                            <FaStar color="#FFD700" size={14} />
                          ) : (
                            <FaRegStar size={14} />
                          )}
                        </FavouriteStar>
                      );
                    })()}
                    {(() => (
                      <>
                        <MenuIcon icon={subItem.icon} size={18} />
                        <Label text={subItem.title} variant="submenu" />
                      </>
                    ))()}

                  </DropdownLink>

                )
              )}
            </Flyout>
          )}
        </AnimatePresence>
      </div>

      {/* ================= NORMAL DROPDOWN (Expanded) ================= */}
      <AnimatePresence>
        {!collapsed && open && effectiveSubNav && (
          <DropdownContainer
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {effectiveSubNav.map((subItem, index) =>
              subItem.subNav ? (
                <SubMenu
                  key={index}
                  item={subItem}
                  collapsed={collapsed}
                />
              ) : (
                <DropdownLink
                  key={index}
                  to={subItem.path ?? "#"}
                  $active={isRouteActive(subItem.path)}
                >

                  {(() => {
                    const pageId = subItem.pageId;
                    if (!pageId) return null;

                    //  const fav = checkIsFavourite(pageId);

                    return (
                      <FavouriteStar
                        className="fav-star"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          // if (checkIsFavourite(subItem.pageId)) {
                          //   await removeFavourite(subItem.pageId);
                          if (checkIsFavourite(pageId)) {
                            await removeFavourite(pageId);
                          } else {
                            await addFavourite(
                              pageId,
                              subItem.title,
                              subItem.route || ""
                            );
                          }
                        }}
                        title={
                          checkIsFavourite(pageId)
                            ? "Remove from favourites"
                            : "Add to favourites"
                        }
                      >
                        {checkIsFavourite(pageId) ? (
                          <FaStar color="#FFD700" size={14} />
                        ) : (
                          <FaRegStar size={14} />
                        )}
                      </FavouriteStar>
                    );
                    })()}
                  {(() => (
                    <>
                    <MenuIcon icon={subItem.icon} size={18} />
                      <Label text={subItem.title} variant="submenu" />
                    </>
                  ))()}
                </DropdownLink>
              )
            )}
          </DropdownContainer>
        )}
      </AnimatePresence>
    </>
  );
};

/*
const getMenuEmoji = (title: string, route?: string) => {
  const text = `${title} ${route ?? ""}`.toLowerCase();
  if (text.includes("home")) return "🏠";
  if (text.includes("dashboard")) return "📊";
  if (text.includes("sales")) return "💼";
  if (text.includes("report")) return "🧾";
  if (text.includes("billing")) return "💳";
  if (text.includes("project")) return "📁";
  if (text.includes("team")) return "👥";
  if (text.includes("profile") || text.includes("user")) return "🙂";
  if (text.includes("support") || text.includes("help")) return "🛟";
  if (text.includes("quote") || text.includes("quotation")) return "🧾";
  if (text.includes("enquiry") || text.includes("inquiry")) return "🔍";
  if (text.includes("calendar")) return "📅";
  if (text.includes("settings")) return "⚙️";
  return "";
};
*/

export default SubMenu;
