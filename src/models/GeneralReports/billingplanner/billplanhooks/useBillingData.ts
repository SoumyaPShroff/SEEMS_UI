import { useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../../const/BaseUrl";

export const useBillingData = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingData = async (startdate: string, enddate: string, costcenter?: string) => {
    if (!startdate || !enddate) return;
    setLoading(true);
    try {
      // Build params for query string
      const params: any = { startdate, enddate };
      if (costcenter && costcenter !== "All") {
        params.costcenter = costcenter;
      }

      // Since your API expects query parameters, this is correct
      const res = await axios.get<any[]>(`${baseUrl}/BillingPlanner`, { params });
      const rows = res.data.map((item: any, i: number) => ({ id: i + 1, ...item }));
      setData(rows);
    } catch (err) {
      console.error("Error fetching billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, fetchBillingData };
};