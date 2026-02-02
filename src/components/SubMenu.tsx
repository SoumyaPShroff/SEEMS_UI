import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Label from "./resusablecontrols/Label";

/* ======================================================
   TYPES
====================================================== */

interface SubMenuItem {
  title: string;
  path?: string;
  icon?: string;
  iconOpened?: React.ReactNode;
  iconClosed?: React.ReactNode;
  subNav?: SubMenuItem[];
}

interface SubMenuProps {
  item: SubMenuItem;
  collapsed: boolean;
  isFlyout?: boolean;
}

/* ======================================================
   STYLES
====================================================== */

const SidebarRow = styled.div<{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  color: ${({ active }) => (active ? "#ffffff" : "#cfd8dc")};
  background: ${({ active }) => (active ? "#426c8c" : "transparent")};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: #426c8c;
  }

  &:focus-visible {
    outline: none;
    background: #426c8c;
  }
`;

const DropdownContainer = styled(motion.div)`
  background: #2f5597;
`;

const DropdownLink = styled(Link) <{ active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding-left: 52px;
  text-decoration: none;
  color: ${({ active }) => (active ? "#ffffff" : "#ecf0f1")};
  background: ${({ active }) => (active ? "#1abc9c" : "transparent")};
  font-size: 14px;

    color: ${({ active }) => (active ? "#ffffff" : "#ecf0f1")};
  background: ${({ active }) => (active ? "#1abc9c" : "transparent")};


  &:hover {
    background: #426c8c;
    color: #ffffff; 
  }
`;

const MenuIcon = ({
  src,
  size = 25,
}: {
  src?: string;
  size?: number;
}) => {
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{
        flexShrink: 0,
      }}
    />
  );
};
//  left: 72px; /* collapsed sidebar width */
const Flyout = styled(motion.div)`
  position: fixed;
  left: 72px;
  background: #2f5597;
  min-width: 220px;
  border-radius: 6px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  z-index: 2000;
`;

/* ======================================================
   COMPONENT
====================================================== */

const SubMenu: React.FC<SubMenuProps> = ({ item, collapsed, isFlyout = false, }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
  // useEffect(() => {
  //   if (!collapsed && isAnyChildActive(effectiveSubNav)) {
  //     setOpen(true);
  //   }
  // }, [location.pathname]);
useEffect(() => {
  if (!collapsed && isAnyChildActive(effectiveSubNav)) {
    setOpen(true);
  } else if (collapsed) {
    setOpen(false); // auto-close when sidebar is collapsed
  }
}, [location.pathname, collapsed]);

  /* ======================================================
     RENDER
  ===================================================== */

  return (
    <>
      {/* ================= PARENT ROW + FLYOUT WRAPPER ================= */}
      <div style={{ position: "relative" }}>
        <SidebarRow
          active={
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
          <MenuIcon src={item.icon} size={20} />

          {/* Text */}
          {(!collapsed || isFlyout) && (
            <Label text={item.title} variant="menu" />
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
                    active={isRouteActive(subItem.path)}
                    onClick={() => setOpen(false)}
                  >
                    <MenuIcon src={subItem.icon} size={16} />
                    <Label text={subItem.title} variant="submenu" />
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
                  active={isRouteActive(subItem.path)}
                >
                  <MenuIcon src={subItem.icon} size={16} />
                  <Label text={subItem.title} variant="submenu" />
                </DropdownLink>
              )
            )}
          </DropdownContainer>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubMenu;