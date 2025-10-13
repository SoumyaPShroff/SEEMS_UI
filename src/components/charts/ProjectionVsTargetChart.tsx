import { Bar } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { formatLakhs, bucketFor, normCat } from "../utils/billingUtils";
import { chartOptions, barColors } from "./chartConfig";
import {Chart as ChartJS,CategoryScale,LinearScale,BarElement,PointElement,LineElement,Title,Tooltip,Legend,} from "chart.js";
// ✅ Register everything your charts will use
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export const ProjectionVsTargetChart = ({ data }: { data: any[] }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!data?.length) return;

    const poSum: Record<string, number> = {};
    data.forEach((r) => {
      const bucket = bucketFor(r.jobNumber, r.enqType, r.type);
      if (!bucket) return;
      poSum[normCat(bucket)] = (poSum[normCat(bucket)] || 0) + parseFloat(r.poAmount || "0");
    });

    const targetLakhs = {
      "At Office Export": 60,
      "At Office Domestic": 60,
      "Onsite Domestic": 62,
      "Analysis": 52,
      "VA": 150,
      "NPI": 155,
    };

    const targets = Object.fromEntries(
      Object.entries(targetLakhs).map(([k, v]) => [normCat(k), v * 100000])
    );

    const categories = Object.keys(targetLakhs);
    const projectionValues = categories.map((c) => poSum[normCat(c)] || 0);
    const targetValues = categories.map((c) => targets[normCat(c)] || 0);

    setChartData({
      labels: categories,
      datasets: [
        {
          label: "Projection",
          data: projectionValues,
          backgroundColor: categories.map((c) => barColors[c]),
        },
        {
          label: "Target",
          data: targetValues,
          type: "scatter",
          pointStyle: "cross",
          pointRadius: 6,
          borderColor: "brown",
          backgroundColor: "brown",
        },
      ],
    });
  }, [data]);

  if (!chartData) return <p>Loading chart...</p>;
  return <Bar data={chartData} options={chartOptions} />;
};