import React from "react";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import SalesManagerTargetTable from "./SalesManagerTargetTable";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface ChartProps {
  data: any[];
}

export const SalesManagerChart: React.FC<ChartProps> = ({ data }) => {
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
        salesresponsibilityid: item.salesresponsibilityid || 999999, // Default to a high number for 'Unknown' or missing IDs
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

  // Sort managers by salesresponsibilityid
  const sortedManagers = Object.keys(totals)
    .map(managerName => ({
      name: managerName,
      id: totals[managerName].salesresponsibilityid
    }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const labels = sortedManagers.map(manager => manager.name);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Design ",
        data: labels.map((l) => totals[l].Others),
        backgroundColor: "#6dabe8", // Dark Blue
      },
      {
        label: "VA/NPI/DTP",
        data: labels.map((l) => totals[l].VA_NPI),
        backgroundColor: "#73de96", // Light Blue
      },
    ],
  };
  const maxTotal = Math.max(
    ...labels.map(l => totals[l].Others + totals[l].VA_NPI)
  );

  // Round to nearest nice number (like 10L, 20L, 50L)
  //const yAxisMax = Math.ceil(maxTotal / 1000000) * 1000000; // 👈 rounds to nearest 10L
  //const yAxisMaxWithPadding = yAxisMax * 1.1; // +10% space
   let yAxisMax;

if (maxTotal < 200000) { // < 2L
  yAxisMax = Math.ceil(maxTotal / 50000) * 50000; // 0.5L steps
} else if (maxTotal < 1000000) { // < 10L
  yAxisMax = Math.ceil(maxTotal / 200000) * 200000; // 2L steps
} else {
  yAxisMax = Math.ceil(maxTotal / 1000000) * 1000000;
}

const yAxisMaxWithPadding = yAxisMax * 1.1;
  const chartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        display: (ctx: any) => ctx.dataset.data[ctx.dataIndex] > 0,
        color: "#000",
        font: { size: 10 },
        formatter: (value: number) =>
          value ? `${(value / 100000).toFixed(1)}L` : "",
      },
      legend: { position: "bottom" },
      title: {
        display: true,
        text: "Sales Manager vs Billing Amount",
          padding:"20px",
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
        stacked: true,   // ✅ KEY CHANGE
        beginAtZero: true,
        max: yAxisMaxWithPadding,
        // ticks: {
        //   stepSize: yAxisMax / 5, // 👈 clean intervals
        //   callback: (v: number) => `${v / 100000} L`,
        // },
        ticks: {
  stepSize: yAxisMax / (maxTotal < 200000 ? 4 : 5),
  callback: (v: number) => `${(v / 100000)} L`,
},
      },
    },
  };

  return (
    <div style={{ height: "100%", width: "100%", padding: "3px", position: "relative", overflow: "hidden", }}>
      <Chart type="bar" data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
      <SalesManagerTargetTable managers={sortedManagers} />
    </div>
  );
};
