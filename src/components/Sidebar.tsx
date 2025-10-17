import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { SidebarData } from "./SidebarData";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons/lib";
import { useNavigate } from 'react-router-dom'; // Import useNavigate for React Router v6
import { baseUrl } from '../const/BaseUrl';
import axios from 'axios';

// Welcome horizontal  bar
const Nav = styled.div`    
    background: #85C1E9 ;
    height: 80px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width:100%;
    margin-left:0px;
    margin-right:0px;
    position: fixed;  
    top: 0;           /* Stick it to the top */
    z-index: 1000;    /* Ensure it's above other elements */
`;

const NavIcon = styled(Link)`
    margin-left: 2rem;
    font-size: 2rem;
    height: 80px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
`;

// Wrapper for the right corner elements
const RightCorner = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
    padding: 20px;
`;

interface SidebarNavProps {
    sidebar: boolean;
}

//vertical side bar
const SidebarNav = styled.nav<SidebarNavProps>`
 background: #34495E;
    width: 250px;
    height: calc(100vh - 80px);  /* Subtract the height of the Nav (header) */
    display: flex;
    justify-content: center;
    position: fixed;
    top: 80px; /* Align with the bottom of the fixed Nav */
    left: ${({ sidebar }) => (sidebar ? "0" : "-100%")};
    transition: 350ms;
    z-index: 999; /* Ensure it's under the Nav header */
    overflow-y: auto;  /* Allow scrolling in the sidebar */
`;

const SidebarWrap = styled.div`
    width: 100%;
`;

const Sidebar = ({ sessionUserID }: { sessionUserID: string }) => {
    const [sidebar, setSidebar] = useState(false);
    const showSidebar = () => setSidebar(!sidebar);
    const navigate = useNavigate();
    const [_userName, setUserName] = useState(''); // if unused then prefix with _

    const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        sessionStorage.removeItem('SessionUserID');
        navigate('/');
    };

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                const response = await axios.get<{ Name: string }[]>(`${baseUrl}/getUserName?ploginid=${sessionUserID}`)
                setUserName(response.data[0]?.Name ?? '');
            } catch (error) {
                console.error("Error fetching username:", error);
            }
        };

        if (sessionUserID) {
            fetchUserName();
        } else {
            navigate('/');
        }
    }, [sessionUserID, navigate]);

    return (
        <>
            <IconContext.Provider value={{ color: "#5D6D7E" }}> {/* three line symbol */}
                <Nav>
                    <NavIcon to="#">
                        <FaIcons.FaBars
                            onClick={showSidebar}
                        />
                    </NavIcon>
                    <h1
                        style={{
                            textAlign: "center",
                            marginLeft: "400px",
                            color: "#5D6D7E",
                        }}
                    >
                        Welcome to Sienna ECAD Enterprise Management System
                    </h1>
                    <RightCorner>
                        <a
                            href={sessionUserID}
                        >
                            {`${"Software Developer"} `}
                        </a>
                        <span style={{ margin: "0 8px" }}>   </span>
                        <a    
                            href="http://localhost:5173"
                            onClick={handleLogout}
                        >
                            Log Out
                        </a>
                    </RightCorner>
                </Nav>
                <SidebarNav sidebar={sidebar}> {/* on click of three line button sidebar is set to true , if true call SidebarNav which in turn calls SidebarData and loop items in it and display */}
                    <SidebarWrap>
                        <NavIcon to="#">
                            <AiIcons.AiOutlineClose
                                onClick={showSidebar}
                            />
                        </NavIcon>
                        {SidebarData.map((item, index) => {
                            return (
                                <SubMenu
                                    item={item}
                                    key={index}
                                />
                            );
                        })}
                    </SidebarWrap>
                </SidebarNav>
            </IconContext.Provider>
        </>
    );
};


export default Sidebar;

