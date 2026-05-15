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
  Jobnumber: string;
  Hourlyrate: string;
  BilPreDayHrs: string;
  considered_working_day: string;
}

interface PreviousBillingDataRow extends PreviousBillingDataDto {
  id: number;
}

const PreviousBillingDataReport = () => {
  const [rows, setRows] = useState<PreviousBillingDataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const columns: GridColDef<PreviousBillingDataRow>[] = useMemo(
    () => [
      { field: "jobnumber", headerName: "Job Number",  flex: 1 , minWidth: 300 },
      { field: "hourlyrate", headerName: "Hourly Rate" , flex: 1 , minWidth: 100  },
      { field: "bilPrevDayHrs", headerName: "Bil PrevDay Hrs", flex: 1, minWidth: 180 },
      { field: "wipamount", headerName: "wipamount", flex: 1 },
      { field: "costcenter", headerName: "costcenter", flex: 1 },
          { field: "name", headerName: "Name", flex: 1 },
      {
        field: "considered_working_day",
        headerName: "Considered Working Day",
        flex: 1,
      },
    ],
    []
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get<PreviousBillingDataDto[]>(`${baseUrl}/api/Job/PreviousBillingData`);
      const mapped = (response.data || []).map((item, index) => ({
        id: index + 1,
        ...item,
      }));
      setRows(mapped);
    } catch (error) {
      console.error("Error loading previous billing data:", error);
      toast.error("Unable to load Previous Billing Data", { position: "top-right" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = useCallback(() => {
    if (rows.length === 0) {
      toast.warning("No data available to export", { position: "top-right" });
      return;
    }
    exporttoexcel(rows, "PreviousBillingData", "PreviousBillingData.xlsx");
    toast.success("Previous Billing Data exported", { position: "top-right" });
  }, [rows]);

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
