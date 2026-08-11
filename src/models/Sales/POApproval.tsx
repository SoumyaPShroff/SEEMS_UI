import { useEffect, useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { type GridColDef } from "@mui/x-data-grid";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../utils/exporttoexcel";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../const/BaseUrl";

interface PendingPORow {
  id: number | string;
  pponumber: string;
  penquiryno: string;
  ppoamount: string | number;
  podate?: string;
  ppaymentterm?: string;
  approvalstatus?: string;
}

const POApproval: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PendingPORow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PendingPORow[]>(`${baseUrl}/api/Sales/PendingPOApprovals`);
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data.map((row, index) => ({ ...row, id: row.id ?? index + 1 })));
    } catch (error) {
      console.error("Error loading pending PO approvals:", error);
      toast.error("Failed to load pending PO approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: GridColDef<PendingPORow>[] = [
    { field: "pponumber", headerName: "PO Number", flex: 1, minWidth: 150 },
    { field: "penquiryno", headerName: "Enquiry", flex: 1, minWidth: 130 },
    { field: "ppoamount", headerName: "PO Amount", flex: 1, minWidth: 130 },
    { field: "podate", headerName: "PO Date", flex: 1, minWidth: 140 },
    { field: "ppaymentterm", headerName: "Payment Terms", flex: 1, minWidth: 180 },
    {
      field: "approvalstatus",
      headerName: "Status",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value === "YES" ? "Approved" : "Pending Approval"}
          color={params.value === "YES" ? "success" : "warning"}
          size="small"
        />
      ),
    },
  ];

  const handleExport = () => {
    const exportRows = rows.map((row) => ({
      ...row,
      approvalstatus: row.approvalstatus === "YES" ? "Approved" : "Pending Approval",
    }));

    const exportColumns = columns
      .filter((col) => col.field !== "actions")
      .map((col) => ({ field: col.field, headerName: (col.headerName as string) ?? col.field }));

    exporttoexcel({
      data: exportRows,
      sheetName: "PO Approvals",
      fileName: "PO_Approvals.xlsx",
      columns: exportColumns,
    });
  };

  return (
    <Box sx={{ p: 3, mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#1b4f91" }}>
        PO Approval
      </Typography>
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <ExportButton
          label={loading ? "Exporting..." : "Export to Excel"}
          onClick={handleExport}
          disabled={loading || rows.length === 0}
        />
      </Box>
      <CustomDataGrid2
        rows={rows}
        columns={columns}
        title="Purchase Orders Pending Approval"
        loading={loading}
        gridHeight={450}
        rowHeight={42}
        searchableFields={["pponumber", "penquiryno"]}
        placeholder="Search POs (Number, Enquiry)"
        onRowClick={(row) => navigate(`/Home/POApprovalDetails/${row.id}`)}
      />
    </Box>
  );
};

export default POApproval;
