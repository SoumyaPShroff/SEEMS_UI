import { useMemo } from "react";

type Filters = {
  year: number;
  month: number;
};

type YearMonthFilterProps = {
  filters: Filters;
  onChange: (val: Filters) => void;
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function YearMonthFilter({ filters, onChange }: YearMonthFilterProps) {
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, idx) => currentYear - 3 + idx);
  }, []);

  const selectClass =
    "w-full h-12 appearance-none rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-3 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-300";

  const labelClass =
    "text-[12px] font-semibold uppercase tracking-wider text-slate-500 mb-1";

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm border border-slate-200"
      style={{ display: "flex", flexWrap: "nowrap", alignItems: "flex-end", gap: "12px" }}
    >
      <div className="flex flex-col flex-1 min-w-0" style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <span className={labelClass}>Month</span>
        <select
          className={selectClass}
          value={filters.month}
          onChange={(e) =>
            onChange({ ...filters, month: Number(e.target.value) })
          }
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col w-[120px] shrink-0" style={{ display: "flex", flexDirection: "column", width: "120px", flexShrink: 0 }}>
        <span className={labelClass}>Year</span>
        <select
          className={selectClass}
          value={filters.year}
          onChange={(e) =>
            onChange({ ...filters, year: Number(e.target.value) })
          }
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
