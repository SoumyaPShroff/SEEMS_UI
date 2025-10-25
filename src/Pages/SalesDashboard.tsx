import React, { useEffect, useState } from "react";
import { getCurrentMonthDates } from "../components/utils/DateUtils";
import { baseUrl } from "../const/BaseUrl";
import { Button } from "@mui/material";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/SalesDashboard.css";
import { LoadingButton } from "@mui/lab";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28"];

const SalesDashboard: React.FC = () => {
  const { startdate: initialStart, enddate: initialEnd } = getCurrentMonthDates();

  const [startdate, setStartdate] = useState(initialStart);
  const [enddate, setEnddate] = useState(initialEnd);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tentativeOrders, setTentativeOrders] = useState<any[]>([]);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([]);
  const [quotedOrders, setQuotedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showData, setShowData] = useState(false);

  // === Fetch chart data ===
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setShowData(false); // hide data while loading
    try {
      const [chartRes, orderRes] = await Promise.all([
        fetch(
          `${baseUrl}/api/Sales/GetThreeMonthConfirmedOrders?startdate=${startdate}&enddate=${enddate}`
        ),
        fetch(`${baseUrl}/api/Sales/TentativeQuotedOpenConfirmedOrders`),
      ]);

      if (!chartRes.ok || !orderRes.ok)
        throw new Error("Failed to load dashboard data.");

      const chartDataJson = await chartRes.json();
      const orderDataJson = await orderRes.json();

      setChartData(chartDataJson || []);
      setTentativeOrders(orderDataJson?.tentativeOrders || []);
      setOpenOrders(orderDataJson?.openOrders || []);
      setQuotedOrders(orderDataJson?.quotedOrders || []);
      setConfirmedOrders(orderDataJson?.confirmedOrders || []);

      setShowData(true); // ✅ show data after successful load
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      setError("Error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // === Derived data ===
  const aggregatedByCategory = chartData.reduce((acc: any[], cur: any) => {
    const existing = acc.find((a) => a.designcategory === cur.designcategory);
    if (existing) existing.totalValue += cur.totalValue;
    else acc.push({ designcategory: cur.designcategory, totalValue: cur.totalValue });
    return acc;
  }, []);

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = chartData.map((d) => ({
    month: monthNames[d.monthNo],
    category: d.designcategory,
    totalValue: d.totalValue,
  }));

  // === Utility: format currency ===
  const formatCurrency = (val: number) => (val ? `₹${val.toLocaleString()}` : "₹0");

  return (
    <div className="dashboard-container">
      {/* === Filters === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-section filter-section"
      >
        <div className="filters-container">
          <label>
            Start Date
            <input
              type="date"
              value={startdate}
              onChange={(e) => setStartdate(e.target.value)}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={enddate}
              onChange={(e) => setEnddate(e.target.value)}
            />
          </label>
          {/* 
          <Button variant="contained" color="primary" onClick={handleGenerate}>
            Generate
          </Button> */}
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            loading={loading}           // ✅ shows spinner when loading
            loadingPosition="start"     // spinner position
          >
            {loading ? "Generating..." : "Generate"}
          </LoadingButton>
        </div>
      </motion.div>

      {/* === Error === */}
      {error && <p className="error-message">{error}</p>}

      {/* === Charts Section === */}
      {loading ? (
        <p className="loading-message">Loading dashboard data...</p>
      ) : !loading && showData && chartData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="dashboard-section charts-grid"
        >
          {/* --- Pie Chart (By Category) --- */}
          <div className="chart-card">
            <h3 className="chart-title">Category Contribution (Last 3 months Confirmed Orders)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={aggregatedByCategory}
                  dataKey="totalValue"
                  nameKey="designcategory"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {aggregatedByCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      ) : (
        <p className="empty-message">No chart data to display.</p>
      )}

      {/* === Order Summary (Three-Month Table + Category Totals) === */}
      {/* === Three-Month Confirmed Orders Table === */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="dashboard-section"
      >
        {/* <h3 className="chart-title">Confirmed Orders (Last 3 Months)</h3> */}
        <p className="note-text">Note: All the values are in Lakhs</p>

        <div className="summary-grid">
          <table className="summary-table enhanced three-month">
            <thead>
              <tr>
                <th>Confirmed Orders (Last Three months)</th>
                {Array.from(
                  new Set(chartData.map((d) => monthNames[d.monthNo]))
                ).map((month, i) => (
                  <th key={i}>{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {["Export Layout", "Domestic Layout", "Onsite", "Analysis"].map((cat) => {
                const row = chartData.filter((d) => d.designcategory === cat);
                const monthTotals = Array.from(
                  new Set(chartData.map((d) => d.monthNo))
                ).map((m) => {
                  const found = row.find((r) => r.monthNo === m);
                  return found ? found.totalValue : 0;
                });
                return (
                  <tr key={cat}>
                    <td>{cat}</td>
                    {monthTotals.map((val, j) => (
                      <td key={j} className="num">{formatCurrency(val)}</td>
                    ))}
                  </tr>
                );
              })}

              {/* --- Design Total --- */}
              <tr className="subtotal-row">
                <td>Design Total</td>
                {Array.from(new Set(chartData.map((d) => d.monthNo))).map((m, j) => {
                  const total = chartData
                    .filter((d) =>
                      ["Export Layout", "Domestic Layout", "Onsite", "Analysis"].includes(
                        d.designcategory
                      ) && d.monthNo === m
                    )
                    .reduce((a, b) => a + b.totalValue, 0);
                  return (
                    <td key={j} className="num total">
                      {formatCurrency(total)}
                    </td>
                  );
                })}
              </tr>

              {/* --- VA & NPI --- */}
              {["VA", "NPI"].map((cat) => {
                const row = chartData.filter((d) => d.designcategory === cat);
                const monthTotals = Array.from(
                  new Set(chartData.map((d) => d.monthNo))
                ).map((m) => {
                  const found = row.find((r) => r.monthNo === m);
                  return found ? found.totalValue : 0;
                });
                return (
                  <tr key={cat}>
                    <td>{cat}</td>
                    {monthTotals.map((val, j) => (
                      <td key={j} className="num">{formatCurrency(val)}</td>
                    ))}
                  </tr>
                );
              })}

              {/* --- VA Total --- */}
              <tr className="subtotal-row">
                <td>VA Total</td>
                {Array.from(new Set(chartData.map((d) => d.monthNo))).map((m, j) => {
                  const total = chartData
                    .filter(
                      (d) =>
                        ["VA", "NPI"].includes(d.designcategory) && d.monthNo === m
                    )
                    .reduce((a, b) => a + b.totalValue, 0);
                  return (
                    <td key={j} className="num total">
                      {formatCurrency(total)}
                    </td>
                  );
                })}
              </tr>

              {/* --- Grand Total --- */}
              <tr className="subtotal-row">
                <td>Grand Total</td>
                {Array.from(new Set(chartData.map((d) => d.monthNo))).map((m, j) => {
                  const total = chartData
                    .filter((d) => d.monthNo === m)
                    .reduce((a, b) => a + b.totalValue, 0);
                  return (
                    <td key={j} className="num total">
                      {formatCurrency(total)}
                    </td>
                  );
                })}
              </tr>
            </tbody>

            {/* --- 3-Month Total --- */}
            <tfoot>
              <tr className="grand-total-row">
                <td>Total Orders (3 months)</td>
                <td colSpan={3} className="num highlight">
                  {formatCurrency(chartData.reduce((a, b) => a + b.totalValue, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* === Category Summary (Tentative / Quoted / Confirmed) with Expand/Collapse === */}
        <div className="summary-grid">
          <h3 className="chart-title">Category-wise Orders</h3>

          <table className="summary-table enhanced">
            <thead>
              <tr>
                <th>Category</th>
                <th>Open Orders</th>
                <th>Quoted Orders</th>
                <th>Tentative Orders</th>
                <th>Confirmed Orders</th>
              </tr>
            </thead>
            <tbody>
  {[
    "Domestic Layout",
    "Export Layout",
    "Onsite",
    "Analysis",
    "VA",
    "NPI",
  ].map((catKey, i) => {
    const [expanded, setExpanded] = useState(false);

    // Split into type and category parts
    const [typeFilter, designCatFilter] = catKey.split(" ");

    // === OPEN ORDERS ===
    const openSubs = openOrders.filter((x) => {
      const matchType = !typeFilter || x.type?.toLowerCase() === typeFilter.toLowerCase();
      if (designCatFilter?.toLowerCase() === "layout") return matchType && x.playout > 0;
      if (designCatFilter?.toLowerCase() === "analysis") return matchType && x.panalysis > 0;
      if (designCatFilter?.toLowerCase() === "va") return matchType && x.pVA > 0;
      if (designCatFilter?.toLowerCase() === "npi") return matchType && x.pNPI > 0;
      if (catKey.toLowerCase() === "onsite") return x.onsite > 0;
      return false;
    });

    // === QUOTED ORDERS ===
    const quotedSubs = quotedOrders.filter((x) => {
      const matchType = !typeFilter || x.type?.toLowerCase() === typeFilter.toLowerCase();
      const matchDesign = !designCatFilter || x.designcategory?.toLowerCase().includes(designCatFilter.toLowerCase());
      return matchType && matchDesign;
    });

    // === TENTATIVE ORDERS ===
    const tentativeSubs = tentativeOrders.filter((x) => {
      const matchType = !typeFilter || x.type?.toLowerCase() === typeFilter.toLowerCase();
      const layoutText = x.layout?.toLowerCase() || "";
      if (designCatFilter?.toLowerCase() === "layout") return matchType && layoutText.includes("layout");
      if (designCatFilter?.toLowerCase() === "analysis") return matchType && layoutText.includes("analysis");
      if (designCatFilter?.toLowerCase() === "va") return matchType && layoutText.includes("va");
      if (designCatFilter?.toLowerCase() === "npi") return matchType && layoutText.includes("npi");
      if (catKey.toLowerCase() === "onsite") return matchType && layoutText.includes("onsite");
      return false;
    });

        // === Confirmed ORDERS ===
    const confirmedSubs = confirmedOrders.filter((x) => {
      const matchType = !typeFilter || x.type?.toLowerCase() === typeFilter.toLowerCase();
      const layoutText = x.layout?.toLowerCase() || "";
      if (designCatFilter?.toLowerCase() === "layout") return matchType && layoutText.includes("layout");
      if (designCatFilter?.toLowerCase() === "analysis") return matchType && layoutText.includes("analysis");
      if (designCatFilter?.toLowerCase() === "va") return matchType && layoutText.includes("va");
      if (designCatFilter?.toLowerCase() === "npi") return matchType && layoutText.includes("npi");
      if (catKey.toLowerCase() === "onsite") return matchType && layoutText.includes("onsite");
      return false;
    });

    // === Aggregate totals ===
    const openTotal = openSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);
    const quotedTotal = quotedSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);
    const tentativeTotal = tentativeSubs.reduce((a, b) => a + (b.QuotedValue || 0), 0);
    const confirmedTotal = confirmedSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);
    

    return (
      <React.Fragment key={i}>
        <tr
          className="expandable-row"
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: "pointer" }}
        >
          <td>
            <span className="expand-icon">{expanded ? "▼" : "▶"}</span> {catKey}
          </td>
          <td className="num">{formatCurrency(openTotal)}</td>
          <td className="num">{formatCurrency(quotedTotal)}</td>
          <td className="num">{formatCurrency(tentativeTotal)}</td>
           <td className="num">{formatCurrency(confirmedTotal)}</td>
        </tr>

        {expanded && (
          <>
            {["Open", "Quoted", "Tentative","Confirmed"].map((type) => {
              const subs =
                type === "Open"
                  ? openSubs
                  : type === "Quoted"
                    ? quotedSubs
                    : tentativeSubs;

              return subs.map((s, idx) => (
                <tr key={`${catKey}-${type}-${idx}`} className="sub-row">
                  <td className="sub-cat">
                    {s.subcategory ||
                      s.layout ||
                      s.designcategory ||
                      s.enquirytype ||
                      "—"}
                  </td>
                  <td className="num">
                    {type === "Open" ? formatCurrency(s.TotalValue) : ""}
                  </td>
                  <td className="num">
                    {type === "Quoted" ? formatCurrency(s.QuotedValue) : ""}
                  </td>
                  <td className="num">
                    {type === "Tentative" ? formatCurrency(s.QuotedValue) : ""}
                  </td>
                   <td className="num">
                    {type === "Confirmed" ? formatCurrency(s.TotalValue) : ""}
                  </td>
                </tr>
              ));
            })}
          </>
        )}
      </React.Fragment>
    );
  })}
</tbody>


      <tfoot>
  <tr className="total-row">
    <td>Total Orders</td>
    <td className="num">
      {formatCurrency(openOrders.reduce((a, b) => a + (b.TotalValue || 0), 0))}
    </td>
    <td className="num">
      {formatCurrency(quotedOrders.reduce((a, b) => a + (b.QuotedValue || 0), 0))}
    </td>
    <td className="num">
      {formatCurrency(tentativeOrders.reduce((a, b) => a + (b.QuotedValue || 0), 0))}
    </td>
        <td className="num">
      {formatCurrency(confirmedOrders.reduce((a, b) => a + (b.TotalValue || 0), 0))}
    </td>
  </tr>
</tfoot>

          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default SalesDashboard;
