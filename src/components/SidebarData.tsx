import React, { useEffect, useState } from "react";
import axios from "axios";
import * as RiIcons from "react-icons/ri";
import { baseUrl } from "../const/BaseUrl";
 
export interface SidebarItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  iconOpened?: React.ReactNode;
  iconClosed?: React.ReactNode;
  subNav?: SidebarItem[];
  pageId?: number;
  route?: string;
}

export const useSideBarData = () => {
  const [menu, setMenu] = useState<SidebarItem[]>([]);

  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const designationId = sessionStorage.getItem("SessionDesigID");
        if (!designationId) return;

        const res = await axios.get(`${baseUrl}/SideBarAccessMenus/${designationId}`);
        // const raw = res.data; // adjust if API wraps data differently
        const raw = res.data as any[];
        const structured: SidebarItem[] = [];

        raw.forEach((item) => {
          // Main menu
          let main = structured.find((m) => m.title === item.mainmenu);
          if (!main) {
            main = {
             title: item.mainmenu,
              icon: resolveMenuIcon(item.mainmenu, item.route, item.menuimage),
              iconClosed: <RiIcons.RiArrowDownSFill />,
              iconOpened: <RiIcons.RiArrowUpSFill />,
              subNav: [],
            };
            structured.push(main);
          }

          // Sub menu
          let sub = main.subNav?.find((s) => s.title === item.submenu);
          if (!sub) {
            sub = {
              title: item.submenu,
              icon: resolveMenuIcon(item.submenu, item.route, item.subimage),
              iconClosed: <RiIcons.RiArrowDownSFill />,
              iconOpened: <RiIcons.RiArrowUpSFill />,
              subNav: [],
            };
            main.subNav?.push(sub);
          }

          // Page item
          sub.subNav?.push({
            title: item.pagename, //display menu name
            path: item.route ? `/Home/${item.route}` : "#", //default using /Home/
            icon: resolveMenuIcon(item.pagename, item.route, item.pageimage),
            route: item.route,
            pageId: item.pageid,
          });
        });

        setMenu(structured);
      } catch (err) {
        console.error("Error fetching sidebar data:", err);
      }
    };

    fetchSidebar();
  }, []);

  return menu;
};

const resolveMenuIcon = (title: string, route?: string, image?: string) => {
  const text = `${title} ${route ?? ""} ${image ?? ""}`.toLowerCase();

  if (text.includes("dashboard")) return <RiIcons.RiDashboardLine />;
  if (text.includes("home")) return <RiIcons.RiHome2Line />;
  if (text.includes("sales")) return <RiIcons.RiBriefcaseLine />;
  if (text.includes("report")) return <RiIcons.RiFileChartLine />;
  if (text.includes("billing") || text.includes("finance")) return <RiIcons.RiMoneyDollarCircleLine />;
  if (text.includes("quotation") || text.includes("quote")) return <RiIcons.RiFileTextLine />;
  if (text.includes("enquiry") || text.includes("inquiry")) return <RiIcons.RiSearchLine />;
  if (text.includes("project")) return <RiIcons.RiFolder2Line />;
  if (text.includes("team")) return <RiIcons.RiTeamLine />;
  if (text.includes("profile") || text.includes("user")) return <RiIcons.RiUser3Line />;
  if (text.includes("support") || text.includes("help")) return <RiIcons.RiCustomerService2Line />;
  if (text.includes("settings")) return <RiIcons.RiSettings3Line />;
  if (text.includes("calendar")) return <RiIcons.RiCalendar2Line />;
  if (text.includes("favourite") || text.includes("favorite")) return <RiIcons.RiStarLine />;

  return <RiIcons.RiPieChartLine />;
};
