import React from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

interface ChartProps {
  data: any[];
}

export const ProjectManagerChart: React.FC<ChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p>No project manager data available.</p>;
  }

  const totals: Record<string, number> = {};
  data.forEach((item) => {
    const mgr = item.projectManager || "Unknown";
    const amount = parseFloat(item.poAmount || 0);
    totals[mgr] = (totals[mgr] || 0) + amount;
  });

  const chartData = {
    labels: Object.keys(totals),
    datasets: [
      {
        label: "PO Amount (₹)",
        data: Object.values(totals),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      datalabels: {
        color: "#000",
        anchor: "end" as const,
        align: "top" as const,
        formatter: (value: string | number) => `${(Number(value) / 100000).toFixed(1)} L`,
      },
      legend: { display: false },
      title: {
        display: true,
        text: "Project Manager vs Billing Amount",
        padding: 20,
        font: { size: 16, weight: "bold" as const },
        color: "rgb(0,102,204)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v: string | number) => `${Number(v) / 100000} L` },
      },
    },
  };
  return (
    // <div style={{ height: "100%", width: "100%", padding: "3px" }}>
      <div  style={{  height: "100%", width: "100%", padding: "3px", position: "relative", overflow: "hidden",}}>
      <Chart type="bar" data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
    </div>
  );
};
