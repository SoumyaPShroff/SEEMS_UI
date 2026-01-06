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

      // Step 2: Check if user has special role for this page and role
      const roleCheck = await axios.get<boolean>(`${baseUrl}/UserRoleInternalRights/${userRole}/${pageName}`)
      const hasSpecialRole = roleCheck.data === true;

      if (!hasSpecialRole) {
        // Step 3: Get cost center from user session or API
       // const costCenterRes = await axios.get(`${baseUrl}/ManagerCostcenterInfo/${loginId}`);
        const costCenterRes = await axios.get<CostCenterInfo[]>(`${baseUrl}/ManagerCostcenterInfo/${loginId}`);
        const userCostCenterInfo = costCenterRes.data?.[0];
        if (userCostCenterInfo) {
          // Step 4: Set dropdown to user's cost center only
          setManagers([
            {
              hopc1id: userCostCenterInfo.hopc1id,
              hopc1name: userCostCenterInfo.hopc1name,
              costcenter: userCostCenterInfo.costcenter,
            }
          ]);
        } else {
          console.warn("No manager info found for", loginId);
        }
      } else {
        //fill All
        //const res = await axios.get<any[]>(`${baseUrl}/HOPCManagerList`);
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