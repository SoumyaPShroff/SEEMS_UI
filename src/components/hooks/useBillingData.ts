import { useState } from "react";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";

export const useBillingData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBillingData = async (startdate: string, enddate: string, costcenter?: string) => {
    if (!startdate || !enddate) return;
    setLoading(true);
    try {
      const params: any = { startdate, enddate };
      if (costcenter && costcenter !== "All") params.costcenter = costcenter;

      const res = await axios.get(`${baseUrl}/getBillingPlannerRptData`, { params });
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