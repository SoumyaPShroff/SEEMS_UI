import { useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../../../const/BaseUrl";

export const useBillingData = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingData = async (startdate: string, enddate: string, costcenter?: string) => {
    if (!startdate || !enddate) return;
    setLoading(true);
    try {
      // startdate/enddate are route path segments; costcenter is a query param
      const params: any = {};
      if (costcenter && costcenter !== "All") {
        params.costcenter = costcenter;
      }

      const res = await axios.get<any[]>(
        `${baseUrl}/api/Job/BillingPlanner/${startdate}/${enddate}`,
        { params }
      );
      if (!Array.isArray(res.data)) {
        console.warn("BillingPlanner response was not an array:", res.data);
        setData([]);
        return [];
      }
      const rows = res.data.map((item: any, i: number) => ({ id: i + 1, ...item }));
      setData(rows);
      return rows;
    } catch (err) {
      console.error("Error fetching billing data:", err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, fetchBillingData };
};
