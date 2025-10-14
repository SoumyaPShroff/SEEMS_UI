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
import { Bar } from "react-chartjs-2";

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

const SegmentWiseBillingChart: React.FC<SegmentWiseBillingChartProps> = ({ data }) => {
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
  const nameLike = (who: string, sub: string) => who?.toLowerCase()?.includes(sub.toLowerCase());

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
  const formatLakhs = (val: number) => (val / 100000).toFixed(1);

  const personColors: Record<string, string> = {
    "M S Dhanish": "#FFA500",
    "Umer Zahal C P": "#FFD700",
    "Sam Mathew": "#20B2AA",
  };

  const { designValues, vaValues, npiValues } = useMemo(() => {
    const designTotals: Record<string, number> = {};
    const vaTotals: Record<string, number> = {};
    const npiTotals: Record<string, number> = {};

    const add = (dict: any, key: string, amount: number) => {
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
  const chartData = {
  labels: cats,
  datasets: [
    {
      label: "Design",
      type: "bar" as const,
      data: designValues.map((v) => v / 100000),
      backgroundColor: cats.map((n) => personColors[n]),
      borderWidth: 1,
      categoryPercentage: 0.5, // narrower cluster group width
      barPercentage: 0.9,      // fatter bars inside group
      datalabels: {
        anchor: "end",
        align: "start",
        offset: -5,
        color: "#000",
        font: { weight: "bold", size: 11 },
        formatter: (val: number) => `${val.toFixed(1)} L`,
      },
    },
    {
      label: "VA",
      type: "bar" as const,
      data: vaValues.map((v) => v / 100000),
      backgroundColor: "#9ACD32",
      borderWidth: 1,
      categoryPercentage: 0.5,
      barPercentage: 0.9,
      datalabels: {
        anchor: "end",
        align: "start",
        offset: -5,
        color: "#000",
        font: { weight: "bold", size: 11 },
        formatter: (val: number) => `${val.toFixed(1)} L`,
      },
    },
    {
      label: "NPI",
      type: "bar" as const,
      data: npiValues.map((v) => v / 100000),
      backgroundColor: "#6495ED",
      borderWidth: 1,
      categoryPercentage: 0.5,
      barPercentage: 0.9,
      datalabels: {
        anchor: "end",
        align: "start",
        offset: -5,
        color: "#000",
        font: { weight: "bold", size: 11 },
        formatter: (val: number) => `${val.toFixed(1)} L`,
      },
    },
  ],
};


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Segment Wise Billing (in Lakhs)",
        color: "#0066CC",
        font: { size: 16, weight: "bold" },
      },
      legend: { display: true, position: "bottom" as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)} L`,
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
          callback: (v: any) => `${v} L`,
        },
        title: { display: true, text: "Amount (Lakhs)" },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%", padding: "10px" }}>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

export default SegmentWiseBillingChart;
