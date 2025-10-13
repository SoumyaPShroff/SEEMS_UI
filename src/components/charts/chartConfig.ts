export const barColors: Record<string, string> = {
  "At Office Export": "rgba(135,206,250,0.8)",
  "At Office Domestic": "rgba(238,130,238,0.8)",
  "Onsite Domestic": "rgba(255,165,0,0.8)",
  "Analysis": "rgba(255,215,0,0.8)",
  "VA": "rgba(154,205,50,0.8)",
  "NPI": "rgba(32,178,170,0.8)",
};

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: true,
      text: "Overall Target Vs Projection",
      font: { size: 16, weight: "bold" },
      color: "rgb(0,102,204)",
    },
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      min: 0,
      max: 24000000,
      ticks: {
        stepSize: 6000000,
        callback: (value: number) => `${(value / 100000).toFixed(2)} L`,
      },
      grid: { display: false },
    },
  },
};