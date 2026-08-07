import React, { useEffect, useState } from "react";
import { Box,  Button, IconButton,  Dialog,  DialogTitle,  DialogContent,  DialogActions,
  TextField,  Typography} from "@mui/material";
import {   type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../utils/exporttoexcel";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../const/BaseUrl";
import { useRoleAccess } from "../../utils/useRoleAccess";

export interface PurchaseOrderData {
  id?: number | string;
  itemno?: string;
  pponumber: string;
  penquiryno: string;
  pquoteno: string;
  layQty?: string | number;
  layRateperhr?:string | number;
  analyQty?: string | number;
  analyRateperhr?:string | number;
  vaQty?: string | number;
  vaRateperhr?:string | number;
  npiQty?: string | number;
  npiRateperhr?: string | number;
  dfmQty?: string | number;
  dfmRateperhr?: string | number;
  libQty?: string | number;
  libRateperhr?:  string | number;
  pcurrency_id?: number | string;
  ppoamount: string | number;
  pbalanceamt?: string | number;
  podate?: string;
  ppaymentterm?: string;
  pconvrate?: string | number;
  pcomments?: string;
  pcreatedby?: string;
  pupdatedby?: string;
  sez?: string;

  onsite?: string | number;
  onsiteQty?: string | number;
  onsiteRateperhr?: string | number;

  pouploadedfile?: string;
  pemailid?: string;
  pphoneno?: string;
  approvalstatus?: string;

}

const PurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<PurchaseOrderData[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRemarks, setDeleteRemarks] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false);
  //const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const { hasAccess: isAdminUser } = useRoleAccess(loginId, "adminuser");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PurchaseOrderData[]>(`${baseUrl}/api/Sales/poenquiries`);
      const data = Array.isArray(response.data) ? response.data : [];
      // Ensure each row has a unique 'id' for the DataGrid
      const normalizedRows = data.map((row: PurchaseOrderData, index: number) => ({
        ...row,
        // id: row.id || row.itemno || index + 1,
        id: Number(row.id) || index + 1,

      }));
      setRows(normalizedRows);
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      toast.error("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDeleteDialog = (id: number | string) => {
    setPendingDeleteId(id);
    setDeleteRemarks("");
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setDeleteRemarks("");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    const sessionUserId = sessionStorage.getItem("SessionUserID") || "guest";

    try {
      await axios.post(
        `${baseUrl}/api/Sales/DeletePO/${pendingDeleteId}`,
        null,
        {
          params: {
            sessionUserId,
            delRemarks: deleteRemarks
          }
        }
      );
      toast.success("PO deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete PO");
    } finally {
      handleCancelDelete();
    }
  };

  const handleEdit = (po: PurchaseOrderData) => {
    navigate(`/Home/AddEditPO/${po.id}`, { state: { po } });
  };

  const columns: GridColDef<PurchaseOrderData>[] = [
    { field: "pponumber", headerName: "PO Number", flex: 1, minWidth: 150 },
    { field: "penquiryno", headerName: "Enquiry", flex: 1, minWidth: 130 },
    { field: "ppoamount", headerName: "PO Amt", flex: 1, minWidth: 130 },
    { field: "pbalanceamt", headerName: "Bal Amt", flex: 1, minWidth: 130 },
    { field: "podate", headerName: "PO Date", flex: 1, minWidth: 140 },

    { field: "pemailid", headerName: "Email ID", flex: 1, minWidth: 160 },
    { field: "pphoneno", headerName: "Phone No", flex: 1, minWidth: 130 },
     {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          {isAdminUser && (
            <IconButton color="error" onClick={() => params.row.id && openDeleteDialog(params.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      )
    },
        { field: "ppaymentterm", headerName: "Payment Terms", flex: 1, minWidth: 190 },

    { field: "pcomments", headerName: "Comments", flex: 1, minWidth: 200 },
    { field: "pquoteno", headerName: "Quote", flex: 1, minWidth: 120 }
  ];

  const handleExport = () => {
    const exportColumns = columns
      .filter((col) => col.field !== "actions")
      .map((col) => ({ field: col.field, headerName: (col.headerName as string) ?? col.field }));

    exporttoexcel({
      data: rows,
      sheetName: "PurchaseOrders",
      fileName: "Purchase_Orders.xlsx",
      columns: exportColumns,
    });
  };

  return (
    <Box sx={{ p: 3, mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#1b4f91" }}>
        Purchase Order Management
      </Typography>
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="contained"
          onClick={() => navigate("/Home/AddEditPO")}
        >
          New PO
        </Button>
        <ExportButton
          label={loading ? "Exporting..." : "Export to Excel"}
          onClick={handleExport}
          disabled={loading || rows.length === 0}
        />
      </Box>
      <CustomDataGrid2
        rows={rows}
        columns={columns}
        title="Purchase Orders"
        loading={loading}
        gridHeight={400}
        rowHeight={42}
        searchableFields={['pponumber', 'penquiryno', 'pquoteno']}
        placeholder="Search POs (Number, Enquiry, Quote)"
        onRowClick={handleEdit}
        getRowClassName={(params) => (params.row.approvalstatus === "NO" ? "row-not-approved" : "")}
      />

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete PO?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this Purchase Order? This action cannot be undone.
          </Typography>
          <TextField
            label="Remarks (Optional)"
            multiline
            minRows={3}
            fullWidth
            value={deleteRemarks}
            onChange={(e) => setDeleteRemarks(e.target.value)}
            placeholder="Enter remarks for deletion..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrder;
