import { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";

const parseAccessFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

export const useRoleAccess = (loginId: string, accessKey: string) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchAccess = async () => {
      if (!loginId || !accessKey) {
        if (!cancelled) {
          setHasAccess(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const userRoleRes = await axios.get(`${baseUrl}/api/Home/UserDesignation/${encodeURIComponent(loginId)}`);
        const userRole = String(userRoleRes.data ?? "").trim();

        if (!userRole) {
          if (!cancelled) setHasAccess(false);
          return;
        }

        const roleCheck = await axios.get(
          `${baseUrl}/api/Home/UserRoleInternalRights/${encodeURIComponent(userRole)}/${encodeURIComponent(accessKey)}`
        );
        const flag = parseAccessFlag(roleCheck.data);
        if (!cancelled) setHasAccess(flag);
      } catch (error) {
        console.error(`Failed to load access flag for ${accessKey}`, error);
        if (!cancelled) setHasAccess(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchAccess();

    return () => {
      cancelled = true;
    };
  }, [accessKey, loginId]);

  return { hasAccess, loading };
};
