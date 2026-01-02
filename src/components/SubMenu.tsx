import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Label from "./ReusablePageControls/Label";

interface SubMenuItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  iconOpened?: React.ReactNode;
  iconClosed?: React.ReactNode;
  subNav?: SubMenuItem[];
}

interface SubMenuProps {
  item: SubMenuItem;
  activeMenu?: string | null;
  setActiveMenu?: React.Dispatch<React.SetStateAction<string | null>>;
  closeSidebar?: () => void;
}

interface SidebarLinkProps {
  active?: boolean;
}

const SidebarLink = styled(Link) <SidebarLinkProps>`
  display: flex;
  color: #e1e9fc;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  height: 50px;
  text-decoration: none;
  font-size: 15px;
  background: ${({ active }) => (active ? "#5D6D7E" : "transparent")};
  transition: all 0.3s ease;

  &:hover {
    background: #5d6d7e;
    border-left: 4px solid #27ae60;
    cursor: pointer;
  }
`;

const DropdownContainer = styled(motion.div)`
  background: #2c3e50;
`;

const DropdownLink = styled(Link)`
  background: #5d86abff;
  height: 45px;
  padding-left: 3rem;
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #f5f5f5;
  font-size: 14px;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    background: #5d6d7e;
    border-left: 3px solid #27ae60;
    cursor: pointer;
  }
`;

const SubMenu: React.FC<SubMenuProps> = ({ item, closeSidebar }) => {
  const [subnav, setSubnav] = useState(false);

  const toggleSubnav = () => setSubnav((prev) => !prev);
  // FIX: If submenu contains only 1 item and title matches parent, flatten it
  //ex: Reports is part of mainmenu and submenu , hence treat it as mainmenu or submenu and display once
  const effectiveSubNav =
    item.subNav &&
      item.subNav.length === 1 &&
      item.subNav[0].title === item.title &&
      item.subNav[0].subNav
      ? item.subNav[0].subNav   // use inner pages directly
      : item.subNav;

  return (
    <>
      <SidebarLink
        to={item.path || "#"}
        onClick={(e) => {
          if (effectiveSubNav) {
            e.preventDefault(); // prevent navigation for parent categories
            toggleSubnav();
          } else if (!item.path) {
            e.preventDefault(); // do nothing if route is null
          } else {
            closeSidebar?.(); // navigate & close
          }
        }}
      >
        <div>
          {/* {item.icon} */}
          {/* <SidebarLabel>{item.title}</SidebarLabel> */}
          <Label text={item.title} variant="menu"/>
        </div>
        <div>{item.subNav && (subnav ? item.iconOpened : item.iconClosed)}</div>
      </SidebarLink>

      <AnimatePresence initial={false}>
        {subnav && effectiveSubNav && (
          <DropdownContainer
            key="submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {effectiveSubNav.map((subItem: SubMenuItem, index: number) =>
              subItem.subNav ? (
                <SubMenu
                  key={index}
                  item={subItem}
                  closeSidebar={closeSidebar}
                />
              ) : (
                <DropdownLink
                  key={index}
                  to={subItem.path ?? "#"}
                  onClick={(e) => {
                    if (!subItem.path) e.preventDefault(); // prevent closing if no route
                    else closeSidebar?.();
                  }}
                >
                  {/* {subItem.icon} */}
                  {/* <SidebarLabel>{subItem.title}</SidebarLabel> */}
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
