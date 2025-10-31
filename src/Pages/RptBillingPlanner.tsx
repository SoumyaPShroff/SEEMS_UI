import React, { useEffect, useState } from "react";
import { Button, CircularProgress, FormControl, InputLabel } from "@mui/material";
import { useBillingData } from "../components/hooks/useBillingData";
import { useManagers } from "../components/hooks/useManagers";
import { getCurrentMonthDates } from "../components/utils/DateUtils";
import { ProjectionVsTargetChart } from "../components/charts/ProjectionVsTargetChart";
import { dataGridSx } from "../components/common/DataGridStyles";
import { exporttoexcel } from "../components/utils/exporttoexcel";
import { ProjectManagerChart } from "../components/charts/ProjectManagerChart";
import { SalesManagerChart } from "../components/charts/SalesManagerChart";
import { baseUrl } from "../const/BaseUrl";
import axios from "axios";
import DesignVsWipChart from "../components/charts/DesignVsWipChart";
import SegmentWiseBillingChart from "../components/charts/SegmentWiseBillingChart";
import { toast } from "react-toastify";
import CustomDataGrid from "../components/common/CustomerDataGrid";
import type { GridColDef } from '@mui/x-data-grid';

// ✅ Types
interface BillingData {
  id: number;
  jobNumber: string;
  poAmount: number;
  [key: string]: any;
}

interface TotalsRow {
  Layout: number;
  Analysis: number;
  GovtLayout: number;
  GovtAnalysis: number;
  Library: number;
  DFM: number;
  VA: number;
  NPI: number;
  ECO: number;
  GrandTotal: number;
}

interface Manager {
  hopc1id: string;
  hopc1name: string;
  costcenter: string;
  [key: string]: any;
}

// ✅ Utility functions
const initTotalsRow = (): TotalsRow => ({
  Layout: 0,
  Analysis: 0,
  GovtLayout: 0,
  GovtAnalysis: 0,
  Library: 0,
  DFM: 0,
  VA: 0,
  NPI: 0,
  ECO: 0,
  GrandTotal: 0,
});

const bucketFor = (job: string, enqType: string, typ: string, govtTender?: string): string | null => {
  if (!job) return null;
  const isGovt = govtTender === "YES";
  if (job.endsWith("_VA")) return "VA";
  if (job.endsWith("_NPI")) return "NPI";
  if (job.endsWith("_DFM")) return "DFM";
  if (job.endsWith("_Lib")) return "Library";

  //if (job.endsWith("_Analysis")) return "Analysis";
  if (job.endsWith("_Analysis")) return isGovt ? "GovtAnalysis" : "Analysis";
  if (isGovt) return "GovtLayout";

  if (enqType === "OFFSHORE" && typ === "Export") return "At Office Export";
  if (enqType === "OFFSHORE" && typ === "Domestic") return "At Office Domestic";
  if (enqType === "ONSITE" && typ === "Domestic") return "Onsite Domestic";

  return "Layout";
};

// ✅ Utility to compute summary totals
const buildSummaryFromData = (data: BillingData[]) => {
  const buckets: Record<string, TotalsRow> = {};
  const total: TotalsRow = initTotalsRow();

  data.forEach((r) => {
    const job = r.jobNumber || "";
    const enqType = (r as any).enqType || "";
    const typ = (r as any).type || "";
    const po = parseFloat(r.poAmount?.toString() || "0");
    const eco = parseFloat((r as any).eco || "0");
    const govtTender = (r as any).govt_tender || "";
    const key = bucketFor(job, enqType, typ, govtTender);
    if (!key) return;

    if (!buckets[key]) buckets[key] = initTotalsRow();

    const addSeg = (tr: TotalsRow) => {
      if (key === "Analysis") tr.Analysis += po;
      else if (key === "GovtAnalysis") tr.GovtAnalysis += po;
      else if (key === "Layout") tr.Layout += po;
      else if (key === "GovtLayout") tr.GovtLayout += po;
      else if (key === "VA") tr.VA += po;
      else if (key === "NPI") tr.NPI += po;
      else if (key === "Library") tr.Library += po;
      else if (key === "DFM") tr.DFM += po;

      tr.ECO += eco;
      tr.GrandTotal =
        tr.Layout + tr.Analysis + tr.Library + tr.DFM + tr.VA + tr.NPI + tr.ECO;
    };

    addSeg(buckets[key]);
    addSeg(total);
  });

  return { buckets, total };
};


const RptBillingPlanner: React.FC = () => {
  const { data, loading, fetchBillingData } = useBillingData();
  const { managers } = useManagers();
  const { startdate: initialStart, enddate: initialEnd } = getCurrentMonthDates();
  const [startdate, setStartdate] = useState(initialStart);
  const [enddate, setEnddate] = useState(initialEnd);
  const [selectedManager, setSelectedManager] = useState<any>({ costcenter: "All" });
  const [summary, setSummary] = useState<any>(null);
  const [invoiceDict, setInvoiceDict] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false); // New state to control rendering
  const [wipSumData, setWipSumData] = useState(0);
  const [totalDesignVA, setTotalDesignVA] = useState(0);
  const [loadingData, setLoadingData] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoadingData(true); // show spinner
      setShowResults(false);

      // Fetch billing data
      await fetchBillingData(startdate, enddate, selectedManager.costcenter);

      // ✅ Fetch Invoice Dictionary
      const invUrl = `${baseUrl}/getInvoiceDictionary?startdate=${startdate}&enddate=${enddate}`;
      const invResponse = await axios.get<{ jobnumber: string; month: number; year: number }[]>(invUrl);

      const invSet = new Set<string>();
      invResponse.data.forEach((row) => {
        const key = `${row.jobnumber}_${row.month}_${row.year}`;
        invSet.add(key);
      });

      setInvoiceDict(invSet);
      // ✅ Wait until billing data is populated (React state may lag a bit)
      setTimeout(() => {
        setShowResults(true);
        setLoadingData(false);
      }, 500); // slight delay ensures React updated `data`

    } catch (error) {
      console.error("Error generating report:", error);
      setSummary(null);
      setShowResults(false);
      setLoadingData(false); // hide spinner
    }
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const summaryResult = buildSummaryFromData(data);
      setSummary(summaryResult);

      const columnToSum = 'wipAmount';
      const wipSum = data.reduce((acc, item) => acc + (item[columnToSum] || 0), 0);
      setWipSumData(wipSum);

      const columnToPSum = 'poAmount';
      const designSum = data.reduce((acc, item) => acc + (item[columnToPSum] || 0), 0);
      setTotalDesignVA(designSum);
      setShowResults(true);

    } else {
      setSummary(null);
      setShowResults(false);
    }
  }, [data]);

  // ✅ Render Summary Table
  const renderSummaryTable = () => {
    if (!summary) return null;
    const { buckets, total } = summary;

    const renderRow = (label: string, row: TotalsRow) => (
      <tr key={label}>
        <td
          style={{
            fontWeight: "bold",
            textAlign: "left",
            padding: "6px 10px",
            border: "2px solid #ccc",
            fontFamily: "'Segoe UI', Roboto, sans-serif",
          }}
        >
          {label}
        </td>
        {Object.keys(row).map((key) => (
          <td
            key={key}
            style={{
              textAlign: "right",
              padding: "4px 8px",
              border: "2px solid #ccc",
              fontFamily: "'Segoe UI', Roboto, sans-serif",
            }}
          >
            {row[key as keyof TotalsRow].toFixed(2)}
          </td>
        ))}
      </tr>
    );

    return (
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "10px",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th
                style={{
                  padding: "6px",
                  border: "1px solid #ccc",
                  fontFamily: "'Segoe UI', Roboto, sans-serif",
                }}
              >
                Category
              </th>
              {Object.keys(total).map((key) => (
                <th
                  key={key}
                  style={{
                    border: "1px solid #ccc",
                    padding: "6px",
                    fontFamily: "'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(buckets).map(([label, row]) => renderRow(label, row as TotalsRow))}
            <tr style={{ backgroundColor: "#e6f0ff", fontWeight: "bold" }}>
              <td
                style={{
                  border: "1px solid #ccc",
                  padding: "6px",
                  fontFamily: "'Segoe UI', Roboto, sans-serif",
                }}
              >
                Total
              </td>
              {Object.keys(total).map((key) => (
                <td
                  key={key}
                  style={{
                    textAlign: "right",
                    padding: "4px 8px",
                    fontFamily: "'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  {total[key as keyof TotalsRow].toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const columns: GridColDef[] = [
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 220, },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 180 },
    { field: "startDate", headerName: "Start Date", flex: 1, minWidth: 100 },
    { field: "plannedEndDate", headerName: "Planned End Date", flex: 1, minWidth: 100 },
    { field: "totalHrs", headerName: "Total Hours", flex: 1, minWidth: 100 },
    { field: "plannedHrs", headerName: "Planned Hours", flex: 1, minWidth: 50 },
    { field: "bilHrs_CurrentMonth", headerName: "BilHrs_CurrentMonth", flex: 1, minWidth: 50 },
    { field: "billPerctg_CurMonth", headerName: "BillPerctg_CurMonth", flex: 1, minWidth: 50 },
    { field: "projectComp_Perc", headerName: "ProjectComp_Perc", flex: 1, minWidth: 50 },
    { field: "updatedByPrevDay", headerName: "UpdatedByPrevDay", flex: 1, minWidth: 80 },
    { field: "billableECOHrs", headerName: "BillableECO", flex: 1 },
    { field: "eco", headerName: "ECO", flex: 1 },
    { field: "bilHrsPrevDay", headerName: "BilHrsPrevDay", flex: 1 },
    { field: "wipAmount", headerName: "WIPAmount", flex: 1 },
    { field: "enqType", headerName: "EnqType", flex: 1 },
    { field: "enquiryno", headerName: "Enquiry no", flex: 1 },
    { field: "govt_tender", headerName: "govt_tender", flex: 1 },
    { field: "estimatedHours", headerName: "Estimated Hours", flex: 1 },
    { field: "poNumber", headerName: "PO Number", flex: 1 },
    { field: "hourlyRate", headerName: "HourlyRate", flex: 1 },
    { field: "poRcvd", headerName: "PoRcvd", flex: 1 },
    { field: "poAmount", headerName: "PO Amount", flex: 1, minWidth: 100 },
    { field: "billingType", headerName: "BillingType", flex: 1 },
    { field: "expectedDeliveryDate", headerName: "ExpectedDeliveryDate", flex: 1 },
    { field: "actualEndDate", headerName: "ActualEndDate", flex: 1 },
    { field: "nonBillableHrs", headerName: "Non Billable Hrs", flex: 1 },
    { field: "flagRaisedOn", headerName: "Flag RaisedOn", flex: 1 },
    { field: "totalBillableHrs", headerName: "Total Billable Hrs", flex: 1 },
    { field: "totalInvoicedHrs", headerName: "Total Invoiced Hrs", flex: 1 },
    { field: "totalInvoicedAmt", headerName: "Total InvoicedAmt", flex: 1 },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "costCenter", headerName: "Cost Center", flex: 1 },
    { field: "projectManager", headerName: "Project Manager", flex: 1, minWidth: 150 },
    { field: "salesManager", headerName: "Sales Manager", flex: 1 },
    { field: "jobtitle", headerName: "Job Title", flex: 1 },
    { field: "rejectedHrs", headerName: "Rejected Hrs", flex: 1 },
    { field: "projectmanagerid", headerName: "projectmanagerid", flex: 1 },
  ];

  const getRowClassName = (params: any): string => {
    const jobNo: string = params.row.jobNumber || "";
    const poRcvd: string = params.row.poRcvd || "";
    const dtStr: string = params.row.flagRaisedOn || "";

    // 🟥 Case 1 — PO not received
    if (poRcvd === "NO") {
      return "row-red";
    }

    // 🟦 Case 2 — Flag date present
    if (dtStr) {
      const flagDate = new Date(dtStr);
      const key = `${jobNo}_${flagDate.getMonth() + 1}_${flagDate.getFullYear()}`;

      // 🟩 Case 2a — Invoice exists
      if (invoiceDict.has(key)) {
        return "row-green";
      }

      // 🟦 Case 2b — Flag raised in current month/year
      const end = new Date(enddate);
      if (
        flagDate.getMonth() === end.getMonth() &&
        flagDate.getFullYear() === end.getFullYear()
      ) {
        return "row-blue";
      }

      // ⚫ Case 2c — None of the above
      return "row-black";
    }

    // ⚫ Default fallback if no date and PO received
    return "row-black";
  };

  const handleExport = () => {
    exporttoexcel(data, "BillingPlanner", "BillingPlanner.xlsx");
    toast.success("✅ Export successful!", { position: "bottom-right" });
  };

  return (
    <div style={{ padding: "120px", textAlign: "center" }}>
      {/* Manager Selection */}
      <InputLabel style={{ textAlign: "left" }}>Select Manager</InputLabel>
      <FormControl fullWidth style={{ marginBottom: "20px" }}>
        <select
          style={{ width: "200px", padding: "10px", fontSize: "12px", textAlign: "left" }}
          value={selectedManager?.costcenter ?? "All"}
          onChange={(e) => {
            const selectedValue = e.target.value;
            const manager = managers.find((m: Manager) => m.costcenter === selectedValue);
            setSelectedManager(
              manager || { hopc1id: "All", hopc1name: "All", costcenter: "All" }
            );
          }}
        >
          {managers.map((manager: Manager) => (
            <option
              key={`${manager.hopc1id}-${manager.costcenter || "All"}`}
              value={manager.costcenter || "All"}
            >
              {manager.hopc1name === "All"
                ? "All"
                : `${manager.hopc1name} (${manager.costcenter})`}
            </option>
          ))}
        </select>
      </FormControl>

      {/* Date Range + Generate Button */}
      <div
        style={{
          backgroundColor: "#81adde",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px",
        }}
      >
        <label>
          Start Date:{" "}
          <input
            type="date"
            value={startdate}
            onChange={(e) => setStartdate(e.target.value)}
          />
        </label>
        <label>
          End Date:{" "}
          <input
            type="date"
            value={enddate}
            onChange={(e) => setEnddate(e.target.value)}
          />
        </label>

        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </div>

      {/* ✅ Loading Spinner */}
      {loadingData && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "40px",
          }}
        >
          <CircularProgress size={60} />
          <p style={{ color: "#333", marginTop: "10px", fontWeight: 500 }}>
            Loading data...
          </p>
        </div>
      )}

      {/* ✅ Show results only after data is ready */}
        <>
          <div>{renderSummaryTable()}</div>
          {/* === Row 1: 3 charts === */}
           {!loadingData && showResults && data?.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "30px", marginTop: "10px" }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", padding: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "400px" }}>
              <ProjectionVsTargetChart data={data} />
            </div>
           
            <div style={{ flex: 1, background: "#fff", maxWidth: "35%", borderRadius: "8px", padding: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "400px" }}>
              <SegmentWiseBillingChart data={data} />
            </div>
          </div>
           )}
          {/* === Row 2: 2 charts === */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
             {!loadingData && showResults && data?.length > 0 && (
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
              <ProjectManagerChart data={data} />
            </div>
            )}
             {!loadingData && showResults && data?.length > 0 && (
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
              <SalesManagerChart data={data} />
            </div>
             )}
              {!loadingData && showResults && data?.length > 0 && (
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
              <DesignVsWipChart
                totalDesignVA={totalDesignVA}
                totalWip={wipSumData}
                targetAbs={53900000}
              />
            </div>
              )}
          </div>
            {!loadingData && showResults && data?.length > 0 && (
          <div style={{ textAlign: "right", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px" }}>
            <button
              style={{ backgroundColor: "#2b7be3", color: "white" }}
              onClick={handleExport}
            >
              Export to Excel
            </button>

            {/* 🟦🟥🟩 Legends */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  backgroundColor: "blue",
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: "1px solid #333",
                }}
              ></div>
              <span>Flag raised for current month</span>
              <div
                style={{
                  backgroundColor: "red",
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: "1px solid #333",
                  marginLeft: "10px",
                }}
              ></div>
              <span>PO not received</span>
              <div
                style={{
                  backgroundColor: "green",
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: "1px solid #333",
                  marginLeft: "10px",
                }}
              ></div>
              <span>Invoiced</span>
            </div>
          </div>
            )}
              {!loadingData && showResults && data?.length > 0 && (
          <div
            style={{
              position: "relative",
              width: "100%",
              marginTop: "20px",
            }}
          >
            <CustomDataGrid
              rows={data}
              columns={columns}
              getRowClassName={(params) => getRowClassName(params) ?? ""}
              title="Billing Planner Data"
              loading={loading}
              sx={dataGridSx}
            />
          </div>
              )}
        </>
    </div>
  );

};
export default RptBillingPlanner;