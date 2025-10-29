// SubMenu.js
import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

const SidebarLink = styled(Link)`
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
    background: #5D6D7E;
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
  background: #5d86abff;;
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

const SubMenu = ({ item }) => {
    const [subnav, setSubnav] = useState(false);
    const toggleSubnav = () => setSubnav((prev) => !prev);

    return (
        <>
            <SidebarLink
                to={item.path || "#"}
                onClick={item.subNav ? toggleSubnav : undefined}
            >
                <div>
                    {item.icon}
                    <SidebarLabel>{item.title}</SidebarLabel>
                </div>
                <div>
                    {item.subNav &&
                        (subnav ? item.iconOpened : item.iconClosed)}
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
                        {item.subNav.map((subItem, index) =>
                            subItem.subNav ? (
                                // 🔁 Recursive rendering for deeper submenus
                                <SubMenu item={subItem} key={index} />
                            ) : (
                                <DropdownLink to={subItem.path} key={index}>
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
