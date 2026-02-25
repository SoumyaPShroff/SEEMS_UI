import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { useBillingData } from './billplanhooks/useBillingData';
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
import SearchControl from "../../../../components/resusablecontrols/SearchControl";
import styled from "styled-components";
import {useManagerCostCenterSelect} from "../../../../components/utils/useMgrCostCenterSelect";

// ✅ Types
interface BillingData {
  id: number;
  jobNumber: string;
  poAmount: number;
  [key: string]: unknown;
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


interface SummaryResult {
  buckets: Record<string, TotalsRow>;
  total: TotalsRow;
}

const PageContainer = styled(Box)`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #ffffff;
`;

const ControlsRow = styled(Box)`
  display: flex;
  justify-content: flex-start;
  padding: 24px;
  margin-top: 88px;
  gap: 16px;
`;

const DateBar = styled.div`
  background-color: #81adde;
  color: #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px;
`;

const DateSelect = styled.select`
  padding: 5px;
  margin-left: 5px;
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
`;

const LoadingText = styled.p`
  color: #333;
  margin-top: 10px;
  font-weight: 500;
`;

const SummaryWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: center;
`;

const SummaryTable = styled.table`
  width: 70%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
`;

const SummaryHeadRow = styled.tr`
  background-color: #f2f2f2;
`;

const SummaryHeadCell = styled.th<{ $isGrandTotal?: boolean }>`
  padding: 6px;
  border: 1px solid #ccc;
  font-family: 'Segoe UI', Roboto, sans-serif;
  font-weight: bold;
  text-align: right;
  color: ${({ $isGrandTotal }) => ($isGrandTotal ? "rgb(57, 93, 194)" : "inherit")};
`;

const SummaryHeadCellLabel = styled.th`
  padding: 6px;
  border: 1px solid #ccc;
  font-family: 'Segoe UI', Roboto, sans-serif;
  text-align: left;
`;

const SummaryRowLabel = styled.td`
  font-weight: bold;
  text-align: left;
  padding: 6px 10px;
  border: 2px solid #ccc;
  font-family: 'Segoe UI', Roboto, sans-serif;
`;

const SummaryCell = styled.td<{ $isGrandTotal?: boolean; $isZero?: boolean }>`
  text-align: right;
  padding: 4px 8px;
  border: 2px solid #ccc;
  font-family: 'Segoe UI', Roboto, sans-serif;
  color: ${({ $isGrandTotal }) => ($isGrandTotal ? "#506dbdff" : "inherit")};
  font-weight: ${({ $isZero }) => ($isZero ? "normal" : "bold")};
`;

const SummaryTotalRow = styled.tr`
  background-color: #e6f0ff;
  font-weight: bold;
`;

const ChartsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  margin-top: 10px;
  margin-left: 20px;
`;

const ChartsRowWide = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  margin-left: 20px;
  align-items: stretch;
`;

const ChartCard = styled.div<{ $flex?: number; $height?: number }>`
  flex: ${({ $flex }) => $flex ?? 1};
  min-width: 0;
  background: #ffffff;
  border: 1px solid #d1d1d1;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  height: ${({ $height }) => ($height ? `${$height}px` : "auto")};
  display: flex;
`;

const ChartCardPadded = styled(ChartCard)`
  padding: 0;
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 20px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LegendGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LegendSwatch = styled.div<{ $color: string }>`
  background-color: ${({ $color }) => $color};
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid #333;
`;

const DataGridWrapper = styled.div`
  position: relative;
  width: 100%;
  margin-left: 10px;
`;

const PendingSection = styled.div`
  text-align: left;
  align-items: center;
  margin-top: 30px;
`;

const SummarySection: React.FC<{
  summary: SummaryResult | null;
  pendingSummary: SummaryResult | null;
}> = ({ summary, pendingSummary }) => {
  if (!summary) return null;
  const { buckets, total } = summary;

  const mainCategories = [
    "At Office Export",
    "At Office Domestic",
    "Onsite Domestic",
    "Not Invoiced",
  ];

  const renderRow = (label: string, row: TotalsRow) => (
    <tr key={label}>
      <SummaryRowLabel>{label}</SummaryRowLabel>
      {Object.keys(row).map((key) => {
        const isGrandTotal = key === "GrandTotal";
        const val = row[key as keyof TotalsRow];
        return (
          <SummaryCell
            key={key}
            $isGrandTotal={isGrandTotal}
            $isZero={val === 0}
          >
            {formatInLakhs(val)}
          </SummaryCell>
        );
      })}
    </tr>
  );

  return (
    <SummaryWrapper>
      <SummaryTable>
        <thead>
          <SummaryHeadRow>
            <SummaryHeadCellLabel>Category</SummaryHeadCellLabel>
            {Object.keys(total).map((key) => (
              <SummaryHeadCell
                key={key}
                $isGrandTotal={key === "GrandTotal"}
              >
                {key}
              </SummaryHeadCell>
            ))}
          </SummaryHeadRow>
        </thead>
        <tbody>
          {mainCategories
            .filter((label) => label !== "Not Invoiced")
            .map((label) => {
              const row = buckets[label] || initTotalsRow();
              return renderRow(label, row);
            })}

          <SummaryTotalRow>
            <SummaryRowLabel>Total</SummaryRowLabel>
            {Object.keys(total).map((key) => {
              const val = total[key as keyof TotalsRow];
              return (
                <SummaryCell key={key} $isZero={val === 0}>
                  {formatInLakhs(val)}
                </SummaryCell>
              );
            })}
          </SummaryTotalRow>

          {pendingSummary && renderRow("Not Invoiced", pendingSummary.total)}
        </tbody>
      </SummaryTable>
    </SummaryWrapper>
  );
};

const ChartsSection: React.FC<{
  data: BillingData[];
  totalDesignVA: number;
  wipSumData: number;
}> = ({ data, totalDesignVA, wipSumData }) => (
  <>
    <ChartsRow>
      <ChartCard $flex={4} $height={300}>
        <ProjectionVsTargetChart data={data} />
      </ChartCard>
      <ChartCard $flex={3} $height={300}>
        <SegmentWiseBillingChart data={data} />
      </ChartCard>
    </ChartsRow>
    <ChartsRowWide>
      <ChartCard>
        <ProjectManagerChart data={data} />
      </ChartCard>
      <ChartCard>
        <SalesManagerChart data={data} />
      </ChartCard>
      <ChartCardPadded>
        <DesignVsWipChart
          totalDesignVA={totalDesignVA}
          totalWip={wipSumData}
          targetAbs={53900000}
        />
      </ChartCardPadded>
    </ChartsRowWide>
  </>
);

const FiltersSection: React.FC<{
  searchText: string;
  onSearch: (val: string) => void;
  onExport: () => void;
}> = ({ searchText, onSearch, onExport }) => (
  <FilterBar>
    <FilterGroup>
      <Box sx={{ width: 400, marginLeft: "2px" }}>
        <SearchControl onChange={onSearch} value={searchText} label="Search" />
      </Box>
      <ExportButton label="Export to Excel" onClick={onExport} />
    </FilterGroup>
    <LegendGroup>
      <LegendSwatch $color="blue" />
      <span>Flag raised for current month</span>
      <LegendSwatch $color="#d517f2c2" />
      <span>Job without PO</span>
      <LegendSwatch $color="green" />
      <span>Invoiced</span>
      <LegendSwatch $color="red" />
      <span>PO Overdue</span>
    </LegendGroup>
  </FilterBar>
);

const BillingGridSection: React.FC<{
  rows: BillingData[];
  columns: GridColDef[];
  columnVisibilityModel: GridColumnVisibilityModel;
  onColumnVisibilityModelChange: (model: GridColumnVisibilityModel) => void;
  getRowClassName: (params: any) => string;
  loading: boolean;
}> = ({
  rows,
  columns,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  getRowClassName,
  loading,
}) => (
    <DataGridWrapper>
      <CustomDataGrid
        rows={rows}
        columns={columns}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        getRowClassName={(params) => getRowClassName(params) ?? ""}
        title="Billing Planner Data"
        loading={loading}
        sx={dataGridSx}
        gridheight={500}
      />
    </DataGridWrapper>
  );

const PendingInvoicesSection: React.FC<{
  rows: BillingData[];
  columns: GridColDef[];
  onExport: () => void;
}> = ({ rows, columns, onExport }) => (
  <PendingSection>
    <CustomDataGrid
      rows={rows.map((r: any, i: number) => ({
        id: r.id ?? i,
        ...r,
      }))}
      columns={columns}
      title="Invoice Pending Data"
      sx={dataGridSx}
    />
    <ExportButton label="Export to Excel" onClick={onExport} />
  </PendingSection>
);

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

const YEARS = Array.from({ length: 12 }, (_, i) => {
  const y = 2020 + i;
  return { value: y, label: String(y) };
});

const RptBillingPlanner: React.FC = () => {
  const { data, loading, fetchBillingData } = useBillingData();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const { selectedManager, selectedValue, managerOptions,
    handleManagerChange, } = useManagerCostCenterSelect(loginId, "billingplanner");
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [invoiceDict, setInvoiceDict] = useState<Set<string>>(new Set());
  const [searchText, setSearchText] = useState("");
  const [showResults, setShowResults] = useState(false); // New state to control rendering
  const [wipSumData, setWipSumData] = useState(0);
  const [totalDesignVA, setTotalDesignVA] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [invoicePendingData, setInvoicePendingData] = useState<BillingData[]>([]);
  const [pendingSummary, setPendingSummary] = useState<SummaryResult | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const { startdate, enddate } = useMemo(() => {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDateObj = new Date(year, month, 0);
    const end = `${year}-${String(month).padStart(2, "0")}-${String(
      endDateObj.getDate()
    ).padStart(2, "0")}`;
    return { startdate: start, enddate: end };
  }, [month, year]);

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

   // poDate: false,
    realisedDate: false,
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
    ndaValidity: false,
  };

  const [columnVisibilityModel, setColumnVisibilityModel] = useState(defaultVisibleColumns);
  const handleColumnVisibilityModelChange = useCallback(
    (model: GridColumnVisibilityModel) => {
      setColumnVisibilityModel((prev) => ({ ...prev, ...model }));
    },
    []
  );

  const filteredData = useMemo(() => {
    if (!searchText) return data;
    return data.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [data, searchText]);

  // ✅ Compute summary grouped by main categories (for pending invoices)
  const buildPendingSummary = (pendingData: BillingData[]) => {
    const buckets: Record<string, TotalsRow> = {};
    const total: TotalsRow = initTotalsRow();
    pendingData.forEach((r) => {
      const job = r.jobNumber || "";
      const enqType = (r as any).enquiryType || "";
      const typ = (r as any).type || "";
      const po = parseFloat(r.poAmount?.toString() || "0");
      const govtTender = (r as any).govt_tender || "";
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

  const handleGenerate = useCallback(async () => {
    if (!selectedManager) return;
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

      const pending = buildPendingSummary(pendingResponse.data);
      setPendingSummary(pending);
      setShowResults(true);
    } catch (error) {
      console.error("Error generating report:", error);
      setSummary(null);
      setShowResults(false);
    } finally {
      setLoadingData(false); // hide spinner
    }
  }, [enddate, fetchBillingData, selectedManager, startdate]);


  useEffect(() => {
    if (data && data.length > 0) {
      setSummary(buildSummaryFromData(data));

      const wipSum = data.reduce(
        (acc, item) => acc + ((item as any).wipAmount || 0),
        0
      );
      setWipSumData(wipSum);

      const designSum = data.reduce(
        (acc, item) => acc + ((item as any).poAmount || 0),
        0
      );
      setTotalDesignVA(designSum);
      setShowResults(true);
    }
  }, [data]);


  useEffect(() => {
    localStorage.setItem(
      "billingPlannerColumnVisibility",
      JSON.stringify(columnVisibilityModel)
    );
  }, [columnVisibilityModel]);

  const columns: GridColDef[] = useMemo(() => [
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 400, },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 300 },
    { field: "startDate", headerName: "Start Date", flex: 1,  minWidth: 110 },
    { field: "plannedEndDate", headerName: "Planned End Date", flex: 1, minWidth: 130 },
    { field: "totalHrs", headerName: "Total Hrs", flex: 1,  minWidth: 112 },
    { field: "plannedHrs", headerName: "Planned Hrs", flex: 1, minWidth: 130 },
    { field: "bilHrs_CurrentMonth", headerName: "BilHrs_CurrentMonth", flex: 1, minWidth: 230 },
    { field: "billPerctg_CurMonth", headerName: "BillPerctg_CurMonth", flex: 1, minWidth: 230 },
    { field: "projectComp_Perc", headerName: "ProjectComp_Perc", flex: 1, minWidth: 210 },
    { field: "updatedByPrevDay", headerName: "UpdatedByPrevDay", flex: 1, minWidth: 150 },
    { field: "billableECOHrs", headerName: "BillableECO", flex: 1, minWidth: 160 },
    { field: "eco", headerName: "ECO", flex: 1, minWidth: 110 },
    { field: "bilHrsPrevDay", headerName: "BilHrsPrevDay", flex: 1, minWidth: 180 },
    { field: "wipAmount", headerName: "WIPAmount", flex: 1, minWidth: 160 },
    { field: "enqType", headerName: "EnqType", flex: 1, minWidth: 135 },
    { field: "enquiryno", headerName: "Enquiry no", flex: 1, minWidth: 150 },
    { field: "govt_tender", headerName: "govt_tender", flex: 1, minWidth: 165 },
    { field: "estimatedHours", headerName: "Estimated Hrs", flex: 1, minWidth: 150 },
    { field: "poNumber", headerName: "PO Number", flex: 1, minWidth: 250 },
    { field: "hourlyRate", headerName: "HourlyRate", flex: 1, minWidth: 150 },
    { field: "poRcvd", headerName: "PoRcvd", flex: 1, minWidth: 130 },
    { field: "poAmount", headerName: "PO Amount", flex: 1, minWidth: 130 },
    { field: "billingType", headerName: "BillingType", flex: 1, minWidth: 155 },
    { field: "expectedDeliveryDate", headerName: "ExpectedDeliveryDate", flex: 1, minWidth: 220 },
    { field: "actualEndDate", headerName: "ActualEndDate", flex: 1, minWidth: 150 },
    { field: "nonBillableHrs", headerName: "Non Billable Hrs", flex: 1, minWidth: 160 },
    { field: "flagRaisedOn", headerName: "Flag RaisedOn", flex: 1, minWidth: 150 },
    { field: "totalBillableHrs", headerName: "Total Billable Hrs", flex: 1, minWidth: 150 },
    { field: "totalInvoicedHrs", headerName: "Total Invoiced Hrs", flex: 1, minWidth: 150 },
    { field: "totalInvoicedAmt", headerName: "Total InvoicedAmt", flex: 1, minWidth: 160 },
    { field: "type", headerName: "Type", flex: 1, minWidth: 110 },
    { field: "costCenter", headerName: "Cost Center", flex: 1, minWidth: 120 },
    { field: "projectManager", headerName: "Project Manager", flex: 1, minWidth: 150 },
    { field: "salesManager", headerName: "Sales Manager", flex: 1, minWidth: 150 },
    { field: "jobtitle", headerName: "Job Title", flex: 1, minWidth: 140 },
    { field: "rejectedHrs", headerName: "Rejected Hrs", flex: 1, minWidth: 140 },
    { field: "projectmanagerid", headerName: "projectmanagerid", flex: 1, minWidth: 100 },
  //  { field: "poDate", headerName: "PO Date", flex: 1, minWidth: 100 },
    { field: "realisedDate", headerName: "Realised Date", flex: 1, minWidth: 140 },
    { field: "ndaValidity", headerName: "NDA Validity", flex: 1, minWidth: 140 },
  ], []);

  const getRowClassName = (params: any): string => {
    const jobNo: string = params.row.jobNumber || "";
    const poRcvd: string = params.row.poRcvd || "";
    const dtStr: string = params.row.flagRaisedOn || "";
    const requestDateStr: string = params.row.realisedDate;
    const flagDate = new Date(dtStr);
    const key = `${jobNo}_${flagDate.getMonth() + 1}_${flagDate.getFullYear()}`;

    // 🟥 Case 1 — PO not received
    if (poRcvd === "NO" || poRcvd === "") {
      //new logic
      if (requestDateStr) {
        const currentDate = new Date();
        const requestDate = new Date(requestDateStr);
        const diffDays = Math.floor((currentDate.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
        // 🟠 PO delay > 7 days
        if (diffDays > 7) {
       //   return "row-purple";
          return "row-red";
        }
      }

      // 🟥 Default PO not received
    //  return "row-red";
        return "row-purple";
    }

    // 🟦 Case 2 — Flag date present
    if (dtStr) {
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

  const handleBillExport = useCallback(() => {
    exporttoexcel(filteredData, "BillingPlanner", "BillingPlanner-Data.xlsx");
    toast.success("✅ Billing Planner Data exported!", { position: "top-right" });
  }, [filteredData]);

  const handleInvPenExport = useCallback(() => {
    exporttoexcel(data, "PendingInvoices", "BillingPlanner-PendInv.xlsx");
    toast.success("✅ Pending Invoices exported!", { position: "top-right" });
  }, [data]);

  const pendingInvoiceColumns: GridColDef[] = useMemo(() => [
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 400 },
    { field: "startDate", headerName: "Start Date", flex: 1, minWidth: 120 },
    { field: "enddate", headerName: "End Date", flex: 1, minWidth: 120 },
    { field: "costCenter", headerName: "Cost Center", flex: 1, minWidth: 120},
    { field: "projectManager", headerName: "Project Manager", flex: 1, minWidth: 160 },
    { field: "flag_Raisedon", headerName: "Flag Raised Date", flex: 1, minWidth: 160 },
    { field: "totTimesheetHrs", headerName: "Total Timesheet Hrs", flex: 1, minWidth: 160 },
    { field: "approvedHrs", headerName: "Approved Hrs", flex: 1, minWidth: 140 },
    { field: "rateperhour", headerName: "Rate Per hr", flex: 1, minWidth: 120 },
    { field: "poDate", headerName: "PO Date", flex: 1, minWidth: 110 },
    { field: "poNumber", headerName: "PO Number", flex: 1, minWidth: 140 },
    { field: "unBilledAmount", headerName: "UnBilledAmt", flex: 1, minWidth: 170 },
    { field: "enquiryNo", headerName: "Enquiryno", flex: 1, minWidth: 150 },
    { field: "enquiryType", headerName: "Enquiry Type", flex: 1, minWidth: 130 },
    { field: "type", headerName: "Type", flex: 1, minWidth: 110 },
    { field: "govt_tender", headerName: "govt_tender", flex: 1, minWidth: 160 },
    { field: "poAmount", headerName: "PO Amount", flex: 1, minWidth: 150 },
  ], []);

  const hasResults = !loadingData && showResults && data?.length > 0;
  const hasPendingInvoices =
    hasResults && Array.isArray(invoicePendingData) && invoicePendingData.length > 0;

  return (
    <PageContainer>
      <ControlsRow>
        <Box sx={{ width: 300 }}>
          <SelectControl
            name="costcenter"
            label="Select Manager"
            value={selectedValue}
            width="200px"
            options={managerOptions}
            onChange={(e: any) => handleManagerChange(e.target.value)}
          />
        </Box>
      </ControlsRow>
      {/* Date Range + Generate Button */}
      <DateBar>
        <label>
          Month:
          <DateSelect
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </DateSelect>
        </label>

        <label>
          Year:
          <DateSelect
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </DateSelect>
        </label>

        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={handleGenerate}
        >
          Generate
        </Button>
      </DateBar>

      {/* ✅ Loading Spinner */}
      {loadingData && (
        <LoadingWrapper>
          <CircularProgress size={60} />
          <LoadingText>Loading data...</LoadingText>
        </LoadingWrapper>
      )}

      {/* ✅ Show results only after data is ready */}
      <>
        {/* <div>{renderSummaryTable()}</div> */}
        {hasResults && (
          <SummarySection summary={summary} pendingSummary={pendingSummary} />
        )}
        {/* === Row 1: 3 charts === */}
        {hasResults && (
          <ChartsSection
            data={data}
            totalDesignVA={totalDesignVA}
            wipSumData={wipSumData}
          />
        )}
        {hasResults && (
          <FiltersSection
            searchText={searchText}
            onSearch={setSearchText}
            onExport={handleBillExport}
          />
        )}

        {hasResults && (
          <BillingGridSection
            rows={filteredData}
            columns={columns}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
            getRowClassName={getRowClassName}
            loading={loading}
          />
        )}

        {hasPendingInvoices && (
          <PendingInvoicesSection
            rows={invoicePendingData}
            columns={pendingInvoiceColumns}
            onExport={handleInvPenExport}
          />
        )}
      </>
    </PageContainer>
  );

};
export default RptBillingPlanner;
