import { useEffect, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate } from "react-router-dom";
import { useSideBarData } from "./SideBarData";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons/lib";
import axios from "axios";
import { baseUrl } from "../const/BaseUrl";
import logo from "../const/Images/Sienna-Ecad-logo.jpg";
import { motion } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";

// import Breadcrumbs from "./Breadcrumbs";

/* ======================================================
   PROPS
====================================================== */
interface SidebarProps {
  sessionUserID: string;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

/* ======================================================
   THEME (Screenshot-matched)
====================================================== */
export const theme = {
  sidebarBg: "linear-gradient(to bottom, #23458dff, #4fb695ff)",
  sidebarHover: "#3f6ad8",
  sidebarActive: "#6f675f",
  textPrimary: "#ffffff",
  textMuted: "#cfd8dc",
};

/* ======================================================
   STYLES
====================================================== */

const Nav = styled.div`
  height: 80px;
  display: flex;
  align-items: center;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  background: linear-gradient(to right, #23458dff, #4fb695ff);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.25);
`;
const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
   margin-left: 240px;
  overflow: hidden;
`;

const NavIcon = styled.div`
  width: 72px;                 /* aligns with collapsed sidebar */
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  cursor: pointer;
  color: #ffffff;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:focus-visible {
    outline: 2px solid #1abc9c;
    outline-offset: -2px;
  }
`;

const Logo = styled.img`
  height: 60px;
  width: 80px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
`;

const RightCorner = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
    padding-right: 20px;
  white-space: nowrap;
  flex-shrink: 0;      /* IMPORTANT */
  color: #2c3e50;

  a {
    color: #2c3e50;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: #1b2631;
    }
  }
`;

const SideNav = styled.aside<{ collapsed: boolean; mobile: boolean }>`
  position: fixed;
  top: 80px;
  left: 1;
  height: calc(100vh - 80px);
  width: ${({ collapsed }) => (collapsed ? "72px" : "240px")};
  background: ${theme.sidebarBg};
  overflow-x: hidden;
  transition: all 0.25s ease;
  box-shadow: 3px 0 10px rgba(0, 0, 0, 0.25);
  z-index: 900;

  ${({ mobile, collapsed }) =>
    mobile &&
    `
    width: 240px;
    transform: ${collapsed ? "translateX(-100%)" : "translateX(0)"};
  `}
`;

const SidebarWrap = styled.div`
  width: 100%;
`;

/* ======================================================
   COMPONENT
====================================================== */

const Sidebar: React.FC<SidebarProps> = ({
  sessionUserID,
  setUserId,
  collapsed,
  setCollapsed,
}) => {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();
  const menu = useSideBarData();
  const isMobile = window.innerWidth < 768;

  /* ---------- Logout ---------- */
  const handleLogout = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    sessionStorage.removeItem("SessionUserID");
    setUserId(null);
    navigate("/Login", { replace: true });
  };

  /* ---------- Fetch Username ---------- */
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const res = await axios.get<string>(
          `${baseUrl}/UserName/${sessionUserID}`
        );
        setUserName(res.data || "");
      } catch (err) {
        console.error(err);
      }
    };

    if (sessionUserID) fetchUserName();
  }, [sessionUserID]);

  /* ======================================================
     RENDER
  ===================================================== */

  return (
    <IconContext.Provider value={{ color: theme.textPrimary }}>
      {/* ================= TOP NAV ================= */}
      <Nav>
        <NavIcon
          role="button"
          tabIndex={0}
          onClick={() => setCollapsed(prev => !prev)}
          onKeyDown={(e) => e.key === "Enter" && setCollapsed(prev => !prev)}
        >
          <motion.div
            initial={false}
            animate={{ rotate: collapsed ? 0 : 90 }}
            transition={{ duration: 0.25 }}
          >
            {collapsed ? <FaBars /> : <FaTimes />}
          </motion.div>
        </NavIcon>
        <HeaderCenter >
          <Logo src={logo} alt="logo" />
          <h1 style={{ color: "white", fontSize: "30px",overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Welcome to Sienna ECAD Enterprise Management System
          </h1>
        </HeaderCenter>

        <RightCorner>
          <span>{userName || "User"}</span>
          <span>|</span>
          <Link to="/Login" onClick={handleLogout}>
            Log Out
          </Link>
        </RightCorner>
      </Nav>

      {/* ================= SIDEBAR ================= */}
      <SideNav collapsed={collapsed} mobile={isMobile}>
        <SidebarWrap>
          {menu.map((item, index) => (
            <SubMenu
              key={index}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </SidebarWrap>
      </SideNav>
    </IconContext.Provider>
  );
};

export default Sidebar;