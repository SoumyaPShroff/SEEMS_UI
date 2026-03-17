
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FavouritesProvider } from "./components/FavouritesContext";
import axios from "axios";
import { baseUrl } from "./const/BaseUrl";
import SelectControl from "./components/resusablecontrols/SelectControl";

type Option = { value: string; label: string };

const IMPERSONATOR_SESSION_KEY = "ImpersonatorUserID";

interface HomeProps {
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const parseRoleFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const PageContent = styled.div<{ collapsed: boolean }>`
  margin-left: ${({ collapsed }) => (collapsed ? "72px" : "240px")};
  margin-top: 80px;
  transition: margin-left 0.25s ease;
  min-height: calc(100vh - 80px);
  background: white; /* professional light background */
`;

const Home: React.FC<HomeProps> = ({ userId, setUserId }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [impersonatorUserId, setImpersonatorUserId] = useState<string>(() => {
    return sessionStorage.getItem(IMPERSONATOR_SESSION_KEY) ?? "";
  });
  const [canShowEmployeeSelect, setCanShowEmployeeSelect] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Option[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(() => {
    const impersonator = sessionStorage.getItem(IMPERSONATOR_SESSION_KEY);
    if (impersonator && userId && impersonator !== userId) return userId;
    return "";
  });
  if (!userId) return null;

  const userOptions = useMemo<Option[]>(
    () => [{ value: "", label: "-- Select Employee --" }, ...employeeOptions],
    [employeeOptions]
  );

  const accessCheckUserId = impersonatorUserId || userId;

  const switchSessionToUser = async (newUserId: string) => {
    sessionStorage.setItem("SessionUserID", newUserId);
    sessionStorage.removeItem("SessionUserName");
    sessionStorage.removeItem("SessionDesigID");

    try {
      const [userNameRes, designationNameRes] = await Promise.all([
        axios.get<string>(`${baseUrl}/UserName/${encodeURIComponent(newUserId)}`),
        axios.get<string>(`${baseUrl}/UserDesignation/${encodeURIComponent(newUserId)}`),
      ]);

      sessionStorage.setItem("SessionUserName", String(userNameRes.data ?? ""));

      const designationName = String(designationNameRes.data ?? "").trim();
      if (designationName) {
        const designationIdRes = await axios.get<string>(
          `${baseUrl}/RoleDesignID/${encodeURIComponent(designationName)}`
        );
        sessionStorage.setItem("SessionDesigID", String(designationIdRes.data ?? ""));
      } else {
        sessionStorage.removeItem("SessionDesigID");
      }
    } catch (err) {
      console.error("Failed to refresh session user metadata", err);
    }

    setUserId(newUserId);
    navigate("/Home", { replace: true });
  };

  const handleEmployeeChange = async (e: any) => {
    const next = String(e?.target?.value ?? "").trim();

    // Exit impersonation (back to admin) when cleared.
    if (!next) {
      const backTo = impersonatorUserId || sessionStorage.getItem(IMPERSONATOR_SESSION_KEY) || "";
      if (backTo) {
        sessionStorage.removeItem(IMPERSONATOR_SESSION_KEY);
        setImpersonatorUserId("");
        setSelectedEmployeeId("");
        await switchSessionToUser(backTo);
      }
      return;
    }

    // First time impersonation: remember who initiated it so we can switch back.
    if (!impersonatorUserId) {
      sessionStorage.setItem(IMPERSONATOR_SESSION_KEY, userId);
      setImpersonatorUserId(userId);
    }

    setSelectedEmployeeId(next);
    await switchSessionToUser(next);
  };

  useEffect(() => {
    let cancelled = false;

    const resolveAdminAccess = async () => {
      try {
        const roleRes = await axios.get(
          `${baseUrl}/UserDesignation/${encodeURIComponent(accessCheckUserId)}`
        );
        const roleName = String(roleRes.data ?? "");
        if (!roleName) {
          if (!cancelled) setCanShowEmployeeSelect(false);
          return;
        }

        const accessRes = await axios.get(
           `${baseUrl}/UserRoleInternalRights/${roleName}/${encodeURIComponent("adminuser")}`);
        const raw = accessRes.data;
        const adminValue =
          typeof raw === "object" && raw != null
            ? (raw as any).adminuser ?? (raw as any).data?.adminuser ?? (raw as any).data
            : raw;

        const canShow = parseRoleFlag(adminValue);

        if (!cancelled) setCanShowEmployeeSelect(canShow);
      } catch (err) {
        console.error("Failed to resolve adminuser access", err);
        if (!cancelled) setCanShowEmployeeSelect(false);
      }
    };

    resolveAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [accessCheckUserId]);

  useEffect(() => {
    let cancelled = false;

    const loadEmployees = async () => {
      if (!canShowEmployeeSelect) {
        if (!cancelled) setEmployeeOptions([]);
        return;
      }

      try {
        const res = await axios.get(`${baseUrl}/AllActiveEmployees`);
        const rows = Array.isArray(res.data) ? res.data : [];
        const options: Option[] = rows
          .map((u: any) => {
            const id = String(u.iDno ?? u.idno ?? u.id ?? "").trim();
            const name = String(u.name ?? u.username ?? "").trim();
            if (!id || !name) return null;
            return { value: id, label: `${id} --- ${name}` };
          })
          .filter(Boolean) as Option[];

        if (!cancelled) setEmployeeOptions(options);
      } catch (err) {
        console.error("Failed to load active employees", err);
        if (!cancelled) setEmployeeOptions([]);
      }
    };

    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, [canShowEmployeeSelect]);

  return (
    <>
      <FavouritesProvider
        key={`${userId}:${sessionStorage.getItem("SessionDesigID") ?? ""}`}
        sessionUserID={userId}
      >
      <Sidebar
        sessionUserID={userId}
        setUserId={setUserId}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        headerRight={
          canShowEmployeeSelect ? (
            <SelectControl
              name="homeEmployee"
              label="Employee"
              value={selectedEmployeeId}
              options={userOptions}
              onChange={handleEmployeeChange}
              fullWidth
              disablePortal
            />
          ) : null
        }
      />

      {/* Child routes render here */}
      <PageContent collapsed={collapsed}>
        <Outlet key={`${userId}:${sessionStorage.getItem("SessionDesigID") ?? ""}`} />
      </PageContent>
      </FavouritesProvider>
    </>
  );
};

export default Home;
