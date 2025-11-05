import { useState, useEffect } from "react";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";

export const useManagers = () => {
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const res = await axios.get<any[]>(`${baseUrl}/HOPCManagerList`);
      const data = res.data || [];
      const allOption = { hopc1id: "All", hopc1name: "All", costcenter: "All" };
      setManagers([allOption, ...(data || [])]);

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