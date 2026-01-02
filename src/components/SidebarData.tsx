import React, { useEffect, useState } from "react";
import axios from "axios";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";
import { baseUrl } from "../const/BaseUrl";
 
interface SidebarItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  iconOpened?: React.ReactNode;
  iconClosed?: React.ReactNode;
  subNav?: SidebarItem[];
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
              icon: <IoIcons.IoIosPaper />,
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
              icon: <IoIcons.IoIosPaper />,
              iconClosed: <RiIcons.RiArrowDownSFill />,
              iconOpened: <RiIcons.RiArrowUpSFill />,
              subNav: [],
            };
            main.subNav?.push(sub);
          }

          // Page item
          sub.subNav?.push({
            title: item.pagename, //display menu name
            // path: item.route || "#", // link from API route
            path: item.route ? `/Home/${item.route}` : "#", //default using /Home/
            // path: item.route
            //   ? item.route
            //   : `${item.pagename}`, //works for pagename without routes
            icon: <IoIcons.IoIosPaper />,
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