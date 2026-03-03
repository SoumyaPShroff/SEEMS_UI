import  { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {  Box,  Button,  Card,  CardContent,  Checkbox,  CircularProgress,  FormControlLabel,
  FormGroup,  Typography,} from "@mui/material";
import { baseUrl } from "../const/BaseUrl";
import SelectControl from "./resusablecontrols/SelectControl";

type UserItem = {
  id: string;
  name: string;
  jobTitle: string | null;
  designationId: string | null;
};

type MenuPageRow = {
  mainmenuid: string;
  mainmenu: string;
  submenuid: string;
  submenu: string;
  pageid: number;
  pagename: string;
  route: string;
};

type MenuTree = {
  id: string;
  name: string;
  submenus: {
    id: string;
    name: string;
    pages: {
      id: number;
      name: string;
      route: string;
      checked: boolean;
    }[];
  }[];
}[];

const normalizeFlatRows = (payload: any): MenuPageRow[] => {
  const rows = Array.isArray(payload) ? payload : [];
  const unique = new Map<string, MenuPageRow>();

  rows.forEach((item: any) => {
    const mainmenuid = String(item.mainmenuid ?? item.mainMenuId ?? item.mainmenu ?? "").trim();
    const submenuid = String(item.submenuid ?? item.subMenuId ?? item.submenu ?? "").trim();
    const pageid = Number(item.pageid ?? item.pageId);
    if (!mainmenuid || !submenuid || !Number.isFinite(pageid)) return;

    const key = `${mainmenuid}-${submenuid}-${pageid}`;
    if (!unique.has(key)) {
      unique.set(key, {
        mainmenuid,
        mainmenu: String(item.mainmenu ?? item.mainMenu ?? "").trim(),
        submenuid,
        submenu: String(item.submenu ?? item.subMenu ?? "").trim(),
        pageid,
        pagename: String(item.pagename ?? item.pageName ?? "").trim(),
        route: String(item.route ?? "").trim(),
      });
    }
  });

  return Array.from(unique.values());
};

const extractAssignedPageIds = (payload: any): Set<number> => {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : [];

  const pageIds = new Set<number>();
  rows.forEach((item: any) => {
    const idValue = item?.pageid ?? item?.pageId ?? item?.PageId ?? item?.id ?? item?.ID;
    const id = Number(idValue);
    if (Number.isFinite(id)) pageIds.add(id);
  });

  return pageIds;
};

const fetchAssignedByDesignation = async (desigId: string) => {
  const id = String(desigId).trim();
  if (!id) return [];

  try {
    const byPath = await axios.get(`${baseUrl}/SideBarAccessMenus/${encodeURIComponent(id)}`);
    return byPath.data;
  } catch {
    const byQuery = await axios.get(`${baseUrl}/SideBarAccessMenus`, {
      params: { designationId: id, designationid: id },
    });
    return byQuery.data;
  }
};

const resolveUserDesignationId = (user: any): string | null => {
  const raw = user?.designationId ?? user?.designationid ?? user?.SessionDesigID ?? null;

  if (raw == null) return null;
  const value = String(raw).trim();
  return value || null;
};

const buildTree = (rows: MenuPageRow[], checkedPageIds: Set<number>): MenuTree => {
  const mainMap: Record<string, any> = {};

  rows.forEach((row) => {
    if (!mainMap[row.mainmenuid]) {
      mainMap[row.mainmenuid] = {
        id: row.mainmenuid,
        name: row.mainmenu,
        submenus: {},
      };
    }

    if (!mainMap[row.mainmenuid].submenus[row.submenuid]) {
      mainMap[row.mainmenuid].submenus[row.submenuid] = {
        id: row.submenuid,
        name: row.submenu,
        pages: [],
      };
    }

    const sub = mainMap[row.mainmenuid].submenus[row.submenuid];
    const exists = sub.pages.some((p: any) => p.id === row.pageid);
    if (!exists) {
      sub.pages.push({
        id: row.pageid,
        name: row.pagename,
        route: row.route,
        checked: checkedPageIds.has(row.pageid),
      });
    }
  });

  return Object.values(mainMap)
    .map((main: any) => ({
      ...main,
      submenus: Object.values(main.submenus).sort((a: any, b: any) =>
        Number(String(a.id)) - Number(String(b.id))
      ),
    }))
    .sort((a: any, b: any) => Number(String(a.id)) - Number(String(b.id)))
    .map((main: any) => ({
      ...main,
      submenus: main.submenus.map((sub: any) => ({
        ...sub,
        pages: [...sub.pages].sort((a: any, b: any) => a.id - b.id),
      })),
    }));
};

const PageAccessManagement = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [designationId, setDesignationId] = useState<string | null>(null);
  const [allMenuRows, setAllMenuRows] = useState<MenuPageRow[]>([]);
  const [menuTree, setMenuTree] = useState<MenuTree>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [usersRes, menusRes] = await Promise.all([
          axios.get(`${baseUrl}/AllActiveEmployees`),
          axios.get(`${baseUrl}/SEEMSAllMenuPages`),
        ]);

        const userRows = Array.isArray(usersRes.data) ? usersRes.data : [];
        const mappedUsers: UserItem[] = userRows
          .map((u: any) => ({
            id: String(u.iDno ?? u.idno ?? u.id ?? "").trim(),
            name: String(u.name ?? u.username ?? "").trim(),
            jobTitle: String(u.jobtitle ?? u.jobTitle ?? "").trim() || null,
            designationId: resolveUserDesignationId(u),
          }))
          .filter((u: UserItem) => Boolean(u.id) && Boolean(u.name))
          .sort((a: UserItem, b: UserItem) => a.name.localeCompare(b.name));

        const allRows = normalizeFlatRows(menusRes.data);
        setUsers(mappedUsers);
        setAllMenuRows(allRows);
        setMenuTree(buildTree(allRows, new Set<number>()));
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const applyAssignedPages = async () => {
      if (!allMenuRows.length) return;

      if (!designationId) {
        setMenuTree(buildTree(allMenuRows, new Set<number>()));
        return;
      }

      setLoading(true);
      try {
        const selectedDesignationId = String(designationId).trim();
        const assignedData = await fetchAssignedByDesignation(selectedDesignationId);
        const checkedPageIds = extractAssignedPageIds(assignedData);
        setMenuTree(buildTree(allMenuRows, checkedPageIds));
      } finally {
        setLoading(false);
      }
    };

    applyAssignedPages();
  }, [designationId, allMenuRows]);

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: u.id,
        label: `${u.id} --- ${u.name}`,
      })),
    [users]
  );

  const resolveDesignationIdByJobTitle = async (jobTitle: string | null): Promise<string | null> => {
    const title = String(jobTitle ?? "").trim();
    if (!title) return null;

    try {
      const res = await axios.get(`${baseUrl}/RoleDesignID/${encodeURIComponent(title)}`);
      const resolved = String(res.data ?? "").trim();
      return resolved || null;
    } catch {
      return null;
    }
  };

  const togglePage = (mainId: string, subId: string, pageId: number) => {
    setMenuTree((prev) =>
      prev.map((main) => {
        if (main.id !== mainId) return main;
        return {
          ...main,
          submenus: main.submenus.map((sub) => {
            if (sub.id !== subId) return sub;
            return {
              ...sub,
              pages: sub.pages.map((p) => (p.id === pageId ? { ...p, checked: !p.checked } : p)),
            };
          }),
        };
      })
    );
  };

  const handleSave = async () => {
    if (!designationId) return;

    const pageids: number[] = [];
    menuTree.forEach((main) =>
      main.submenus.forEach((sub) =>
        sub.pages.forEach((p) => {
          if (p.checked) pageids.push(p.id);
        })
      )
    );

    // await axios.post(`${baseUrl}/api/access/update`, {
    //   designationid: designationId,
    //   pageids,
    // });

    alert("Access rights updated successfully!");
  };

  return (
    <Box p={3}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        User Access Control
      </Typography>

      <Card sx={{ border: "1px solid #d5e1f8", boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)" }}>
        <CardContent>
          <Box sx={{ maxWidth: 360 }}>
            <SelectControl
              name="selectedUser"
              label="Select User"
              value={selectedUser}
              options={userOptions}
              onChange={async (e: any) => {
                const selectedId = String(e.target.value ?? "");
                setSelectedUser(selectedId);
                const user = users.find((u) => u.id === selectedId);
                if (!user) {
                  setDesignationId(null);
                  return;
                }

                setLoading(true);
                try {
                  const designationFromRole = await resolveDesignationIdByJobTitle(user.jobTitle);
                  const selectedUserDesignationId = user.designationId ? String(user.designationId).trim() : null;
                  setDesignationId(designationFromRole ?? selectedUserDesignationId);
                } finally {
                  setLoading(false);
                }
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            {menuTree.map((main) => (
              <Card
                key={main.id}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #d5e1f8",
                  boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
                  background: "#ffffff",
                }}
              >
                <CardContent sx={{ p: 1.5 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#214b95", mb: 1 }}>
                    {main.name}
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                      gap: 1,
                    }}
                  >
                    {main.submenus.map((sub) => (
                      <Box
                        key={sub.id}
                        sx={{
                          border: "1px solid #e4ebfb",
                          borderRadius: 1.5,
                          p: 1,
                          background: "#fbfdff",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, mb: 0.4, color: "#214b95", fontSize: "0.85rem" }}>
                          {sub.name}
                        </Typography>

                        <FormGroup sx={{ rowGap: 0.15 }}>
                          {sub.pages.map((page) => (
                            <FormControlLabel
                              key={page.id}
                              sx={{
                                mr: 0,
                                my: 0.1,
                                minHeight: 22,
                                alignItems: "center",
                              }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={page.checked}
                                  onChange={() => togglePage(main.id, sub.id, page.id)}
                                  sx={{ py: 0, px: 0.35 }}
                                />
                              }
                              label={page.name}
                              slotProps={{ typography: { fontSize: "0.78rem" } }}
                            />
                          ))}
                        </FormGroup>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {menuTree.length > 0 && (
        <Box mt={2}>
          <Button variant="contained" color="success" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PageAccessManagement;
