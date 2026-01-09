import React, { useEffect, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { useBillingData } from './billplanhooks/useBillingData';
import { useManagers } from "../../../../components/utils/useManagers";
import { ProjectionVsTargetChart } from "./billingplancharts/ProjectionVsTargetChart";
import { dataGridSx } from "./BillPlanDataGridStyles";
import { ProjectManagerChart } from "./billingplancharts/ProjectManagerChart";
import { SalesManagerChart } from "./billingplancharts/SalesManagerChart";
import axios from "axios";
import DesignVsWipChart from "./billingplancharts/DesignVsWipChart";
import SegmentWiseBillingChart from "./billingplancharts/SegmentWiseBillingChart";
import { toast } from "react-toastify";
import type { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { baseUrl } from "../../../../const/BaseUrl";
import { exporttoexcel } from "../../../../components/utils/exporttoexcel";
import ExportButton from "../../../../components/resusablecontrols/ExportButton";
import CustomDataGrid from "../../../../components/resusablecontrols/CustomDataGrid";
import SelectControl from "../../../../components/resusablecontrols/SelectControl";
import { formatInLakhs } from "../../../../components/utils/formatInLakhs";

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
  GrandTotal: 0,
  VA: 0,
  NPI: 0,
  ECO: 0,
});

// ✅ Map each record into main category (row)
const mainCategoryFor = (enqType: string, typ: string): string => {
  if (enqType === "OFFSHORE" && typ === "Export") return "At Office Export";
  if (enqType === "OFFSHORE" && typ === "Domestic") return "At Office Domestic";
  if (enqType === "ONSITE" && typ === "Domestic") return "Onsite Domestic";
  return "At Office Domestic"; // default fallback
};

// ✅ Identify which column the PO amount belongs to
const columnFor = (job: string, govtTender?: string): keyof TotalsRow => {
  const isGovt = govtTender === "YES";
  if (job.endsWith("_VA")) return "VA";
  if (job.endsWith("_NPI")) return "NPI";
  if (job.endsWith("_DFM") || job.endsWith("_CAM") || job.endsWith("_CEG")) return "DFM";
  if (job.endsWith("_Lib")) return "Library";
  if (job.endsWith("_Analysis")) return isGovt ? "GovtAnalysis" : "Analysis";
  return isGovt ? "GovtLayout" : "Layout";
};

// ✅ Compute summary grouped by main categories
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

    // Determine which row (main category) it belongs to
    const mainKey = mainCategoryFor(enqType, typ);
    // Determine which column to add to
    const columnKey = columnFor(job, govtTender);

    if (!buckets[mainKey]) buckets[mainKey] = initTotalsRow();

    // Add to specific column
    (buckets[mainKey][columnKey] as number) += po;

    // Always add ECO
    buckets[mainKey].ECO += eco;

    // Recalculate row total
    buckets[mainKey].GrandTotal =
      buckets[mainKey].Layout +
      buckets[mainKey].Analysis +
      buckets[mainKey].GovtLayout +
      buckets[mainKey].GovtAnalysis +
      buckets[mainKey].Library +
      buckets[mainKey].DFM;

    // Update grand totals
    (total[columnKey] as number) += po;
    total.ECO += eco;
    total.GrandTotal =
      total.Layout +
      total.Analysis +
      total.GovtLayout +
      total.GovtAnalysis +
      total.Library +
      total.DFM;
  });

  return { buckets, total };
};

const RptBillingPlanner: React.FC = () => {
  const { data, loading, fetchBillingData } = useBillingData();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const { managers } = useManagers(loginId, "billingplanner");
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [invoiceDict, setInvoiceDict] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false); // New state to control rendering
  const [wipSumData, setWipSumData] = useState(0);
  const [totalDesignVA, setTotalDesignVA] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [invoicePendingData, setInvoicePendingData] = useState<BillingData[]>([]);
  const [pendingSummary, setPendingSummary] = useState<any>(null);
  const months = [
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

  const years = Array.from({ length: 12 }, (_, i) => {
    const y = 2020 + i;
    return { value: y, label: String(y) };
  });

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const startdate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateObj = new Date(year, month, 0);

  const enddate = `${year}-${String(month).padStart(2, "0")}-${String(
    endDateObj.getDate()
  ).padStart(2, "0")}`;

  const defaultVisibleColumns: GridColumnVisibilityModel = {
    jobNumber: true,
    customer: true,
    startDate: true,
    plannedEndDate: true,
    totalHrs: true,
    poAmount: true,
    plannedHrs: true,
    enqType: true,
    estimatedHours: true,
    hourlyRate: true,
    type: true,
    costCenter: true,
    salesManager: true,
    projectManager: true,

    // ❌ hidden initially

    bilHrs_CurrentMonth: false,
    billPerctg_CurMonth: false,
    projectComp_Perc: false,
    updatedByPrevDay: false,
    billableECOHrs: false,
    eco: false,
    bilHrsPrevDay: false,
    wipAmount: false,
    enquiryno: false,
    govt_tender: false,
    poNumber: false,
    poRcvd: false,
    billingType: false,
    expectedDeliveryDate: false,
    actualEndDate: false,
    nonBillableHrs: false,
    flagRaisedOn: false,
    totalBillableHrs: false,
    totalInvoicedHrs: false,
    totalInvoicedAmt: false,
    jobtitle: false,
    rejectedHrs: false,
    projectmanagerid: false,
  };

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(defaultVisibleColumns);

  const handleGenerate = async () => {
    try {
      setLoadingData(true); // show spinner
      setShowResults(false);
      setInvoiceDict(new Set()); // reset old data

      // Fetch billing data startdate,
      await fetchBillingData(startdate, enddate, selectedManager.costcenter);

      // ✅ Fetch Invoice Dictionary
      const invUrl = `${baseUrl}/api/Job/InvoiceDictionary/${startdate}/${enddate}`;
      const invResponse = await axios.get<{ jobnumber: string; month: number; year: number }[]>(invUrl);

      const invSet = new Set<string>();
      invResponse.data.forEach((row) => {
        const key = `${row.jobnumber}_${row.month}_${row.year}`;
        invSet.add(key);
      });

      setInvoiceDict(invSet);

      const invPendingUrl = `${baseUrl}/api/Sales/PendingInvoices/${selectedManager.costcenter}`;
      const pendingResponse = await axios.get<BillingData[]>(invPendingUrl);
      setInvoicePendingData(pendingResponse.data);

      // if (pendingResponse.data && pendingResponse.data.length > 0) {
      const summary = buildPendingSummary(pendingResponse.data);
      setPendingSummary(summary);
      //}
      setShowResults(true);
      setLoadingData(false);
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

  // Automatically set selectedManager when managers are loaded
  useEffect(() => {
    if (managers.length > 0) {
      // If user has limited access → only one manager in list
      if (managers.length === 1) {
        setSelectedManager(managers[0]);
      }
      // Else default to "All"
      else {
        const allOption = managers.find((m) => m.hopc1id === "All");
        setSelectedManager(allOption || managers[0]);
      }
    }
  }, [managers]);

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
    }
  }, [data]);


  const renderSummaryTable = () => {
    if (!summary) return null;
    const { buckets, total } = summary;

    // ✅ Define order — Total will be manually rendered before "Not Invoiced"
    const mainCategories = [
      "At Office Export",
      "At Office Domestic",
      "Onsite Domestic",
      "Not Invoiced",
    ];

    // ✅ Render a single data row
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
        {Object.keys(row).map((key) => {
          const isGrandTotal = key === "GrandTotal";
          return (
            <td
              key={key}
              style={{
                textAlign: "right",
                padding: "4px 8px",
                border: "2px solid #ccc",
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                color: isGrandTotal ? "#506dbdff" : "inherit",
                fontWeight: isGrandTotal ? "bold" : "normal",
              }}
            >
              {/* {row[key as keyof TotalsRow].toFixed(2)} */}
              {formatInLakhs(row[key as keyof TotalsRow])}
            </td>
          );
        })}
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
            {/* ✅ Regular main categories (excluding "Not Invoiced") */}
            {mainCategories
              .filter((label) => label !== "Not Invoiced")
              .map((label) => {
                const row = buckets[label] || initTotalsRow();
                return renderRow(label, row);
              })}

            {/* ✅ Total Row (before Not Invoiced) */}
            <tr style={{ backgroundColor: "#e6f0ff", fontWeight: "bold" }}>
              <td
                style={{
                  border: "1px solid #ccc",
                  textAlign: "left",
                  padding: "4px 8px",
                  fontFamily: "'Segoe UI', Roboto, sans-serif",
                }}
              >
                Total
              </td>
              {Object.keys(total).map((key) => (
                <td
                  key={key}
                  style={{
                    border: "1px solid #ccc",
                    textAlign: "right",
                    padding: "4px 8px",
                    fontFamily: "'Segoe UI', Roboto, sans-serif",
                  }}
                >
                  {/* {total[key as keyof TotalsRow].toFixed(2)} */}
                  {formatInLakhs(total[key as keyof TotalsRow])}
                </td>
              ))}
            </tr>

            {/* ✅ Not Invoiced row (pending summary only) */}
            {pendingSummary && (() => {
              const pendingRow = pendingSummary.total;
              return renderRow("Not Invoiced", pendingRow);
            })()}
          </tbody>
        </table>
      </div>
    );
  };
  useEffect(() => {
    localStorage.setItem(
      "billingPlannerColumnVisibility",
      JSON.stringify(columnVisibilityModel)
    );
  }, [columnVisibilityModel]);

  const columns: GridColDef[] = [
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 450, },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 300 },
    { field: "startDate", headerName: "Start Date", flex: 1, minWidth: 100 },
    { field: "plannedEndDate", headerName: "Planned End Date", flex: 1, minWidth: 150 },
    { field: "totalHrs", headerName: "Total Hours", flex: 1, minWidth: 100 },
    { field: "plannedHrs", headerName: "Planned Hours", flex: 1, minWidth: 120 },
    { field: "bilHrs_CurrentMonth", headerName: "BilHrs_CurrentMonth", flex: 1, minWidth: 160 },
    { field: "billPerctg_CurMonth", headerName: "BillPerctg_CurMonth", flex: 1, minWidth: 160 },
    { field: "projectComp_Perc", headerName: "ProjectComp_Perc", flex: 1, minWidth: 160 },
    { field: "updatedByPrevDay", headerName: "UpdatedByPrevDay", flex: 1, minWidth: 150 },
    { field: "billableECOHrs", headerName: "BillableECO", flex: 1, minWidth: 100 },
    { field: "eco", headerName: "ECO", flex: 1, minWidth: 100 },
    { field: "bilHrsPrevDay", headerName: "BilHrsPrevDay", flex: 1, minWidth: 120 },
    { field: "wipAmount", headerName: "WIPAmount", flex: 1, minWidth: 120 },
    { field: "enqType", headerName: "EnqType", flex: 1, minWidth: 100 },
    { field: "enquiryno", headerName: "Enquiry no", flex: 1, minWidth: 120 },
    { field: "govt_tender", headerName: "govt_tender", flex: 1, minWidth: 100 },
    { field: "estimatedHours", headerName: "Estimated Hours", flex: 1, minWidth: 150 },
    { field: "poNumber", headerName: "PO Number", flex: 1, minWidth: 250 },
    { field: "hourlyRate", headerName: "HourlyRate", flex: 1, minWidth: 100 },
    { field: "poRcvd", headerName: "PoRcvd", flex: 1, minWidth: 100 },
    { field: "poAmount", headerName: "PO Amount", flex: 1, minWidth: 100 },
    { field: "billingType", headerName: "BillingType", flex: 1, minWidth: 100 },
    { field: "expectedDeliveryDate", headerName: "ExpectedDeliveryDate", flex: 1, minWidth: 150 },
    { field: "actualEndDate", headerName: "ActualEndDate", flex: 1, minWidth: 150 },
    { field: "nonBillableHrs", headerName: "Non Billable Hrs", flex: 1, minWidth: 140 },
    { field: "flagRaisedOn", headerName: "Flag RaisedOn", flex: 1, minWidth: 130 },
    { field: "totalBillableHrs", headerName: "Total Billable Hrs", flex: 1, minWidth: 150 },
    { field: "totalInvoicedHrs", headerName: "Total Invoiced Hrs", flex: 1, minWidth: 150 },
    { field: "totalInvoicedAmt", headerName: "Total InvoicedAmt", flex: 1, minWidth: 150 },
    { field: "type", headerName: "Type", flex: 1, minWidth: 90 },
    { field: "costCenter", headerName: "Cost Center", flex: 1, minWidth: 100 },
    { field: "projectManager", headerName: "Project Manager", flex: 1, minWidth: 150 },
    { field: "salesManager", headerName: "Sales Manager", flex: 1, minWidth: 150 },
    { field: "jobtitle", headerName: "Job Title", flex: 1, minWidth: 100 },
    { field: "rejectedHrs", headerName: "Rejected Hrs", flex: 1, minWidth: 120 },
    { field: "projectmanagerid", headerName: "projectmanagerid", flex: 1, minWidth: 80 },
    { field: "poDate", headerName: "PO Date", flex: 1, minWidth: 100 },
    { field: "realisedDate", headerName: "Realised Date", flex: 1, minWidth: 120 },
  ];

  const getRowClassName = (params: any): string => {
    const jobNo: string = params.row.jobNumber || "";
    const poRcvd: string = params.row.poRcvd || "";
    const dtStr: string = params.row.flagRaisedOn || "";
    const poDateStr: string = params.row.poDate;
    const requestDateStr: string = params.row.realisedDate;
    // 🟥 Case 1 — PO not received
    if (poRcvd === "NO") {
      //new logic
      if (poDateStr && requestDateStr) {
        const poDate = new Date(poDateStr);
        const requestDate = new Date(requestDateStr);
        const diffDays = Math.floor((poDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
        // 🟠 PO delay > 7 days
        if (diffDays > 7) {
          return "row-purple";
        }
      }

      // 🟥 Default PO not received
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

  const handleBillExport = () => {
    exporttoexcel(data, "BillingPlanner", "BillingPlanner-Data.xlsx");
    toast.success("✅ Billing Planner Data exported!", { position: "top-right" });
  };

  const handleInvPenExport = () => {
    exporttoexcel(data, "PendingInvoices", "BillingPlanner-PendInv.xlsx");
    toast.success("✅ Pending Invoices exported!", { position: "top-right" });
  };

  const pendingInvoiceColumns: GridColDef[] = [
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 400 },
    { field: "startDate", headerName: "Start Date", flex: 1, minWidth: 120 },
    { field: "enddate", headerName: "End Date", flex: 1, minWidth: 150 },
    { field: "costCenter", headerName: "CostCenter", flex: 1, minWidth: 120 },
    { field: "projectManager", headerName: "Project Manager", flex: 1, minWidth: 120 },
    { field: "flag_Raisedon", headerName: "Flag Raised Date", flex: 1, minWidth: 100 },
    { field: "totTimesheetHrs", headerName: "Total Timesheet Hrs", flex: 1, minWidth: 100 },
    { field: "approvedHrs", headerName: "Approved Hrsr", flex: 1, minWidth: 120 },
    { field: "rateperhour", headerName: "Rate Per hr", flex: 1, minWidth: 120 },
    { field: "poDate", headerName: "PO Date", flex: 1, minWidth: 100 },
    { field: "poNumber", headerName: "PO Number", flex: 1, minWidth: 100 },
    { field: "unBilledAmount", headerName: "UnBilledAmt", flex: 1, minWidth: 100 },
    { field: "enquiryNo", headerName: "Enquiryno", flex: 1, minWidth: 100 },
    { field: "enquiryType", headerName: "Enquiry Type", flex: 1, minWidth: 100 },
    { field: "type", headerName: "Type", flex: 1, minWidth: 100 },
    { field: "govt_tender", headerName: "govt_tender", flex: 1, minWidth: 100 },
    { field: "poAmount", headerName: "PO Amount", flex: 1, minWidth: 100 },
  ];

  // ✅ Compute summary grouped by main categories (for pending invoices)
  const buildPendingSummary = (data: BillingData[]) => {
    const buckets: Record<string, TotalsRow> = {};
    const total: TotalsRow = initTotalsRow();

    data.forEach((r) => {
      const job = r.jobNumber || "";
      const enqType = (r as any).enquiryType || "";
      const typ = (r as any).type || "";
      const po = parseFloat(r.poAmount?.toString() || "0");
      const govtTender = (r as any).govt_tender || "";

      // Determine main category (reuse same logic)
      const mainKey = mainCategoryFor(enqType, typ);
      const columnKey = columnFor(job, govtTender);

      if (!buckets[mainKey]) buckets[mainKey] = initTotalsRow();

      (buckets[mainKey][columnKey] as number) += po;
      buckets[mainKey].GrandTotal =
        buckets[mainKey].Layout +
        buckets[mainKey].Analysis +
        buckets[mainKey].GovtLayout +
        buckets[mainKey].GovtAnalysis +
        buckets[mainKey].Library +
        buckets[mainKey].DFM;

      // Also track overall totals
      (total[columnKey] as number) += po;
      total.GrandTotal =
        total.Layout +
        total.Analysis +
        total.GovtLayout +
        total.GovtAnalysis +
        total.Library +
        total.DFM;
    });
    return { buckets, total };

  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start", // ✅ Left align
          padding: "24px",
          mt: 11,
        }}
      >
        <Box sx={{ width: 300 }}>
          <SelectControl
            name="costcenter"
            label="Select Manager"
            value={selectedManager?.costcenter ?? "All"}
            width="200px"
            options={managers.map((manager: Manager) => ({
              value: manager.costcenter || "All",
              label:
                manager.hopc1name === "All"
                  ? "All"
                  : `${manager.hopc1name} (${manager.costcenter})`,
            }))}
            onChange={(e: any) => {
              const selectedValue = e.target.value;

              const manager = managers.find(
                (m: Manager) => m.costcenter === selectedValue
              );

              setSelectedManager(
                manager || {
                  hopc1id: "All",
                  hopc1name: "All",
                  costcenter: "All",
                }
              );
            }}
          />
        </Box>
      </Box>
      {/* Date Range + Generate Button */}
      <div
        style={{
          backgroundColor: "#81adde",
          color: "#000000ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: "10px",
        }}
      >
        <label>
          Month:
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            style={{ padding: "5px", marginLeft: "5px" }}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Year:
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: "5px", marginLeft: "5px" }}
          >
            {years.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
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
            <div style={{ flex: 1, background: "#fff", border: "1px solid #d1d1d1", borderRadius: "8px", padding: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "400px" }}>
              <ProjectionVsTargetChart data={data} />
            </div>

            <div style={{ flex: 1, background: "#fff", maxWidth: "35%", border: "1px solid #d1d1d1", borderRadius: "8px", padding: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "400px" }}>
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
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", border: "1px solid #d1d1d1", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
              <ProjectManagerChart data={data} />
            </div>
          )}
          {!loadingData && showResults && data?.length > 0 && (
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", border: "1px solid #d1d1d1", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
              <SalesManagerChart data={data} />
            </div>
          )}
          {!loadingData && showResults && data?.length > 0 && (
            <div style={{ flex: 1, background: "#fff", borderRadius: "8px", border: "1px solid #d1d1d1", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "300px" }}>
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
            <ExportButton label="Export to Excel" onClick={handleBillExport} />

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
              <div
                style={{
                  backgroundColor: "#d517f2c2",
                  width: "14px",
                  height: "14px",
                  borderRadius: "3px",
                  border: "1px solid #333",
                  marginLeft: "10px",
                }}
              ></div>
              <span>Job without PO</span>
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
              columnVisibilityModel={columnVisibilityModel}
              onColumnVisibilityModelChange={(newModel) => setColumnVisibilityModel(newModel)}
              getRowClassName={(params) => getRowClassName(params) ?? ""}
              title="Billing Planner Data"
              loading={loading}
              sx={dataGridSx}
              gridheight={500}
            />
          </div>
        )}

        {!loadingData && showResults && data?.length > 0 &&
          Array.isArray(invoicePendingData) && invoicePendingData.length > 0 && (
            <div style={{ textAlign: "left", alignItems: "center", marginTop: "30px" }}>

              <CustomDataGrid
                rows={invoicePendingData.map((r: any, i: number) => ({
                  id: r.id ?? i, // ✅ ensure every row has an ID
                  ...r,
                }))}
                columns={pendingInvoiceColumns}
                title="Invoice Pending Data"
                sx={dataGridSx}
              />
              <ExportButton label="Export to Excel" onClick={handleInvPenExport} />
            </div>

          )}
      </>
    </Box>
  );

};
export default RptBillingPlanner;