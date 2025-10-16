import { Chart } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, } from "chart.js";
import { bucketFor, normCat } from "../utils/billingutils";
import ChartDataLabels from "chartjs-plugin-datalabels";
import type { ChartOptions } from 'chart.js';
// ✅ Register required components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export const ProjectionVsTargetChart = ({ data }: { data: any[] }) => {
  const [chartData, setChartData] = useState<any>(null);

  // ✅ Define bar colors
  const barColors: Record<string, string> = {
    "At Office Export": "rgba(135, 206, 250, 0.8)",   // LightSkyBlue
    "At Office Domestic": "rgba(238, 130, 238, 0.8)", // Violet
    "Onsite Domestic": "rgba(255, 165, 0, 0.8)",      // Orange
    Analysis: "rgba(255, 215, 0, 0.8)",               // Gold
    VA: "rgba(154, 205, 50, 0.8)",                    // YellowGreen
    NPI: "rgba(32, 178, 170, 0.8)",                   // LightSeaGreen
  };

  useEffect(() => {
    if (!data?.length) {
      setChartData(null);
      return;
    }

    // ✅ Sum PO Amount by category (in rupees)
    const poSum: Record<string, number> = {};
    data.forEach((r) => {
      const bucket = bucketFor(r.jobNumber, r.enqType, r.type);
      if (!bucket) return;
      const key = normCat(bucket);
      poSum[key] = (poSum[key] || 0) + parseFloat(r.poAmount || "0");
    });

    // ✅ Target values in LAKHS
    const targetLakhs: Record<string, number> = {
      "At Office Export": 60,
      "At Office Domestic": 60,
      "Onsite Domestic": 62,
      Analysis: 52,
      VA: 150,
      NPI: 155,
    };

    const categories = Object.keys(targetLakhs);

    // ✅ Convert PO sum to lakhs (rupees ÷ 100000)
    const projectionValues = categories.map(
      (c) => Math.round((poSum[normCat(c)] || 0) / 100000)
    );
    const targetValues = categories.map((c) => targetLakhs[c]);

    // ✅ Set Chart Data
    setChartData({
      labels: categories,
      datasets: [
        {
          data: projectionValues,
          backgroundColor: categories.map((c) => barColors[c] || "#1976d2"),
          datalabels: {
            anchor: "end" as const,
            align: "top" as const,
            offset: -5,
            color: "#000",
            font: { size: 12 },
            formatter: (val: number, ctx: any) => {
              const target = targetValues[ctx.dataIndex];
              if (!target) return `${val} L`;
              const pct = ((val / target) * 100).toFixed(0);
              return `${val} L\n(${pct}%)`;
            },
          },
          padding: 30,
        },
        {
          data: targetValues,
          type: "scatter",
          pointStyle: "crossRot",
          pointFont: { weight: "bold" as const },
          borderColor: "Red",
          backgroundColor: "Red",
          showLine: false,
          datalabels: {
            align: "right" as const,
            anchor: "end" as const,
            color: "brown",
            font: { weight: "bold" as const, size: 12 },
            offset: 6, // space between label & cross
            formatter: (val: number) => `${val} L`,
          },
          padding: 30,
        },
      ],
    });
  }, [data]);

  // ✅ Chart options (outside useEffect)
  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Overall Target vs Projection (in Lakhs)",
        font: { size: 16, weight: "bold" as const },
        color: "rgb(0,102,204)",
      },
      legend: { display: false },
      datalabels: { display: true },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} L`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 12 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val: string | number) => `${val} L`,
          stepSize: 20,
          font: { size: 10 },
        },
        title: { display: true, text: "Amount (Lakhs)" },
        grid: { display: true },
      },
    },
  };

  if (!chartData)
    return <p style={{ textAlign: "center", color: "#666" }}>No data to display</p>;

  return (
    <div style={{ height: "350px", width: "100%" }}>
      <Chart type="bar" data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />;
    </div>
  );
};
