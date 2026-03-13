import { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";

interface CostCenterInfo {
  hopc1id: string;
  hopc1name: string;
  costcenter: string;
}

export const useManagers = (loginId: string, pageName: string) => {
  const [managers, setManagers] = useState<CostCenterInfo[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {

      // Step 1: Get user jobtitle
      const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
      const userRole = userRoleRes.data;
      const isManagerTitle = String(userRole ?? "").toLowerCase().includes("manager");

      // Step 2: Check if user has special role for this page and role
      const roleCheck = await axios.get<boolean>(`${baseUrl}/UserRoleInternalRights/${userRole}/${pageName}`)
      const hasSpecialRole = roleCheck.data === true;

      if (!hasSpecialRole) {
        let managerCostCenterId = loginId;
        let hasDelegate = false;
        //promise consts  return Promises which then run them together,so once all api's runs at same time
        const delegatePromise = axios.get(`${baseUrl}/CostcenterDelegates/${loginId}`);
        //A Promise represents a value that will be available in the future.
        const employeePromise = !isManagerTitle
          ? axios.get<{ reporttopersonid?: string | number }>(`${baseUrl}/EmployeeDetails/${loginId}`)
          : Promise.resolve(null);
          //handle asynchronous operations
          // Promise.allSettled used because if one API fails, the other still succeeds.
        const [delegateResult, employeeResult] = await Promise.allSettled([
          delegatePromise,
          employeePromise,
        ]);

        if (delegateResult.status === "fulfilled") {
          const delegateData = delegateResult.value.data;
          hasDelegate = Array.isArray(delegateData) && delegateData.length > 0;
        } else {
          console.warn(
            "Delegate details lookup failed. Falling back to cost center info.",
            delegateResult.reason
          );
        }
        // if delegated user lgoins, consider reportingpersonif of this user (which is manager as param to checking managercostcener)
        //if manager logins and he has delegated any user, then send his id as prama to checking manager costcenter
        //managerCostCenterId will set accordingly and sent to ManagerCostcenterInfo api
        if (employeeResult.status === "fulfilled" && employeeResult.value) {
          const reportToPersonId = String(employeeResult.value.data?.reporttopersonid ?? "").trim();
          managerCostCenterId = reportToPersonId || loginId;
        } else if (employeeResult.status === "rejected") {
          console.warn("Employee details lookup failed. Falling back to loginId.", employeeResult.reason);
        }

        if (hasDelegate) {
          const [hopcRes, costCenterRes] = await Promise.all([
            axios.get<CostCenterInfo[]>(
              `${baseUrl}/HOPCManagerList?sessionUserId=${encodeURIComponent(loginId)}`
            ),
            axios.get<CostCenterInfo[]>(
              `${baseUrl}/ManagerCostcenterInfo/${encodeURIComponent(managerCostCenterId)}`
            )
          ]);
          const hopcData = hopcRes.data || [];
          const costCenterData = costCenterRes.data || [];
          const costCenterSet = new Set(
            costCenterData.map(item => String(item.costcenter ?? "").trim()).filter(Boolean)
          );

          const filtered = hopcData.filter(item =>
            costCenterSet.has(String(item.costcenter ?? "").trim())
          );

          setManagers(filtered);
        } else {
          // fill mutliple cost centers for same user (eg. managers with multiple cost centers)
          const costCenterRes = await axios.get<CostCenterInfo[]>(
            `${baseUrl}/ManagerCostcenterInfo/${encodeURIComponent(managerCostCenterId)}`
          );

          if (costCenterRes.data && costCenterRes.data.length > 0) {
            setManagers(
              costCenterRes.data.map(item => ({
                hopc1id: item.hopc1id,
                hopc1name: item.hopc1name,
                costcenter: item.costcenter,
              }))
            );
          } else {
            console.warn("No manager info found for", loginId);
          }
        }
      } else {
        //fill All
        const res = await axios.get<CostCenterInfo[]>(`${baseUrl}/HOPCManagerList`);
        const data = res.data || [];
        const allOption = { hopc1id: "All", hopc1name: "All", costcenter: "All" };
        setManagers([allOption, ...(data || [])]);
      }
    } catch (err) {
      console.error("Error fetching managers:", err);
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  return { managers, loadingManagers };
};
