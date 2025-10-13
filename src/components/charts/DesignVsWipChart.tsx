import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

type Props = {
    totalDesignVA: number;
    totalWip: number;
    targetAbs: number;
};

const formatLakhs = (value: number) => `${(value / 100000).toFixed(1)}L`;

const DesignVsWipChart: React.FC<Props> = ({ totalDesignVA, totalWip, targetAbs }) => {
    const labels = ["Total Design+VA", "Total WIP"];
    const data = {
        labels,
        datasets: [
            {
                type: 'bar' as const,
                label: "Design Target",
                data: [totalDesignVA, totalWip],
                backgroundColor: ["gold", "silver"],
                datalabels: {
                    anchor: 'end' as const,
                    align: 'end' as const,
                    color: 'black',
                    formatter: (value: number) => {
                        const percent = targetAbs > 0 ? Math.round((value / targetAbs) * 100) + "%" : "";
                        return `${formatLakhs(value)}\n${percent}`;
                    },
                },
            },
            {
                type: 'line' as const,
                label: "Target",
                data: [targetAbs, targetAbs],
                borderColor: "brown",
                borderWidth: 2,
                pointStyle: 'cross',
                pointRadius: 10,
                fill: false,
                datalabels: {
                    display: true,
                    align: 'top',
                    formatter: () => `${(targetAbs / 10000000).toFixed(2)} Cr`,
                    color: 'brown',
                    font: {
                        weight: 'bold'
                    }
                },
            }
        ],
    };

    const options = {
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: "Design Target + VA Vs Achievement",
                color: 'rgb(0,102,204)',
                font: { size: 16, weight: 'bold' },
                padding: 30,
            },
            datalabels: { display: true },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 12 } } },
            y: {
                max: targetAbs,
                min: 0,
                ticks: { stepSize: 10000000, font: { size: 12 } },
                grid: { display: false },
            },
        },
    };

    return <Bar data={data} options={options} plugins={[ChartDataLabels]} />;
};

export default DesignVsWipChart;