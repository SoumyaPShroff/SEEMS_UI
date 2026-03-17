import axios from "axios";
import { FaUsers, FaLaptop, FaClipboardList, FaClock, FaRegFileAlt } from "react-icons/fa";
import { baseUrl } from "./BaseUrl";

export interface DashboardActionCard {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  route: string;
  gradient: string;
  badge?: string; // optional because only team has badge
}

type DefaultPageRow = {
  pageid?: number;
  pageId?: number;
  pagename?: string;
  pageName?: string;
  route?: string;
  pageroute?: string;
  pageRoute?: string;
  defaultpage?: string | boolean | number | null;
  mainmenu?: string;
  submenu?: string;
};

type AllMenuPageRow = {
  pageid?: number;
  pageId?: number;
  pagename?: string;
  pageName?: string;
  route?: string;
  mainmenu?: string;
  submenu?: string;
};

const isDefaultYes = (value: unknown) => {
  const text = String(value ?? "").trim().toUpperCase();
  return text === "YES";
};

const normalizeRoute = (raw: unknown): string | null => {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("/")) return value;
  return `/Home/${value}`;
};

const pickString = (...candidates: unknown[]) => {
  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (text) return text;
  }
  return "";
};

const pickNumber = (...candidates: unknown[]) => {
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

const isMeetMyTeam = (title: string, route: string) => {
  const text = `${title} ${route}`.toLowerCase().replace(/\s+/g, "");
  return text.includes("meetmyteam");
};

const resolveCardIcon = (title: string, route: string) => {
  const text = `${title} ${route}`.toLowerCase();
  if (text.includes("team")) return <FaUsers />;
  if (text.includes("it")) return <FaLaptop />;
  if (text.includes("seems")) return <FaClipboardList />;
  if (text.includes("timesheet")) return <FaClock />;
  return <FaRegFileAlt />;
};

const gradients = [
  "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
  "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
  "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
  "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)",
  "linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)",
  "linear-gradient(135deg, #ecfccb 0%, #d9f99d 100%)",
];

const buildDesc = (main: string, sub: string) => {
  if (main && sub) return `${main}`;
 // if (sub) return sub;
 // if (main) return main;
  return "Open page";
};

const fetchAllMenuPagesById = async () => {
  const res = await axios.get(`${baseUrl}/SEEMSAllMenuPages`);
  const rows = (Array.isArray(res.data) ? res.data : []) as AllMenuPageRow[];

  const byId = new Map<number, { route: string | null; title: string; main: string; sub: string }>();
  rows.forEach((row) => {
    const pageId = pickNumber(row.pageid);
    if (pageId == null) return;

    if (byId.has(pageId)) return;

    const title = pickString(row.pagename);
    const route = normalizeRoute(row.route);
    const main = pickString(row.mainmenu);
    const sub = pickString(row.submenu);
    byId.set(pageId, { route, title, main, sub });
  });

  return byId;
};

export const fetchDefaultActionCards = async (): Promise<DashboardActionCard[]> => {
  const designationId = sessionStorage.getItem("SessionDesigID");
  if (!designationId) return [];

  const res = await axios.get(`${baseUrl}/SideBarAccessMenus/${encodeURIComponent(designationId)}`);
  const rows = (Array.isArray(res.data) ? res.data : []) as DefaultPageRow[];

  const meetMyTeamRow = rows.find((row) => {
    const title = pickString(row.pagename, row.pageName);
    const route = pickString(row.route, row.pageRoute, row.pageroute);
    return isMeetMyTeam(title, route);
  });

  const defaultRows = rows.filter((row) =>
    isDefaultYes(row.defaultpage)
  );

  const needsRouteLookup = defaultRows.some((row) => {
    const pageId = pickNumber(row.pageid, row.pageId);
    if (pageId == null) return false;
    const route = normalizeRoute(row.route ?? row.pageRoute ?? row.pageroute);
    return !route;
  });

  const allPagesById = needsRouteLookup ? await fetchAllMenuPagesById() : new Map();

  const unique = new Map<string, DashboardActionCard>();
  defaultRows.forEach((row, index) => {
    const pageId = pickNumber(row.pageid, row.pageId);
    const fallback = pageId != null ? allPagesById.get(pageId) : undefined;

    const title = pickString(row.pagename, row.pageName, fallback?.title);
    const route =
      normalizeRoute(row.route ?? row.pageRoute ?? row.pageroute) ?? fallback?.route ?? "/Home/ComingSoon";

    if (!title) return;

    const key = pageId != null ? `page-${pageId}` : `route-${route}`;
    if (unique.has(key)) return;

    const main = pickString(row.mainmenu, fallback?.main);
    const sub = pickString(row.submenu, fallback?.sub);
    const desc = buildDesc(main, sub);

    unique.set(key, {
      key,
      title,
      desc,
      icon: resolveCardIcon(title, route),
      route,
      gradient: gradients[index % gradients.length],
    });
  });

  // Ensure "Meet My Team" shows up if the user has access, even if it's not configured as a default page.
  const hasMeetMyTeam = Array.from(unique.values()).some((card) => isMeetMyTeam(card.title, card.route));
  if (!hasMeetMyTeam && meetMyTeamRow) {
    const title = pickString(meetMyTeamRow.pagename, meetMyTeamRow.pageName) || "Meet My Team";
    const route =
      normalizeRoute(meetMyTeamRow.route ?? meetMyTeamRow.pageRoute ?? meetMyTeamRow.pageroute) ?? "/Home/MeetMyTeam";
    const key = `route-${route}`;
    unique.set(key, {
      key,
      title,
      desc: "Team",
      icon: resolveCardIcon(title, route),
      route,
      gradient: gradients[0],
    });
  }

  return Array.from(unique.values());
};
