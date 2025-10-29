import React, { useState } from "react";
import { getCurrentMonthDates } from "../components/utils/DateUtils";
import { baseUrl } from "../const/BaseUrl";
import { LoadingButton } from "@mui/lab";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import "../styles/SalesDashboard.css";

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

  // === Fetch chart + order data ===
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setShowData(false);

    try {
      const [chartRes, tentquorderRes, openconfmorderRes] = await Promise.all([
        fetch(
          `${baseUrl}/api/Sales/GetThreeMonthConfirmedOrders?startdate=${startdate}&enddate=${enddate}`
        ),
        fetch(`${baseUrl}/api/Sales/TentativeQuotedOrders`),
        fetch(`${baseUrl}/api/Sales/OpenConfirmedOrders`),
      ]);

      if (!chartRes.ok || !tentquorderRes.ok || !openconfmorderRes.ok)
        throw new Error("Failed to load dashboard data.");

      const chartDataJson = await chartRes.json();
      const tentqorderDataJson = await tentquorderRes.json();
      const openconforderDataJson = await openconfmorderRes.json();

      setChartData(chartDataJson || []);
      setTentativeOrders(tentqorderDataJson?.tentativeOrders || []);
      setQuotedOrders(tentqorderDataJson?.quotedOrders || []);
      setOpenOrders(openconforderDataJson?.openOrders || []);
      setConfirmedOrders(openconforderDataJson?.confirmedOrders || []);
      setShowData(true);
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      setError("Error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // === Pie data aggregation ===
  const aggregatedByCategory = chartData.reduce((acc: any[], cur: any) => {
    const existing = acc.find((a) => a.designcategory === cur.designcategory);
    if (existing) existing.totalValue += cur.totalValue;
    else acc.push({ designcategory: cur.designcategory, totalValue: cur.totalValue });
    return acc;
  }, []);

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatCurrency = (val: number) =>
    val ? `₹${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "₹0";

  // === Unified Filtering Logic (Final Optimized Version) ===
  const filterOrders = (orders, catKey) => {
    if (!orders || !catKey) return [];

    // Split type (Domestic/Export) and category (Layout/Analysis/VA/NPI/Onsite)
    const parts = catKey.trim().split(" ");
    let typeFilter, designCatFilter;

    // Auto-detect order of words
    if (["Domestic", "Export"].includes(parts[0])) {
      [typeFilter, designCatFilter] = parts;
    } else {
      [designCatFilter, typeFilter] = parts;
    }

    const category = designCatFilter?.trim()?.toLowerCase();

    return orders.filter((x) => {
      const type = x.type?.trim();
      const enquiry = x.enquirytype?.trim()?.toUpperCase();
      const layout = x.layout?.trim()?.toLowerCase();
      const designCat = x.designcategory?.trim()?.toLowerCase();

      // === 1️⃣ Handle ONSITE ===
      if (catKey.toUpperCase() === "ONSITE") {
        return enquiry === "ONSITE" || designCat === "onsite";
      }

      // === 2️⃣ CONFIRMED ORDERS ===
      if (x.TotalValue !== undefined && "designcategory" in x) {
        // normalize fields
        const designCat = x.designcategory?.toString().trim().toLowerCase() || "";
        const category = designCatFilter?.toString().trim().toLowerCase() || "";
        const type = x.type?.toString().trim() || "";

        // categories that should ignore type filter
        const ignoreTypeFor = ["analysis", "va", "npi"];

        // ✅ skip typeFilter for Analysis, VA, NPI
        if (ignoreTypeFor.includes(category)) {
          return designCat === category;
        }

        // ✅ apply typeFilter for Layout, Onsite, etc.
        return designCat === category && type === typeFilter;
      }


      // === 3️⃣ OPEN ORDERS ===
      if ("playout" in x) {
        switch (category) {
          case "layout": return type === typeFilter && x.playout > 0;
          case "analysis": return type === x.panalysis > 0;
          case "va": return type === x.pVA > 0;
          case "npi": return type === x.pNPI > 0;
          default: return false;
        }
      }

      // === 4️⃣ TENTATIVE / QUOTED ORDERS ===
      const hasQuoted = x.QuotedValue > 0;
      const hasTentative = x.TentativeValue > 0;

      if (hasQuoted || hasTentative) {
        const {
          design,
          layout_others,
          dfm,
          dfa,
          library,
          si,
          pi,
          emi_net_level,
          emi_system_level,
          thermal_board_level,
          thermal_system_level,
          asmb,
          hardware,
          software,
          fpg,
          hardware_testing,
          hardware_others,
          DesignOutSource,
          NPINew_BOMProc,
          NPINew_Fab,
          NPINew_Assbly,
          NPINew_JobWork,
          NPINew_Testing,
          qacam,
        } = x;

        // --- Layout ---
        const isLayout =
          (
            // Export Layout
            (type === "Export" &&
              (
                design === "YES" ||
                layout_others === "YES" ||
                dfm === "YES" ||
                dfa === "YES" ||
                qacam === "YES" ||
                library === "YES"
              ) &&
              !(
                layout?.includes("analysis") ||
                layout?.includes("fabrication") ||
                layout?.includes("hardware") ||
                layout?.includes("assembly") ||
                layout?.includes("pcba")
              ) &&
              x.currency_id !== 1 &&
              enquiry === "OFFSHORE") ||

            // Domestic Layout
            (type !== "Export" &&
              (
                dfm === "YES" ||
                dfa === "YES" ||
                library === "YES" ||
                design === "YES" ||
                layout_others === "YES" ||
                qacam === "YES" ||
                layout?.includes("layout")
              ) &&
              x.currency_id === 1 &&
              enquiry === "OFFSHORE" &&
              !(
                layout?.includes("analysis") ||
                layout?.includes("fabrication") ||
                layout?.includes("hardware") ||
                layout?.includes("assembly") ||
                layout?.includes("pcba")
              ))
          );

        // --- Analysis ---
        const isAnalysis =
          (si === "YES" ||
            pi === "YES" ||
            emi_net_level === "YES" ||
            emi_system_level === "YES" ||
            thermal_board_level === "YES" ||
            thermal_system_level === "YES" ||
            layout?.includes("analysis"));

        // --- VA ---
        const isVA =
          (
            asmb === "YES" ||
            hardware === "YES" ||
            software === "YES" ||
            fpg === "YES" ||
            hardware_testing === "YES" ||
            hardware_others === "YES" ||
            DesignOutSource === "YES"
          ) &&
          (
            layout?.includes("fabrication") ||
            layout?.includes("hardware")
          );

        // --- NPI ---
        const isNPI =
          (
            NPINew_BOMProc === "YES" ||
            NPINew_Fab === "YES" ||
            NPINew_Assbly === "YES" ||
            NPINew_JobWork === "YES" ||
            NPINew_Testing === "YES" ||
            hardware_testing === "YES" ||
            hardware_others === "YES" ||
            DesignOutSource === "YES"
          ) &&
          (
            layout?.includes("assembly") ||
            layout?.includes("pcba")
          );

        if (category === "layout" && (isLayout || isAnalysis || isVA || isNPI) && type === typeFilter) return true;
        if (category === "analysis" && isAnalysis) return true;
        if (category === "va" && isVA) return true;
        if (category === "npi" && isNPI) return true;
      }
      return false;
    });
  };


  return (
    <div className="dashboard-container">
      <div
        style={{
          padding: "15px 25px",
          color: "#216fbdff",
          fontWeight: "bold",
          fontSize: "20px",
          textAlign: "center",   // ✅ centers text
          width: "100%",          // ✅ ensures it stretches across container
        }}
      >
        Sales Management Dashboard
      </div>

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

          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleGenerate}
            loading={loading}
            loadingPosition="start"
          >
            {loading ? "Generating..." : "Generate"}
          </LoadingButton>
        </div>
      </motion.div>

      {/* === Error === */}
      {error && <p className="error-message">{error}</p>}

      {/* === Charts === */}
      {loading ? (
        <p className="loading-message">Loading dashboard data...</p>
      ) : !loading && showData && chartData.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="dashboard-section charts-grid"
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
                  const isLayout = cat.includes("Layout");
                  const isExport = cat.startsWith("Export");
                  const isDomestic = cat.startsWith("Domestic");

                  const monthTotals = Array.from(new Set(chartData.map((d) => d.monthNo))).map((m) => {
                    const filtered = chartData.filter((d) => {
                      const design = d.designcategory?.toLowerCase();
                      const monthMatch = d.monthNo === m;

                      if (isLayout) {
                        // Layout split by currency
                        if (isExport) return monthMatch && design === "layout" && d.currency_id !== 1;
                        if (isDomestic) return monthMatch && design === "layout" && d.currency_id === 1;
                      }

                      // Other categories (Onsite, Analysis, etc.)
                      return monthMatch && design === cat.toLowerCase();
                    });

                    const total = filtered.reduce((a, b) => a + (b.totalValue || 0), 0);
                    return total;
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

          <div className="chart-card">
            <h3 className="chart-title">Category Contribution (Last 3 Months Confirmed Orders)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={aggregatedByCategory}
                  dataKey="totalValue"
                  nameKey="designcategory"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
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
        <p></p>
      )}

      {/* === Category Summary === */}
      {/* {showData   && ( */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="dashboard-section"
      >
        <h3 className="chart-title">Category-wise Orders</h3>
        <div className="summary-grid">
          <table className="summary-table enhanced">
            <thead>
              <tr>
                <th>Category</th>
                <th>Open Orders</th>
                <th>Tentative Orders</th>
                <th>Confirmed Orders</th>
                <th>Quoted Orders</th>
              </tr>
            </thead>
            <tbody>
              {[
                "Domestic Layout",
                "Export Layout",
                "ONSITE",
                "Analysis",
                "VA",
                "NPI",
              ].map((catKey, i) => {
                const [typeFilter, designCatFilter] = catKey.split(" ");
                const [expanded, setExpanded] = useState(false);

                const openSubs = filterOrders(openOrders, catKey);
                const tentativeSubs = filterOrders(tentativeOrders, catKey);
                const confirmedSubs = filterOrders(confirmedOrders, catKey);
                const quotedSubs = filterOrders(quotedOrders, catKey);

                const openTotal = openSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);
                const tentativeTotal = tentativeSubs.reduce((a, b) => a + (b.TentativeValue || 0), 0);
                const confirmedTotal = confirmedSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);
                // Combine all values per category (Quoted + Tentative + Confirmed)
                const quotedTotal = quotedSubs.reduce((a, b) => a + (b.QuotedValue || 0), 0) +
                  tentativeSubs.reduce((a, b) => a + (b.TentativeValue || 0), 0) +
                  confirmedSubs.reduce((a, b) => a + (b.TotalValue || 0), 0);

                return (
                  <React.Fragment key={i}>
                    <tr
                      className="expandable-row"
                      onClick={() => setExpanded(!expanded)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        {catKey}
                      </td>
                      <td className="num">{formatCurrency(openTotal)}</td>
                      <td className="num">{formatCurrency(tentativeTotal)}</td>
                      <td className="num">{formatCurrency(confirmedTotal)}</td>
                      <td className="num">{formatCurrency(quotedTotal)}</td>
                    </tr>

                    {expanded && (
                      <>
                        {[
                          { type: "Open", data: openSubs },
                          { type: "Tentative", data: tentativeSubs },
                          { type: "Confirmed", data: confirmedSubs },
                          // { type: "Quoted", data: mergedQuoted },
                          { type: "Quoted", data: quotedSubs },
                        ].map(({ type, data }) =>
                          data.map((s, idx) => (
                            <tr key={`${catKey}-${type}-${idx}`} className="sub-row">
                              <td className="sub-cat">
                                {s.subcategory || s.designcategory || s.enquirytype || "—"}
                              </td>
                              <td className="num">{type === "Open" ? formatCurrency(s.TotalValue) : ""}</td>
                              <td className="num">{type === "Tentative" ? formatCurrency(s.TentativeValue) : ""}</td>
                              <td className="num">{type === "Confirmed" ? formatCurrency(s.TotalValue) : ""}</td>
                              <td className="num">{type === "Quoted" ? formatCurrency(s.QuotedValue) : ""}</td>
                            </tr>
                          ))
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">

                <td>Total Orders</td>
                {/* 🟢 OPEN TOTAL */}
                <td className="num">
                  {formatCurrency(openOrders.reduce((a, b) => a + (b.TotalValue || 0), 0))}
                </td>

                {/* 🔵 TENTATIVE TOTAL */}
                <td className="num">
                  {(() => {
                    const totalTentativeAllCats = [
                      "Domestic Layout",
                      "Export Layout",
                      "ONSITE",
                      "Analysis",
                      "VA",
                      "NPI",
                    ].reduce((total, catKey) => {
                      const tentativeSubs = filterOrders(tentativeOrders, catKey);
                      const tentativeTotal = tentativeSubs.reduce((a, b) => a + (b.TentativeValue || 0), 0);
                      return total + tentativeTotal;
                    }, 0);
                    return formatCurrency(totalTentativeAllCats);
                  })()}
                </td>

                {/* 🔴 CONFIRMED TOTAL */}
                <td className="num">
                  {formatCurrency(confirmedOrders.reduce((a, b) => a + (b.TotalValue || 0), 0))}
                </td>

                {/* 🟠 QUOTED TOTAL (includes Quoted + Tentative + Confirmed) */}
                <td className="num">
                  {(() => {
                    const totalQuotedAllCats = [
                      "Domestic Layout",
                      "Export Layout",
                      "ONSITE",
                      "Analysis",
                      "VA",
                      "NPI",
                    ].reduce((total, catKey) => {
                      const quotedSubs = filterOrders(quotedOrders, catKey);
                      const tentativeSubs = filterOrders(tentativeOrders, catKey);
                      const confirmedSubs = filterOrders(confirmedOrders, catKey);

                      const quotedTotal = quotedSubs.reduce(
                        (a, b) => a + (b.QuotedValue || 0),
                        0
                      );
                      const tentativeTotal = tentativeSubs.reduce(
                        (a, b) => a + (b.TentativeValue || 0),
                        0
                      );
                      const confirmedTotal = confirmedSubs.reduce(
                        (a, b) => a + (b.TotalValue || 0),
                        0
                      );

                      return total + quotedTotal + tentativeTotal + confirmedTotal;
                    }, 0);

                    return formatCurrency(totalQuotedAllCats);
                  })()}
                </td>
              </tr>
            </tfoot>

          </table>
        </div>
      </motion.div>
      {/* )} */}
    </div>
  );
};

export default SalesDashboard;