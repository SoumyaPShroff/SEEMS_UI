import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSideBarData } from "./SideBarData";
import type { SidebarItem } from "./SideBarData";
import SubMenu from "./SubMenu";
import { IconContext } from "react-icons/lib";
import axios from "axios";
import { baseUrl } from "../const/BaseUrl";
//import logo from "../const/Images/Sienna-Ecad-logo.jpg";
import { motion } from "framer-motion";
import { FaBars, FaTimes, FaStar, FaRegStar, FaUserCircle, FaBell } from "react-icons/fa";
import { RiHome2Line } from "react-icons/ri";
import { useFavourites } from "./FavouritesContext";
import MyProfileBanner from "./MyProfileBanner";
import ReleaseNotesText from "./../components/ReleaseNotesText";
import ReleaseNotes from "./ReleaseNotes";

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
  sidebarBg: "linear-gradient(to bottom, #1f2a37, #233244)",
  sidebarHover: "#243447",
  sidebarActive: "#2e4760",
  textPrimary: "#f8fafc",
  textMuted: "#c7d2da",
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
  background: linear-gradient(to right, #1f2a37, #2a3a4d);
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.25);
`;
const HeaderCenter = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
   margin-left: 260px;
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
   gap: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  &:focus-visible {
    outline: 2px solid #1abc9c;
    outline-offset: -2px;
  }
`;

// const Logo = styled.img`
//   height: 60px;
//   width: 80px;
//   box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
// `;

const RightCorner = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
    padding-right: 20px;
  white-space: nowrap;
  flex-shrink: 0;      /* IMPORTANT */
  color: #e2e8f0;

  a {
    color: #e2e8f0;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: #ffffff;
    }
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: red;
  border-radius: 50%;
  border: 1px solid white;
`;

const ReleaseNotesPopover = styled.div`
  position: absolute;
  top: 78px;
  right: 0;
  width: 520px;
  max-height: 70vh;
  overflow: auto;
  overflow-x: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  z-index: 1100;
`;

const SideNav = styled.aside<{ $collapsed: boolean; $mobile: boolean }>`
  position: fixed;
  top: 80px;
  left: 1;
  height: calc(100vh - 80px);
  width: ${({ $collapsed }) => ($collapsed ? "72px" : "260px")};
  background: ${theme.sidebarBg};
  overflow-x: hidden;
  transition: all 0.25s ease;
  box-shadow: 3px 0 10px rgba(0, 0, 0, 0.25);
  z-index: 900;

  ${({ $mobile, $collapsed }) =>
    $mobile &&
    `
    width: 260px;
    transform: ${$collapsed ? "translateX(-100%)" : "translateX(0)"};
  `}
`;

const SidebarWrap = styled.div`
  width: 100%;
`;

/* ======================================================
   COMPONENT
====================================================== */

const Sidebar: React.FC<SidebarProps> = ({ sessionUserID, setUserId, collapsed, setCollapsed, }) => {
  const [userName, setUserName] = useState("");
  const [hasNewReleases, setHasNewReleases] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const menu = useSideBarData();
  const isMobile = window.innerWidth < 768;
  const releasePopoverRef = useRef<HTMLDivElement | null>(null);

  const LATEST_RELEASE_VERSION = ReleaseNotesText[0].version;
  const LAST_SEEN_VERSION_KEY = 'lastSeenReleaseVersion';

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    if (lastSeenVersion !== LATEST_RELEASE_VERSION) {
      setHasNewReleases(true);
    }
  }, [LATEST_RELEASE_VERSION]);

  // Use Context for favourites
  const { isFavourite, addFavourite, removeFavourite } = useFavourites();

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

  /* ---------- Find Active Item for Header Star ---------- */
  const findActiveItem = (items: SidebarItem[], path: string): SidebarItem | undefined => {
    const normPath = path.toLowerCase().replace(/\/+$/, "");
    for (const item of items) {
      if (item.path && item.path.toLowerCase().replace(/\/+$/, "") === normPath) return item;
      if (item.subNav) {
        const found = findActiveItem(item.subNav, path);
        if (found) return found;
      }
    }
    return undefined;
  };

  const activeItem = findActiveItem(menu, location.pathname);
  const isActiveFav = activeItem?.pageId ? isFavourite(activeItem.pageId) : false;

  const toggleHeaderFavourite = async () => {
    if (!activeItem?.pageId) return;
    try {
      if (isActiveFav) {
        await removeFavourite(activeItem.pageId);
      } else {
        await addFavourite(activeItem.pageId, activeItem.title, activeItem.route || '');
      }
    } catch (error) {
      console.error("Failed to toggle favourite", error);
    }
  };

  const handleReleaseNotesClick = () => {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, LATEST_RELEASE_VERSION);
    setHasNewReleases(false);
    setShowReleaseNotes(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (releasePopoverRef.current && !releasePopoverRef.current.contains(target)) {
        setShowReleaseNotes(false);
      }
    };

    if (showReleaseNotes) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReleaseNotes]);

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

          <motion.span
            role="button"
            tabIndex={0}
            aria-label="Home"
            style={{ width: 22, height: 22, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            onClick={e => {
              e.stopPropagation();     // prevents sidebar toggle
              navigate("/");
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.stopPropagation();
                navigate("/");
              }
            }}
          >
            <RiHome2Line />
          </motion.span>
        </NavIcon>
        <HeaderCenter >
          <h1 style={{ color: "white", fontSize: "30px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Welcome to Sienna ECAD Enterprise Management System
          </h1>
        </HeaderCenter>

        <RightCorner>
          {activeItem?.pageId && (
            <span
              onClick={toggleHeaderFavourite}
              style={{ cursor: "pointer", marginRight: "15px", fontSize: "1.2rem", display: "flex", alignItems: "center" }}
              title={isActiveFav ? "Remove from favourites" : "Add to favourites"}
            >
              {isActiveFav ? <FaStar color="#FFD700" /> : <FaRegStar color="#ffffff" />}
            </span>
          )}
          <div ref={releasePopoverRef} style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              onClick={handleReleaseNotesClick}
              style={{ position: 'relative', cursor: "pointer", marginRight: "15px", fontSize: "1.2rem", display: "flex", alignItems: "center" }}
              title="New Releases"
            >
              <FaBell color="#ffffff" />
              {hasNewReleases && <NotificationBadge />}
            </span>
            {showReleaseNotes && (
              <ReleaseNotesPopover>
                <ReleaseNotes notes={ReleaseNotesText} />
              </ReleaseNotesPopover>
            )}
          </div>
          <span
            onClick={() => setShowProfile(!showProfile)}
            style={{ cursor: "pointer", marginRight: "8px", fontSize: "1.5rem", display: "flex", alignItems: "center" }}
            title="View Profile"
          >
            <FaUserCircle />
          </span>
          <span>{userName || "User"}</span>
          <span>|</span>
          <Link to="/Login" onClick={handleLogout}>
            Log Out
          </Link>
        </RightCorner>
      </Nav>

      {/* ================= SIDEBAR ================= */}
      <SideNav $collapsed={collapsed} $mobile={isMobile}>
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
      {showProfile && <MyProfileBanner />}
    </IconContext.Provider>
  );
};

export default Sidebar;

