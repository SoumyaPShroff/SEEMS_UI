// SubMenu.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

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
  closeSidebar?: () => void; // ✅ optional callback
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
  list-style: none;
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

const SidebarLabel = styled.span`
  margin-left: 16px;
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

const SubMenu: React.FC<SubMenuProps> = ({
  item,
  activeMenu,
  setActiveMenu,
  closeSidebar,
}) => {
  const [subnav, setSubnav] = useState(false);

  const toggleSubnav = () => setSubnav((prev) => !prev);

  return (
    <>
      <SidebarLink
        to={item.path || "#"}
        onClick={() => {
          if (item.subNav) toggleSubnav();
          else closeSidebar?.(); // ✅ call only if provided
        }}
      >
        <div>
          {item.icon}
          <SidebarLabel>{item.title}</SidebarLabel>
        </div>
        <div>
          {item.subNav && (subnav ? item.iconOpened : item.iconClosed)}
        </div>
      </SidebarLink>

      <AnimatePresence initial={false}>
        {subnav && item.subNav && (
          <DropdownContainer
            key="submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {item.subNav.map((subItem: SubMenuItem, index: number) =>
              subItem.subNav ? (
                // ✅ Recursive rendering
                <SubMenu
                  key={index}
                  item={subItem}
                  activeMenu={activeMenu}
                  setActiveMenu={setActiveMenu}
                  closeSidebar={closeSidebar}
                />
              ) : (
                <DropdownLink to={subItem.path ?? "#"} key={index}>
                  {subItem.icon}
                  <SidebarLabel>{subItem.title}</SidebarLabel>
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
