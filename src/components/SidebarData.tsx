import * as FaIcons from "react-icons/fa";
//import * as AiIcons from "react-icons/ai";
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";

export const SidebarData = [
    {
        title: "SEEMS",
        path: "/Home",
        icon: <FaIcons.FaEnvelopeOpenText />,
        iconClosed: <RiIcons.RiArrowDownSFill />,
        iconOpened: <RiIcons.RiArrowUpSFill />,

        subNav: [
            {
                title: "Home",
                path: "/Home/SeemsHomeSubMenu",
                icon: <IoIcons.IoIosPaper />,
            },
            {
                title: "Schedule Tracker",
                path: "/Home/ScheduleTrackerSubMenu",
                icon: <IoIcons.IoIosPaper />,
            },
            {
                title: "Billing Planner",
                path: "/Home/RptBillingPlanner",
                icon: <IoIcons.IoIosPaper />,
            },
            {
                title: "Sales Management Dashboard",
                path: "/Home/SalesDashboard",
                icon: <IoIcons.IoIosPaper />,
            },
            {
                title: "Timesheet",
                path: "/Home/DailyTimesheet",
                icon: <IoIcons.IoIosPaper />,
            },
            {
                title: "Manager Dashboard",
                path: "/Home/ManagerDashboardSubMenu",
                icon: <IoIcons.IoIosPaper />,
            }
        ],
    },
    {
        title: "Help",
        path: "/support",
        icon: <IoIcons.IoMdHelpCircle />,
    },
];
