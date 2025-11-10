// Sidebar.js
import { useState, useEffect } from "react";
import styled from "styled-components";
import { Link, useNavigate, useLocation } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import * as AiIcons from "react-icons/ai";
import { SidebarData } from "./SidebarData";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons/lib";
import axios from "axios";
import { baseUrl } from "../const/BaseUrl";
import { motion, AnimatePresence } from "framer-motion"; // ✅ Added

interface SidebarProps {
    sessionUserID: string;
}

// === Top Navbar ===
const Nav = styled.div`
  background: #85c1e9;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
`;

const NavIcon = styled(Link)`
  margin-left: 2rem;
  font-size: 2rem;
  height: 80px;
  display: flex;
  align-items: center;
`;

const SidebarWrap = styled.div`
  width: 100%;
`;

const RightCorner = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  padding: 20px;
  color: #2c3e50;

  a {
    text-decoration: none;
    color: #2c3e50;
    font-weight: 500;

    &:hover {
      color: #1b2631;
    }
  }
`;

const Sidebar: React.FC<SidebarProps> = ({ sessionUserID }) => {
    const [sidebar, setSidebar] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [userName, setUserName] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const showSidebar = () => setSidebar(!sidebar);

    const handleLogout = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        sessionStorage.removeItem("SessionUserID");
        navigate("/");
    };

    useEffect(() => {
        const fetchUserName = async () => {
            try {
                // const response = await axios.get<string>(`${baseUrl}/UserName?pLoginId=${sessionUserID}`);
                const response = await axios.get<string>(`${baseUrl}/UserName/${sessionUserID}`);
                setUserName(response.data || "");
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

    // ✅ Automatically close sidebar when route changes
    useEffect(() => {
        setSidebar(false);
    }, [location.pathname]);

    return (
        <>
            <IconContext.Provider value={{ color: "#5D6D7E" }}>
                {/* === Top Nav === */}
                <Nav>
                    <NavIcon to="#">
                        <FaIcons.FaBars onClick={showSidebar} />
                    </NavIcon>
                    <h1
                        style={{
                            textAlign: "center",
                            marginLeft: "300px",
                            color: "#5D6D7E",
                            fontSize: "30px",
                        }}
                    >
                        Welcome to Sienna ECAD Enterprise Management System
                    </h1>
                    <RightCorner>
                        <span>{userName ? userName : "User"}</span>
                        <span style={{ margin: "0 8px" }}>|</span>
                        <a href="/" onClick={handleLogout}>
                            Log Out
                        </a>
                    </RightCorner>
                </Nav>

                {/* === Animated Sidebar === */}
                <AnimatePresence>
                    {sidebar && (
                        <motion.nav
                            key="sidebar"
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                            style={{
                                background: "#34495e",
                                width: "250px",
                                height: "calc(100vh - 80px)",
                                position: "fixed",
                                top: "80px",
                                left: 0,
                                zIndex: 999,
                                overflowY: "auto",
                                boxShadow: "3px 0px 10px rgba(0,0,0,0.3)",
                            }}
                        >
                            <SidebarWrap>
                                <NavIcon to="#">
                                    <AiIcons.AiOutlineClose onClick={showSidebar} />
                                </NavIcon>

                                {SidebarData.map((item, index) => (
                                    <SubMenu
                                        key={index}
                                        item={item}
                                        activeMenu={activeMenu}
                                        setActiveMenu={setActiveMenu}
                                        closeSidebar={() => setSidebar(false)}
                                    />
                                ))}
                            </SidebarWrap>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </IconContext.Provider>
        </>
    );
};

export default Sidebar;
