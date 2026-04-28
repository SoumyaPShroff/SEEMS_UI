import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, LineController, Title, Tooltip, Legend, } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import SalesManagerTargetTable from "./SalesManagerTargetTable";
import { baseUrl } from "../../../../../const/BaseUrl";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, LineController, Title, Tooltip, Legend, ChartDataLabels);

interface ChartProps {
  data: any[];
}

const normalizeId = (value: unknown) => String(value ?? "").trim().toUpperCase();
const parseNumber = (value: unknown) => {
  const cleaned = String(value ?? "0").replace(/,/g, "").trim();
  const num = Number.parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
};

export const SalesManagerChart: React.FC<ChartProps> = ({ data }) => {
  const [targets, setTargets] = useState<any[]>([]);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/SalesManagersTargets`);
        setTargets(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching sales manager targets:", err);
      }
    };
    fetchTargets();
  }, []);

  if (!data || data.length === 0) {
    return <p>No sales manager data available.</p>;
  }

  const totals: Record<string, any> = {};

  data.forEach((item) => {
    const mgr = item.salesManager || "Unknown";
    const job = item.jobNumber || "";
    const amount = parseFloat(item.poAmount || 0);

    if (!totals[mgr]) {
      totals[mgr] = {
        VA_NPI: 0,
        Others: 0,
        salesManagerId: item.salesManagerId || item.salesresponsibilityid || "ZZZ9999",
      };
    }

    // Assuming salesresponsibilityid is consistent for a given salesManager
    // ✅ VA + NPI combined
    if (job.endsWith("_VA") || job.endsWith("_NPI")) {
      totals[mgr].VA_NPI += amount;

    } else {
      // ✅ Everything else → Design + Analysis + DFM + CAM + DFA + Lib
      totals[mgr].Others += amount;
    }
  });

  // Sort managers by salesManagerId (ascending)
  const sortedManagers = Object.keys(totals)
    .map(managerName => ({
      name: managerName,
      id: totals[managerName].salesManagerId
    }))
    .sort((a, b) => normalizeId(a.id).localeCompare(normalizeId(b.id), undefined, { numeric: true, sensitivity: "base" }));
  const labels = sortedManagers.map(manager => manager.name);
  const targetMap: Record<string, number> = {};
  targets.forEach((t: any) => {
    const id = normalizeId(t.salesrespid);
    if (!id) return;
    const targetLakhs = parseNumber(t.totaltargetvalue);
    targetMap[id] = targetLakhs * 100000;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Design ",
        data: labels.map((l) => totals[l].Others),
        backgroundColor: "#6dabe8", // Dark Blue
      },
      {
        label: "VA/DTP",
        data: labels.map((l) => totals[l].VA_NPI),
        backgroundColor: "#73de96", // Light Blue
      },
      {
        type: "line" as const,
        label: "Total Target",
        data: sortedManagers.map((m) => targetMap[normalizeId(m.id)] || 0),
        borderColor: "orange",
        backgroundColor: "orange",
        borderWidth: 2,
        pointRadius: 3,
        datalabels: {
          display: true,
          color: "red",
          anchor: "end" as const,
          align: "top" as const,
          offset: 6,
          clamp: true,
          clip: false,
          font: { size: 10, weight: "bold" as const },
          formatter: (value: number) =>
            value ? `${(value / 100000)}L` : "",
        },
      },
    ],
  };
  const yAxisMaxWithPadding = 25000000; // 240L
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    font: {
      family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    layout: {
      padding: {
        top: 30,
        right: 10,
        left: 6,
        bottom: 10,
      },
    },
    plugins: {
      datalabels: {
        display: (ctx: any) =>
          ctx.dataset.type !== "line" && ctx.dataset.data[ctx.dataIndex] > 0,
        color: "#000",
        font: { size: 10, weight: "bold" as const },
        anchor: "end" as const,
        align: "top" as const,
        offset: 10,
        clamp: true,
        clip: false,
        formatter: (value: number) =>
          value ? `${(value / 100000).toFixed(1)}L` : "",
      },
      legend: { position: "bottom" as const },
      title: {
        display: true,
        text: "Sales Manager vs Billing Amount",
          padding: 20,
        font: { size: 16, weight: "bold" as const },
        color: "rgb(0,102,204)",
      },
    },
    scales: {
      x: {
        stacked: true,   // ✅ KEY CHANGE
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
     y: {
  stacked: true,
  beginAtZero: true,
  min: 0,
  max: yAxisMaxWithPadding,
  ticks: {
    stepSize: 1000000, // ✅ 10L
   callback: (v: string | number) => `${Math.round(Number(v) / 100000)} L`,
  },
},
    },
  };

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        padding: "3px",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: "400px", width: "100%", flexShrink: 0 }}>
        <Chart type="bar" data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      </div>
      <SalesManagerTargetTable managers={sortedManagers} />
    </div>
  );
};
