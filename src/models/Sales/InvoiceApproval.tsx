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

interface PendingInvoiceRow {
  id: number | string;
  invoiceCount: number | string;
  invoiceNo?: string;
  jobNumber?: string;
  customerName?: string;
  poAmount?: string | number;
  invoiceDate?: string;
  approvalStatus?: string;
  projMgrApproved?: boolean;
  salesMgrApproved?: boolean;
  projectManagerName?: string;
  salesManagerName?: string;
}

const InvoiceApproval: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PendingInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const sessionUserId = sessionStorage.getItem("SessionUserID") || "";
      const response = await axios.get<PendingInvoiceRow[]>(`${baseUrl}/api/Sales/PendingInvoiceApprovals`, {
        params: { sessionUserId },
      });
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(data.map((row: any, index: number) => ({ ...row, id: row.invoiceCount ?? index + 1 })));
    } catch (error) {
      console.error("Error loading pending invoice approvals:", error);
      toast.error("Failed to load pending invoice approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: GridColDef<PendingInvoiceRow>[] = [
    { field: "invoiceNo", headerName: "Invoice No", flex: 1, minWidth: 130 },
    { field: "jobNumber", headerName: "Job Number", flex: 1, minWidth: 140 },
    { field: "customerName", headerName: "Customer", flex: 1, minWidth: 160 },
    { field: "poAmount", headerName: "Invoice Amount", flex: 1, minWidth: 140 },
    { field: "invoiceDate", headerName: "Invoice Date", flex: 1, minWidth: 140 },
    { field: "projectManagerName", headerName: "Project Manager", flex: 1, minWidth: 160, valueFormatter: (value) => value || "-" },
    { field: "salesManagerName", headerName: "Sales Manager", flex: 1, minWidth: 160, valueFormatter: (value) => value || "-" },
    {
      field: "projMgrApproved",
      headerName: "PM Approval",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Approved" : "Pending"}
          color={params.value ? "success" : "warning"}
          size="small"
        />
      ),
    },
    {
      field: "salesMgrApproved",
      headerName: "Sales Mgr Approval",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Approved" : "Pending"}
          color={params.value ? "success" : "warning"}
          size="small"
        />
      ),
    },
    {
      field: "approvalStatus",
      headerName: "Status",
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const isPending = params.value !== "YES";
        return (
          <Chip
            label={isPending ? "Pending Approval" : "Approved"}
            color={isPending ? "warning" : "success"}
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (isPending) navigate(`/Home/InvoiceApprovalDetails/${params.row.invoiceCount}`);
            }}
            sx={{ cursor: isPending ? "pointer" : "default" }}
          />
        );
      },
    },
  ];

  const handleExport = () => {
    const exportRows = rows.map((row) => ({
      ...row,
      projMgrApproved: row.projMgrApproved ? "Approved" : "Pending",
      salesMgrApproved: row.salesMgrApproved ? "Approved" : "Pending",
      approvalStatus: row.approvalStatus === "YES" ? "Approved" : "Pending Approval",
    }));

    const exportColumns = columns.map((col) => ({ field: col.field, headerName: (col.headerName as string) ?? col.field }));

    exporttoexcel({
      data: exportRows,
      sheetName: "Invoice Approvals",
      fileName: "Invoice_Approvals.xlsx",
      columns: exportColumns,
    });
  };

  return (
    <Box sx={{ p: 3, mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#1b4f91" }}>
        Invoice Approval
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
        title="Invoices Pending Approval"
        loading={loading}
        gridHeight={450}
        rowHeight={42}
        searchableFields={["invoiceNo", "jobNumber", "customerName"]}
        placeholder="Search Invoices (Number, Job, Customer)"
      />
    </Box>
  );
};

export default InvoiceApproval;
