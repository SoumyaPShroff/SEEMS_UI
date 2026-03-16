import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, FormGroup, Typography,} from "@mui/material";
import { baseUrl } from "../const/BaseUrl";
import SelectControl from "./resusablecontrols/SelectControl";

type UserItem = {
  id: string;
  name: string;
  jobTitle: string | null;
  designationId: number | null;
};

type MenuPageRow = {
  mainmenuid: number;
  mainmenu: string;
  submenuid: number;
  submenu: string;
  pageid: number;
  pagename: string;
  defaultpage?: string | boolean | number | null;
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
      checked: boolean;
    }[];
  }[];
}[];

const isDefaultYes = (value: unknown) => String(value ?? "").trim().toUpperCase() === "YES";

const normalizeFlatRows = (payload: any): MenuPageRow[] => {
  const rows = Array.isArray(payload) ? payload : [];
  const unique = new Map<string, MenuPageRow>();

  rows.forEach((item: any) => {
    const mainmenuid = Number(item.mainmenuid ?? "");
    const submenuid = Number(item.submenuid ?? "");
    const pageid = Number(item.pageid ?? item.pageId);
   if (!Number.isFinite(mainmenuid) || !Number.isFinite(submenuid) || !Number.isFinite(pageid)) return;

    const key = `${mainmenuid}-${submenuid}-${pageid}`;

    const defaultpage =
      item.defaultpage ??
      item.defaultPage ??
      item.default ??
      item.isDefault ??
      item.isdefault ??
      null;

    const existing = unique.get(key);
    if (existing) {
      if (!isDefaultYes(existing.defaultpage) && isDefaultYes(defaultpage)) {
        existing.defaultpage = "YES";
        unique.set(key, existing);
      }
      return;
    }

    unique.set(key, {
      mainmenuid,
      mainmenu: String(item.mainmenu ?? ""),
      submenuid,
      submenu: String(item.submenu ?? ""),
      pageid,
      pagename: String(item.pagename ?? ""),
      defaultpage,
    });
  });

  return Array.from(unique.values());
};

const extractDefaultPageIds = (rows: MenuPageRow[]) => {
  const ids = new Set<number>();
  rows.forEach((row) => {
    if (isDefaultYes(row.defaultpage)) ids.add(row.pageid);
  });
  return ids;
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
  const id = Number(desigId);
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

const resolveUserDesignationId = (user: any): number  | null => {
  const raw = user?.SessionDesigID ?? null;

  if (raw == null) return null;
  const value = Number(raw);
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
  const [defaultPageIds, setDefaultPageIds] = useState<Set<number>>(new Set<number>());
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
            id: String(u.iDno ?? u.idno ?? u.id ?? ""),
            name: String(u.name ?? u.username ?? ""),
            jobTitle: String(u.jobtitle ?? u.jobTitle ?? "") || null,
            designationId: resolveUserDesignationId(u),
          }))
          .filter((u: UserItem) => Boolean(u.id) && Boolean(u.name))
          .sort((a: UserItem, b: UserItem) => a.name.localeCompare(b.name));

        const allRows = normalizeFlatRows(menusRes.data);
        const defaults = extractDefaultPageIds(allRows);
        setUsers(mappedUsers);
        setAllMenuRows(allRows);
        setDefaultPageIds(defaults);
        setMenuTree([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const applyAssignedPages = async () => {
      if (!selectedUser) {
        setMenuTree([]);
        return;
      }

      if (!allMenuRows.length) return;

      if (!designationId) {
        setMenuTree(buildTree(allMenuRows, defaultPageIds));
        return;
      }

      setLoading(true);
      try {
        const selectedDesignationId = String(designationId);
        const assignedData = await fetchAssignedByDesignation(selectedDesignationId);
        const checkedPageIds = extractAssignedPageIds(assignedData);
        const combinedChecked = new Set<number>([...Array.from(defaultPageIds), ...Array.from(checkedPageIds)]);
        setMenuTree(buildTree(allMenuRows, combinedChecked));
      } finally {
        setLoading(false);
      }
    };

    applyAssignedPages();
  }, [selectedUser, designationId, allMenuRows, defaultPageIds]);

  const userOptions = useMemo(
    () => [
      { value: "", label: "-- Select User --" },
      ...users.map((u) => ({
        value: u.id,
        label: `${u.id} --- ${u.name}`,
      })),
    ],
    [users]
  );

  const resolveDesignationIdByJobTitle = async (jobTitle: string | null): Promise<string | null> => {
    const title = String(jobTitle ?? "");
    if (!title) return null;

    try {
      const res = await axios.get(`${baseUrl}/RoleDesignID/${encodeURIComponent(title)}`);
      const resolved = String(res.data ?? "");
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

    const payload: any[] = [];

    menuTree.forEach((main) =>
      main.submenus.forEach((sub) =>
        sub.pages.forEach((p) => {
          if (p.checked) {
            payload.push({
              accessid: 0, // let backend handle insert/update
              designationid: Number(designationId),
              pageid: p.id,
              can_view: 1,
              can_add: 1,
              can_edit: 1,
              can_delete: 1,
            });
          }
        })
      )
    );

    try {
      await axios.post(
        `${baseUrl}/UpdateUserPageAccessRights`,
        payload
      );
      
      alert("Access rights updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update access rights.");
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        User Access Control
      </Typography>
      <Box sx={{ maxWidth: 300, mt: 2 }}>
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
              setMenuTree([]);
              return;
            }

            setLoading(true);
            try {
              const designationFromRole = await resolveDesignationIdByJobTitle(user.jobTitle);
              const selectedUserDesignationId = user.designationId ? String(user.designationId) : null;
              setDesignationId(designationFromRole ?? selectedUserDesignationId);
            } finally {
              setLoading(false);
            }
          }}
        />
      </Box>

      {!selectedUser ? (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ color: "#6b7280" }}>Select a user to load page access.</Typography>
        </Box>
      ) : (
      <Box sx={{ mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(320px, 420px))" },
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            {menuTree.map((main) => (
              <Card
                key={main.id}
                sx={{
                  width: "100%",
                  maxWidth: 420,
                  borderRadius: 2,
                  border: "2px solid #7aa7eb",
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
                          border: "2px solid #b8d0f5",
                          borderRadius: 1.5,
                          p: 1,
                          background: "#f6faff",
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
      )}

      {!loading && Boolean(selectedUser) && menuTree.length > 0 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Button variant="contained" color="success" onClick={handleSave}>
            Save Changes
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PageAccessManagement;
