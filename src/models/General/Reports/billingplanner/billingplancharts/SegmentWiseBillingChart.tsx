import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
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
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface BillingRow {
  jobNumber: string;
  projectManager?: string;
  reportingToPerson?: string;
  reportToPerson?: string;
  costCenter?: string;
  poAmount: number;
}

interface SegmentWiseBillingChartProps {
  data: BillingRow[];
}

const SegmentWiseBillingChart: React.FC<SegmentWiseBillingChartProps> = ({
  data,
}) => {
  // === Helpers ===
  const getStr = (r: BillingRow, ...keys: string[]): string => {
    for (const k of keys) {
      const val = (r as any)[k];
      if (val) return String(val).trim();
    }
    return "";
  };

  const getDec = (r: BillingRow, key: string): number => {
    const val = parseFloat((r as any)[key]);
    return isNaN(val) ? 0 : val;
  };

  const nameLike = (who: string, sub: string) =>
    who?.toLowerCase()?.includes(sub.toLowerCase());

  const mapPm = (r: BillingRow): string => {
    const who = getStr(r, "projectManager", "reportingToPerson", "reportToPerson");
    const cc = getStr(r, "costCenter", "costcenter");
    if (nameLike(who, "Sam")) return "Sam Mathew";
    if (nameLike(who, "Umer")) return "Umer Zahal C P";
    if (nameLike(who, "Dhanish")) return "M S Dhanish";
    if (nameLike(who, "Savita") && cc === "45240") return "Sam Mathew";
    if (nameLike(who, "Savita") && cc === "45223") return "M S Dhanish";
    if (cc === "45231") return "Umer Zahal C P";
    if (cc === "45240") return "Sam Mathew";
    return "M S Dhanish";
  };

  const addAmount = (dict: Record<string, number>, key: string, amount: number) => {
    dict[key] = (dict[key] || 0) + amount;
  };

  // === Segment Buckets ===
  const { dsDesign, dsAnalysis, dsVA, dsNPI } = useMemo(() => {
    const aggD: Record<string, number> = {};
    const aggA: Record<string, number> = {};
    const aggVA: Record<string, number> = {};
    const aggNPI: Record<string, number> = {};

    (data || []).forEach((r) => {
      const job = getStr(r, "jobNumber");
      const mgr = mapPm(r);
      const po = getDec(r, "poAmount");
      if (po <= 0) return;

      if (job.endsWith("_VA")) addAmount(aggVA, mgr, po);
      else if (job.endsWith("_NPI")) addAmount(aggNPI, mgr, po);
      else if (job.endsWith("_Analysis")) addAmount(aggA, mgr, po);
      else addAmount(aggD, mgr, po);
    });

    const toTable = (dict: Record<string, number>) =>
      Object.entries(dict).map(([key, val]) => ({
        ReportToPerson: key,
        BilledAmount: val,
      }));

    return {
      dsDesign: toTable(aggD),
      dsAnalysis: toTable(aggA),
      dsVA: toTable(aggVA),
      dsNPI: toTable(aggNPI),
    };
  }, [data]);

  // === Aggregate per Manager ===
  const cats = ["M S Dhanish", "Umer Zahal C P", "Sam Mathew"];

  const personColors: Record<string, string> = {
    "M S Dhanish": "#FFA500",
    "Umer Zahal C P": "#FFD700",
    "Sam Mathew": "#20B2AA",
  };

  // ✅ Define Targets (from VB.NET)
  const designTarget: Record<string, number> = {
    "M S Dhanish": 18200000,
    "Umer Zahal C P": 5200000,
    "Sam Mathew": 15500000,
  };

  const vaTarget: Record<string, number> = {
    "M S Dhanish": 3000000,
    "Umer Zahal C P": 2000000,
    "Sam Mathew": 10000000,
  };

  const { designValues, vaValues, npiValues } = useMemo(() => {
    const designTotals: Record<string, number> = {};
    const vaTotals: Record<string, number> = {};
    const npiTotals: Record<string, number> = {};

    const add = (dict: Record<string, number>, key: string, amount: number) => {
      dict[key] = (dict[key] || 0) + (isNaN(amount) ? 0 : amount);
    };

    dsDesign.forEach((r) => add(designTotals, r.ReportToPerson, r.BilledAmount));
    dsAnalysis.forEach((r) => add(designTotals, r.ReportToPerson, r.BilledAmount));
    dsVA.forEach((r) => add(vaTotals, r.ReportToPerson, r.BilledAmount));
    dsNPI.forEach((r) => add(npiTotals, r.ReportToPerson, r.BilledAmount));

    return {
      designValues: cats.map((n) => designTotals[n] || 0),
      vaValues: cats.map((n) => vaTotals[n] || 0),
      npiValues: cats.map((n) => npiTotals[n] || 0),
    };
  }, [dsDesign, dsAnalysis, dsVA, dsNPI]);

  // === Chart Data ===
  const chartData: ChartData<"bar" | "scatter"> = {
    labels: cats,
    datasets: [
      {
        label: "Design",
        type: "bar",
        data: designValues.map((v) => v / 100000),
        backgroundColor: cats.map((n) => personColors[n]),
        borderWidth: 1,
        categoryPercentage: 0.5,
        barPercentage: 0.9,
        datalabels: {
          anchor: "end" as const,
          align: "top" as const,
          offset: -5,
          color: "#000",
          font: { weight: "bold" as const, size: 11 },
          formatter: (val: number) => (val > 0 ? `${val.toFixed(1)} L` : ""),

        },
      },
      // Design Target (Cross markers)
      {
        label: "Design Target",
        type: "scatter",
        data: cats.map((n) => designTarget[n] / 100000),
        pointStyle: "crossRot",
        borderColor: "red",
        backgroundColor: "red",
        showLine: false,
        datalabels: {
          align: "right" as const,
          anchor: "end" as const,
          color: "red",
          font: { weight: "bold" as const, size: 11 },
          offset: 6,
          formatter: (val: number) => `${val} L`,
        },
      },

      // Actual VA Billing
      {
        label: "VA",
        type: "bar",
        data: vaValues.map((v) => v / 100000),
        backgroundColor: "#9ACD32",
        borderWidth: 1,
        categoryPercentage: 0.5,
        barPercentage: 0.9,
        datalabels: {
          anchor: "end" as const,
          align: "top" as const,
          offset: -5,
          color: "#000",
          font: { weight: "bold" as const, size: 11 },
          formatter: (val: number) => (val > 0 ? `${val.toFixed(1)} L` : ""),

        },
      },
      // VA Target (Cross markers)
      {
        label: "VA Target",
        type: "scatter",
        data: cats.map((n) => vaTarget[n] / 100000),
        pointStyle: "crossRot",
        borderColor: "red",
        backgroundColor: "red",
        showLine: false,
        datalabels: {
          align: "right" as const,
          anchor: "end" as const,
          color: "red",
          font: { weight: "bold" as const, size: 11 },
          offset: 6,
          formatter: (val: number) => `${val} L`,
        },
      },
      {
        label: "NPI",
        type: "bar",
        data: npiValues.map((v) => v / 100000),
        backgroundColor: "#6495ED",
        borderWidth: 1,
        categoryPercentage: 0.5,
        barPercentage: 0.9,
        datalabels: {
          anchor: "end" as const,
          align: "top" as const,
          offset: -5,
          color: "#000",
          font: { weight: "bold" as const, size: 11 },
          formatter: (val: number) => (val > 0 ? `${val.toFixed(1)} L` : ""),

        },
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Segment Wise Billing (in Lakhs)",
        color: "#0066CC",
        font: { size: 16, weight: "bold" as const },
      },
      legend: {
        display: true,
        position: "bottom",
        align: "center",
       labels: {font: { size: 10 }, boxWidth: 14, boxHeight: 14, padding: 8,},},
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
        suggestedMax: 250,
        ticks: {
          stepSize: 50,
          callback: (v) => `${v} L`,
        },
        title: { display: true, text: "Amount (Lakhs)" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 12,  weight: "bold" as const,} },
      },
    },
  };

  return (
       <div
  style={{
    height: "100%",
    width: "100%",
    padding: "3px",
    position: "relative",   // ⭐ fixes chart boundary drawing
    overflow: "hidden",     // ⭐ stops lines escaping border
  }}
>
      <Chart
        type="bar"
        data={chartData}
        options={chartOptions as ChartOptions<"bar" | "scatter">}
        plugins={[ChartDataLabels]}
      />
    </div>
  );
};

export default SegmentWiseBillingChart;