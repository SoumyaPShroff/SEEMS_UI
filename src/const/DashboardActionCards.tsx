import { FaUsers, FaLaptop, FaClipboardList, FaClock } from "react-icons/fa";

export interface DashboardActionCard {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  route: string;
  gradient: string;
  badge?: string; // optional because only team has badge
}

export const actionCards: DashboardActionCard[] = [
  {
    key: "team",
    title: "My Team",
    desc: "View your team roster",
    icon: <FaUsers />,
    route: "/Home/ComingSoon",
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
  },
  {
    key: "it",
    title: "IT Request",
    desc: "Ask for IT help or assets",
    icon: <FaLaptop />,
    route: "/Home/ComingSoon",
    gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
  },
  {
    key: "seems",
    title: "SEEMS Request",
    desc: "Submit a SEEMS request",
    icon: <FaClipboardList />,
    route: "/Home/ComingSoon",
    gradient: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
  },
  {
    key: "timesheet",
    title: "Timesheet",
    desc: "Update weekly hours",
    icon: <FaClock />,
    route: "/Home/ComingSoon",
    gradient: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
  },
];
