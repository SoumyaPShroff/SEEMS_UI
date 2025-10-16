// Filename - components/SubMenu.js

import { useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const SidebarLink = styled(Link)`
    display: flex;
    color: #e1e9fc;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    list-style: none;
    height: 60px;
    text-decoration: none;
    font-size: 18px;

    &:hover {
        background: #5D6D7E;
        border-left: 4px solid green;
        cursor: pointer;
    }
`;

const SidebarLabel = styled.span`
    margin-left: 16px;
`;

const DropdownLink = styled(Link)`
    background: #5D6D7E;
    height: 60px;
    padding-left: 3rem;
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #f5f5f5;
    font-size: 18px;
    z-index: 998;  /* Adjust z-index to ensure it appears under the header */

    &:hover {
        background: #5D6D7E;
        cursor: pointer;
    }
`;

// const SubMenu = ({ item }) => {
const SubMenu = ({ item }: { item: any }) => {
    const [subnav, setSubnav] = useState(false);

    const showSubnav = () => setSubnav(!subnav);

    return (
        <>
            <SidebarLink
                to={item.path}
                // onClick={item.subNav ? showSubnav : null}
                onClick={item.subNav ? showSubnav : undefined}
            >
                <div>
                    {item.icon}
                    <SidebarLabel>{item.title}</SidebarLabel>
                </div>
                <div>
                    {item.subNav && subnav
                        ? item.iconOpened
                        : item.subNav
                            ? item.iconClosed
                            : null}
                </div>
            </SidebarLink>
            {subnav &&
                item.subNav.map((subItem: any, index: number) => {
                    return (
                        <DropdownLink
                            to={subItem.path}
                            key={index}
                        >
                            {subItem.icon}
                            <SidebarLabel>{subItem.title}</SidebarLabel>
                        </DropdownLink>
                    );
                })}
        </>
    );
};

export default SubMenu;
