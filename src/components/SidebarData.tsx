// SidebarData.js
import * as IoIcons from "react-icons/io";
import * as RiIcons from "react-icons/ri";
import * as FaIcons from "react-icons/fa";

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
                title: "Sales Design",
                icon: <IoIcons.IoIosPaper />,
                iconClosed: <RiIcons.RiArrowDownSFill />,
                iconOpened: <RiIcons.RiArrowUpSFill />,
                subNav: [
                    {
                        title: "Management",
                        icon: <IoIcons.IoIosPaper />,
                        iconClosed: <RiIcons.RiArrowDownSFill />,
                        iconOpened: <RiIcons.RiArrowUpSFill />,
                        subNav: [
                            {
                                title: "Sales Management Dashboard",
                                path: "/Home/SalesDashboard",
                                icon: <IoIcons.IoIosPaper />,
                            },
                        ],
                    },
                    {
                        title: "View All Enquiries",
                        path: "/Home/ViewAllEnquiries",
                        icon: <IoIcons.IoIosPaper />,
                    },
                ],
            },

            {
                title: "Reports",
                icon: <FaIcons.FaFileAlt />,
                iconClosed: <RiIcons.RiArrowDownSFill />,
                iconOpened: <RiIcons.RiArrowUpSFill />,
                subNav: [
                    {
                        title: "Billing Planner",
                        path: "/Home/RptBillingPlanner",
                        icon: <IoIcons.IoIosPaper />,
                    },
                ],
            },

        ],
    },
    {
        title: "Help",
        path: "/support",
        icon: <IoIcons.IoMdHelpCircle />,
    },
];
