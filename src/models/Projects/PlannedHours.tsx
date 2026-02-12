import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { FaSave } from "react-icons/fa";
import { toast } from "react-toastify";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import YearMonthFilter from "../../components/utils/YearMonthFilter";
import { useManagerCostCenterSelect } from "../../components/utils/useMgrCostCenterSelect";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";
import EditableGrid, { type EditableGridColumn, } from "../../components/resusablecontrols/EditableGrid";
import StandardPageLayout, { StandardPageCard, } from "../../components/resusablecontrols/StandardPageLayout";

type Filters = {
  month: number;
  year: number;
  managerCostCenter: string;
};

type PlannedHoursRow = {
  id: string;
  jobNumber: string;
  customer: string;
  projectManager: string;
  startDate: string;
  endDate: string;
  efforts: number;
  billedHrs: number;
  balanceHrs: number;
 // plannedHours: number | "";
  monthlyHrs?: number; 
  remarks: string;
};

type SavePayload = {
  jobNumber: string;
  month: string;
  monthlyHrs: number;
  remarks: string;
};

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #0f172a;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #334155;
    transform: translateY(-1px);
    box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  color: #64748b;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 200px;
`;

const GRID_COLUMNS: EditableGridColumn<PlannedHoursRow>[] = [
  { field: "jobNumber", headerName: "Job Number", flex: 4.5, editable: false },
  { field: "customer", headerName: "Customer", flex: 4, editable: false },
  { field: "projectManager", headerName: "Project Manager", flex: 2.5, editable: false },
  { field: "startDate", headerName: "Start Date", editable: false },
  { field: "endDate", headerName: "End Date", editable: false },
  { field: "efforts", headerName: "Efforts", flex: 1.5, editable: false },
  { field: "billedHrs", headerName: "Billed Hrs", flex: 1.6, editable: false },
  { field: "balanceHrs", headerName: "Bal Hrs", flex: 1.4, editable: false },
  {
    //field: "plannedHours",
    field: "monthlyHrs",
    headerName: "Planned Hrs",
    flex: 1.8,
    editable: true,
    editorType: "textcontrol",
    inputType: "number",
     cellClassName: (params) =>
    Number(params.value) > Number(params.row.balanceHrs)
      ? "invalid-cell editable-grid-cell"
      : "editable-grid-cell",
  },
  {
    field: "remarks",
    headerName: "Remarks",
    flex: 4,
    editable: true,
    editorType: "textcontrol",
    inputType: "text",
  },
];

const initialFilters = (): Filters => ({
  month: new Date().getMonth() + 1,
 //month: `${filters.year}-${String(filters.month).padStart(2, "0")}-01`,
  year: new Date().getFullYear(),
  managerCostCenter: "",
});

const getMonthDateRange = (year: number, month: number) => {
  const monthText = String(month).padStart(2, "0");
  const startdate = `${year}-${monthText}-01`;
  const enddate = `${year}-${monthText}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
  return { startdate, enddate };
};

const normalizeRows = (data: PlannedHoursRow[]) =>
  data.map((item) => ({
    ...item,
    id: item.id || item.jobNumber,
   monthlyHrs: item.monthlyHrs ??   ""
  }));

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

async function savePlannedHours(rows: PlannedHoursRow[], filters: Filters) {

  const monthStr = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;

  // const payload: SavePayload[] = rows.map((row) => ({
  //   jobNumber: row.jobNumber,
  //   month: monthStr,
  //   monthlyHrs: toNumber(row.monthlyHrs),
  //   remarks: row.remarks ?? "",
  // }));
    const payload: SavePayload[] = rows
    // 🚫 skip monthlyHrs = 0 or empty
    .filter((row) => toNumber(row.monthlyHrs) > 0)
    .map((row) => ({
      jobNumber: row.jobNumber,
      month: monthStr,
      monthlyHrs: toNumber(row.monthlyHrs),
      remarks: row.remarks ?? "",
    }));

  console.log("PAYLOAD", payload);

  await axios.post(`${baseUrl}/api/Job/UpdatePlannedHours`, payload);
}

export default function PlannedHours() {
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const {
    selectedManager,
    selectedValue,
    managerOptions,
    handleManagerChange,
  } = useManagerCostCenterSelect(loginId, "plannedhours");

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [rows, setRows] = useState<PlannedHoursRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCellValidationError, setHasCellValidationError] = useState(false);
  const lastInvalidToastKeyRef = useRef<string>("");
  const invalidRow = useMemo(
    () => rows.find((row) => toNumber(row.monthlyHrs) > toNumber(row.balanceHrs)),
    [rows]
  );
  const hasInvalidPlannedHours = Boolean(invalidRow);

  useEffect(() => {
    if (!selectedManager) return;

    setFilters((prev) => ({
      ...prev,
      managerCostCenter: selectedManager.costcenter,
    }));
  }, [selectedManager]);

  const loadData = async () => {
    if (!filters.managerCostCenter) {
      setRows([]);
      return;
    }

    setIsLoading(true);
    try {
      const { year, month, managerCostCenter } = filters;
      const params = new URLSearchParams(getMonthDateRange(year, month));

      if (managerCostCenter && managerCostCenter !== "All") {
        params.append("costcenter", managerCostCenter);
      }

      const url = `${baseUrl}/api/Job/PlannedHours?${params.toString()}`;
      const response = await axios.get<PlannedHoursRow[]>(url);
      setRows(normalizeRows(response.data));
    } catch (error) {
      console.error("Failed to load planned hours:", error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [filters.month, filters.year, filters.managerCostCenter]);

  const handleRowsChange = useCallback((nextRows: PlannedHoursRow[]) => {
    const nextInvalidRow = nextRows.find(
      (row) => toNumber(row.monthlyHrs) > toNumber(row.balanceHrs)
    );

    if (!nextInvalidRow) {
      lastInvalidToastKeyRef.current = "";
      setRows(nextRows);
      return;
    }

    const toastKey = `${nextInvalidRow.jobNumber}|${toNumber(nextInvalidRow.monthlyHrs)}|${toNumber(nextInvalidRow.balanceHrs)}`;
    if (lastInvalidToastKeyRef.current !== toastKey) {
      toast.error(
        `Planned hours (${toNumber(nextInvalidRow.monthlyHrs)}) cannot exceed balance hours (${toNumber(nextInvalidRow.balanceHrs)}) for ${nextInvalidRow.jobNumber}.`,
        { toastId: toastKey }
      );
      lastInvalidToastKeyRef.current = toastKey;
    }

    setRows(nextRows);
  }, []);

const handleValidateCellEdit = useCallback(
  ({ row, field, value }: { row: PlannedHoursRow; field: string; value: unknown }) => {
    if (field !== "monthlyHrs") return null;

    const planned = toNumber(value);
    const bal = toNumber(row.balanceHrs);

    if (planned > bal) {
      const toastKey = `${row.jobNumber}-${planned}-${bal}`;

      if (lastInvalidToastKeyRef.current !== toastKey) {
        toast.error(
          `Planned hours (${planned}) cannot exceed balance hours (${bal}) for ${row.jobNumber}`
        );
        lastInvalidToastKeyRef.current = toastKey;
      }

      setHasCellValidationError(true);
      return "invalid";
    }

    lastInvalidToastKeyRef.current = "";
    setHasCellValidationError(false);
    return null;
  },
  []
);

  const handleUpdate = async () => {
    if (invalidRow) {
      toast.error(`Planned hours cannot exceed balance hours for ${invalidRow.jobNumber}.`);
      return;
    }
    setIsSaving(true);
    try {
      await savePlannedHours(rows, filters);
      await loadData();
      toast.success("Planned hours updated successfully.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StandardPageLayout
      title="Planned Hours"
      subtitle="Project planning and monthly hour allocation"
      actions={
        <SaveButton
          onClick={handleUpdate}
          disabled={isSaving || rows.length === 0 || hasInvalidPlannedHours || hasCellValidationError}
        >
          <FaSave style={{ marginRight: "8px" }} />
          {isSaving ? "Updating..." : "Update"}
        </SaveButton>
      }
      filters={
        <FiltersRow>
          <Box sx={{ width: 300 }}>
            <SelectControl
              name="costcenter"
              label="Select Manager"
              value={selectedValue}
              options={managerOptions}
              onChange={(e: any) => handleManagerChange(e.target.value)}
            />
          </Box>
          <Box sx={{ width: 300 }}>
            <YearMonthFilter
              filters={{ month: filters.month, year: filters.year }}
              onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
            />
          </Box>
        </FiltersRow>
      }
    >
      <StandardPageCard>
        {isLoading ? (
          <EmptyState>
            <CircularProgress />
            Loading...
          </EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>
            No records found for the selected manager and period.
          </EmptyState>
        ) : (
          <EditableGrid
            rows={rows}
            columns={GRID_COLUMNS}
            onRowsChange={(nextRows) => handleRowsChange(nextRows as PlannedHoursRow[])}
            getRowId={(row) => row.id || row.jobNumber}
            onValidateCellEdit={handleValidateCellEdit}

          />
        )}
      </StandardPageCard>
    </StandardPageLayout>
  );
}
