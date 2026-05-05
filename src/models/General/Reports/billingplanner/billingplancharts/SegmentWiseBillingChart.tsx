import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface BillingRow {
  jobNumber?: string;
  jobnumber?: string;
  poAmount?: number | string;
  poamount?: number | string;
}

interface SegmentWiseBillingChartProps {
  data: BillingRow[];
}

const SegmentWiseBillingChart: React.FC<SegmentWiseBillingChartProps> = ({ data }) => {
  const labels = ["Design", "VA", "Analysis"];

  const parseAmount = (value: unknown): number => {
    const amount = Number(String(value ?? "0").replace(/,/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  };

  const actualLakhs = useMemo(() => {
    const totals = {
      Design: 0,
      VA: 0,
      Analysis: 0,
    };

    (data || []).forEach((row) => {
      const rawJob = String(row.jobNumber ?? row.jobnumber ?? "").trim().toUpperCase();
      const po = parseAmount(row.poAmount ?? row.poamount ?? 0);
      if (po <= 0) return;

      if (rawJob.endsWith("_VA") || rawJob.endsWith("_NPI")) {
        totals.VA += po;
      } else if (rawJob.endsWith("_ANALYSIS")) {
        totals.Analysis += po;
      } else {
        // Everything else goes under Design.
        totals.Design += po;
      }
    });

    return labels.map((k) => Math.round((totals[k as keyof typeof totals] / 100000) * 10) / 10);
  }, [data]);

  // Default targets in Lakhs (can be tuned later).
  const targetLakhsMap: Record<string, number> = {
    Design: 190,
    VA: 250,
    Analysis: 60,
  };
  const targetLakhs = labels.map((l) => targetLakhsMap[l] ?? 0);

  const maxValue = Math.max(...actualLakhs, ...targetLakhs, 0);

  const chartData: ChartData<"bar" | "line"> = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Achieved",
        data: actualLakhs,
        backgroundColor: "#5499de",
        borderWidth: 1,
        categoryPercentage: 0.55,
        barPercentage: 0.8,
        datalabels: {
          anchor: "end" as const,
          align: "top" as const,
          offset: -3,
          color: "#000",
          font: { weight: "bold" as const, size: 11 },
          formatter: (val: number) => (val > 0 ? `${val.toFixed(1)} L` : ""),
        },
        order: 2,
      },
      {
        type: "line",
        label: "Target",
        data: targetLakhs,
        borderColor: "orange",
        backgroundColor: "orange",
        borderWidth: 2,
        tension: 0.15,
        pointRadius: 3,
        pointHoverRadius: 4,
        datalabels: {
          align: "top" as const,
          anchor: "end" as const,
          color: "red",
          font: { weight: "bold" as const, size: 10 },
          formatter: (val: number) => `${val} L`,
        },
        order: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    font: {
      family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    layout: {
      padding: {
        top: 30,
        bottom: 10,
      },
    },
    plugins: {
      title: {
        display: true,
        text: "Segment Wise Billing (in Lakhs)",
        color: "#0066CC",
        font: { size: 16, weight: "bold" as const },
        padding: 20,
      },
      legend: {
        display: true,
        position: "bottom",
        align: "center",
        labels: { font: { size: 10 }, boxWidth: 14, boxHeight: 14, padding: 8 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} L`,
        },
      },
      datalabels: { display: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: maxValue * 1.2 || 100,
        ticks: {
          stepSize: 50,
          callback: (v) => `${v} L`,
        },
        title: { display: true, text: "Amount (Lakhs)" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12, weight: "bold" as const } },
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
      }}
    >
      <Chart type="bar" data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
    </div>
  );
};

export default SegmentWiseBillingChart;
