import React from "react";
import { Bar } from "react-chartjs-2";
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
import { RiFontFamily } from "react-icons/ri";

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
        anchor: "end",
        align: "top",   
        formatter: (value: number) => `${(value / 100000).toFixed(1)} L`,
      },
      legend: { display: false },
      title: {
        display: true,
        text: "Project Manager vs Billing Amount",
        font: { size: 14, weight: "Bold", color: "#305CDE", fontFamily: "'Segoe UI', Roboto, sans-serif" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v: number) => `${v / 100000} L` },
      },
    },
  };

  return <Bar data={chartData} options={chartOptions} />;
};
