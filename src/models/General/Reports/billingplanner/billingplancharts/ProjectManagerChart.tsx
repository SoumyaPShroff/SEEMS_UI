import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../../../const/BaseUrl";
import { Chart } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale,  LinearScale,BarElement, PointElement, LineElement, LineController, Title, 
   Tooltip,  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register( CategoryScale, LinearScale,  BarElement,  PointElement,  LineElement,  LineController,  Title,  Tooltip,  Legend,  ChartDataLabels);

interface ChartProps {
  data: any[];
}

interface ProjectManagerTargetRow {
  managerid?: string | number | null;
  targetvalue?: string | number | null;
}

interface ProjectManagerBillingRow {
  projectmanagerid?: string | number | null;
  projectManager?: string | null;
  reportingToPerson?: string | null;
  reportToPerson?: string | null;
  poAmount?: string | number | null;
  managerId?: string | number | null;
  managerid?: string | number | null;
}

interface ProjectManagerAggregate {
  id: string;
  name: string;
  total: number;
}

const normalizeId = (value: unknown) => String(value ?? "").trim().toUpperCase();

const parseAmount = (value: unknown) => {
  const raw = String(value ?? "0").replace(/,/g, "");
  const amount = Number.parseFloat(raw);
  return Number.isNaN(amount) ? 0 : amount;
};

export const ProjectManagerChart: React.FC<ChartProps> = ({ data }) => {
  const [targets, setTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const res = await axios.get<ProjectManagerTargetRow[]>(
          `${baseUrl}/api/Sales/ProjectManagersTargets`
        );

        const map: Record<string, number> = {};
        (res.data || []).forEach((item) => {
          const key = normalizeId(item.managerid);
          if (!key) return;
          map[key] = parseAmount(item.targetvalue);
        });

        if (!res.data?.length) {
  console.warn("No target data received");
}
        setTargets(map);
      } catch (err) {
        console.error("Error fetching project manager targets", err);
      }
    };

    fetchTargets();
  }, []);

  const managerRows = useMemo<ProjectManagerAggregate[]>(() => {
    const totals: Record<string, ProjectManagerAggregate> = {};

    (data as ProjectManagerBillingRow[]).forEach((item) => {
      const id = normalizeId(item.projectmanagerid);
      if (!id) return;

      const fallbackName = item.projectManager;
      const name = String(fallbackName || id).trim() || id;
      const amount = parseAmount(item.poAmount);

      if (!totals[id]) {
        totals[id] = { id, name, total: 0 };
      }

      totals[id].total += amount;

      if (totals[id].name === totals[id].id && name !== id) {
        totals[id].name = name;
      }
    });

    return Object.values(totals).sort((a, b) => {
      const numericA = Number(a.id);
      const numericB = Number(b.id);
      const bothNumeric = Number.isFinite(numericA) && Number.isFinite(numericB);

      if (bothNumeric && numericA !== numericB) {
        return numericA - numericB;
      }

      const idCompare = a.id.localeCompare(b.id, undefined, { numeric: true });
      return idCompare !== 0 ? idCompare : a.name.localeCompare(b.name);
    });
  }, [data]);

  if (!managerRows.length) {
    return <p>No project manager data available.</p>;
  }

  const labels = managerRows.map(
    // (row) => `${row.name} (${row.id})
  (row) => `${row.name}`
);

  const rawActualData = managerRows.map((row) => Math.max(0, row.total));
  const shouldConvertActualToLakhs = Math.max(...rawActualData, 0) > 10000;
  const actualData = rawActualData.map((value) =>
    shouldConvertActualToLakhs ? value / 100000 : value
  );
  const targetData = managerRows.map((row) => {
    const val = targets[row.id];
    if (val == null) return null;
    // Target values from API are already in Lakhs (e.g., 30, 24).
    // If the chart is scaling Actuals to Lakhs, we use target values as is.
    return shouldConvertActualToLakhs ? val : val * 100000;
  });

  const allValues = [
    ...actualData,
    ...targetData.filter((value): value is number => value !== null),
  ];
  const maxValue = Math.max(...allValues, 0);

  const chartData = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Achieved",
        data: actualData,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
        borderWidth: 0,
        barThickness: 18,
        maxBarThickness: 28,
        datalabels: {
          display: true,
          anchor: "end" as const,
          align: "top" as const,
          offset: 12,
          clamp: true,
          clip: false,
          color: "#1b1b1b",
          formatter: (val: number) => `${Number(val).toFixed(1)} L`,
          font: { size: 10, weight: "bold" as const },
        },
        order: 2,
      },
      {
        type: "line" as const,
        label: "Target",
        data: targetData,
        borderColor: "orange",
         backgroundColor: "orange",
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 30,
        bottom: 10,
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
      },
      datalabels: {
        display: true,
        anchor: "end" as const,
        align: "top" as const,
        offset: 12,
        clamp: true,
        clip: false,
        color: "red",
        formatter: (val: number) => `${Number(val)} L`,
        font: { size: 10, weight: "bold" as const },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.raw || 0;
            return `${context.dataset.label}: ${Number(value)} L`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: maxValue * 1.2 || 100,
        ticks: {
          callback: function (value: any) {
            return `${Number(value)} L`;
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        height: "400px",
        width: "100%",
        padding: "3px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Chart
        type="bar"
        data={chartData}
        options={chartOptions}
        plugins={[ChartDataLabels]}
      />
    </div>
  );
};
