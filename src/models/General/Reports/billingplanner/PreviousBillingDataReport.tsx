import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Button } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import CustomDataGrid2 from "../../../../components/resusablecontrols/CustomDataGrid2";
import { baseUrl } from "../../../../const/BaseUrl";
import ExportButton from "../../../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../../../components/utils/exporttoexcel";

interface PreviousBillingDataDto {
  jobnumber?: string;
  hourlyrate?: string | number;
  bilPrevDayHrs?: string | number;
  considered_working_day?: string;
  wipamount?: string | number;
  costcenter?: string;
  name?: string;
}

interface PreviousBillingDataRow extends PreviousBillingDataDto {
  id: number;
}

const PreviousBillingDataReport = () => {
  const [rows, setRows] = useState<PreviousBillingDataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const columns: GridColDef<PreviousBillingDataRow>[] = useMemo(
    () => [
      { field: "jobnumber", headerName: "Job Number",  flex: 1 , minWidth: 300 },
      { field: "hourlyrate", headerName: "Hourly Rate" , flex: 1   },
      { field: "bilPrevDayHrs", headerName: "Bil PrevDay Hrs", flex: 1 , minWidth: 180 },
      { field: "wipamount", headerName: "WipAmount", flex: 1 },
      { field: "costcenter", headerName: "Costcenter", flex: 1 },
          { field: "name", headerName: "Name", flex: 1 },
      {
        field: "considered_working_day",
        headerName: "Working Day",
        flex: 1,
      },
    ],
    []
  );
  

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [userRoleRes, employeeRes] = await Promise.all([
        axios.get(`${baseUrl}/api/Home/UserDesignation/${loginId}`),
        axios.get(`${baseUrl}/api/Home/EmployeeDetails/${loginId}`),
      ]);

      const userRole = userRoleRes.data;
      const roleCheck = await axios.get<boolean>(
        `${baseUrl}/api/Home/UserRoleInternalRights/${userRole}/billingplanner`
      );
      const hasCompleteRights = roleCheck.data === true;
      const employee = Array.isArray(employeeRes.data) ? employeeRes.data[0] : employeeRes.data;
      const loggedInCostCenter = String(
        employee?.costcenter ?? employee?.costCenter ?? employee?.Costcenter ?? employee?.CostCenter ?? ""
      ).trim();

      const response = await axios.get<PreviousBillingDataDto[]>(`${baseUrl}/api/Job/PreviousBillingData`, {
        params: hasCompleteRights ? undefined : { costcenter: loggedInCostCenter },
      });

      const mapped = (response.data || []).map((item, index) => ({
        id: index + 1,
        jobnumber: item.jobnumber ?? "",
        hourlyrate: item.hourlyrate ?? "",
        bilPrevDayHrs: item.bilPrevDayHrs ?? "",
        wipamount: item.wipamount ?? "",
        costcenter: item.costcenter ?? "",
        name: item.name ?? "",
        considered_working_day: item.considered_working_day ?? "",
      }));
      setRows(mapped);
    } catch (error) {
      console.error("Error loading previous billing data:", error);
      toast.error("Unable to load Previous Billing Data", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  }, [loginId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(() => {
    if (rows.length === 0) {
      toast.warning("No data available to export", { position: "top-right" });
      return;
    }

    const totalWipAmount = rows.reduce((sum, row) => {
      const value = Number(row.wipamount ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);

    const exportRows = [
      ...rows,
      {
        id: rows.length + 1,
        jobnumber: "Total",
        hourlyrate: "",
        bilPrevDayHrs: "",
        wipamount: totalWipAmount,
        costcenter: "",
        name: "",
        considered_working_day: "",
      },
    ];

    exporttoexcel({
      data: exportRows,
      sheetName: "PreviousBillingData",
      fileName: "PreviousBillingData.xlsx",
      columns: columns.map(({ field, headerName }) => ({
        field,
        headerName,
      })),
    });
    toast.success("Previous Billing Data exported", { position: "top-right" });
  }, [columns, rows]);

  return (
    <Box sx={{ padding: "20px", mt: "85px", ml: "10px" }}>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button variant="contained" size="small" onClick={fetchData}>
          Load Data
        </Button>
        <ExportButton label="Export to Excel" onClick={handleExport} />
      </Box>
      <CustomDataGrid2
        rows={rows}
        columns={columns}
        title="Previous Billing Data - costcenterwise"
        loading={loading}
        gridHeight={550}
      />
    </Box>
  );
};

export default PreviousBillingDataReport;