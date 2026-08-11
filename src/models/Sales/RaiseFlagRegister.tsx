import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, Button, Paper, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { baseUrl } from "../../const/BaseUrl";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";

type RaiseFlagRow = {
  jobnumber: string;
  flagRaiseOn: string | null;
  projectApprovedHrs: number | null;
  ecoApprovedHrs: number | null;
  invoiceAmount: number | null;
  flagStatus: string | null;
  projectmanager: string;
  invoiceDate: string | null;
  isInvoiced: boolean;
  emailId: string | null;
  phoneNo: string | null;
  poComments: string | null;
  paymentTerms: string | null;
};

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
};
const monthEnd = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
};

// Encodes the legacy invoicing.aspx deep-link format ("<jobnumber> TotalHrs=<n> Click=<True|False>"),
// consumed by AddEditInvoice.tsx on mount to auto-select the job/invoice and Add/Edit mode.
const buildInvoiceDeepLink = (jobNumber: string, totalHrs: number, isAdd: boolean) =>
  `/Home/AddEditInvoice?jobnumber=${encodeURIComponent(`${jobNumber} TotalHrs=${totalHrs} Click=${isAdd}`)}`;

const RaiseFlagRegister = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<RaiseFlagRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(monthEnd());

  const loadData = async (from = fromDate, to = toDate) => {
    if (!from || !to) {
      toast.error("Please select both From and To dates.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get<RaiseFlagRow[]>(
        `${baseUrl}/api/Sales/RaiseFlagInvoiceRegister/${encodeURIComponent(from)}/${encodeURIComponent(to)}`
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load Raise Flag Register:", error);
      toast.error("Unable to load the Raise Flag Register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sp_RaiseFlagRegisterRpt can return the same job more than once (its underlying joins fan out on
  // a related table), so drop rows that are exact duplicates of one already seen before splitting.
  const dedupeRows = (input: RaiseFlagRow[]) => {
    const seen = new Set<string>();
    return input.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const pendingRows = dedupeRows(rows.filter((r) => !r.isInvoiced)).map((r, index) => ({
    id: `${r.jobnumber}-${index}`,
    ...r,
  }));
  const invoicedRows = dedupeRows(rows.filter((r) => r.isInvoiced)).map((r, index) => ({
    id: `${r.jobnumber}-${index}`,
    ...r,
  }));

  const pendingColumns: GridColDef[] = [
    { field: "jobnumber", headerName: "Job Number", flex: 1, minWidth: 250 },
    { field: "flagRaiseOn", headerName: "Flag Raised On", flex: 1, minWidth: 120 },
    { field: "projectApprovedHrs", headerName: "Project Approved Hrs", flex: 1, minWidth: 140 },
    { field: "ecoApprovedHrs", headerName: "ECO Approved Hrs", flex: 1, minWidth: 140 },
    { field: "invoiceAmount", headerName: "Invoice Amt", flex: 1, minWidth: 120 },
    { field: "projectmanager", headerName: "Project Manager", flex: 1, minWidth: 150 },

    { field: "paymentTerms", headerName: "Payment Terms", flex: 1, minWidth: 160 },
     {
      field: "addInvoice",
      headerName: "Add Invoice",
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <a
          href="#"
          style={{ color: "#1976d2", cursor: "pointer", fontWeight: 700 }}
          onClick={(e) => {
            e.preventDefault();
            const totalHrs = (params.row.projectApprovedHrs || 0) + (params.row.ecoApprovedHrs || 0);
            navigate(buildInvoiceDeepLink(params.row.jobnumber, totalHrs, true));
          }}
        >
          Add Invoice
        </a>
      ),
    },
        { field: "flagStatus", headerName: "Flag Status", flex: 1, minWidth: 160 },
    { field: "emailId", headerName: "Email Id", flex: 1, minWidth: 180 },
    { field: "phoneNo", headerName: "Phone No", flex: 1, minWidth: 140 },
    { field: "poComments", headerName: "Comments", flex: 1, minWidth: 180 }

  ];

  const invoicedColumns: GridColDef[] = [
    { field: "jobnumber", headerName: "Job Number", flex: 1, minWidth: 250 },
    { field: "flagRaiseOn", headerName: "Flag Raised On", flex: 1, minWidth: 120 },
    { field: "projectApprovedHrs", headerName: "Project Approved Hrs", flex: 1, minWidth: 140 },
    { field: "ecoApprovedHrs", headerName: "ECO Approved Hrs", flex: 1, minWidth: 140 },
    { field: "invoiceAmount", headerName: "Invoice Amt", flex: 1, minWidth: 120 },
    { field: "projectmanager", headerName: "Project Manager", flex: 1, minWidth: 190 },
    { field: "invoiceDate", headerName: "Invoice Date", flex: 1, minWidth: 120 },
        { field: "paymentTerms", headerName: "Payment Terms", flex: 1, minWidth: 130 },
  
      {
      field: "editInvoice",
      headerName: "Edit Invoice",
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <a
          href="#"
          style={{ color: "#e08a00", cursor: "pointer", fontWeight: 700 }}
          onClick={(e) => {
            e.preventDefault();
            navigate(buildInvoiceDeepLink(params.row.jobnumber, 0, false));
          }}
        >
          Edit Invoice
        </a>
      ),
    },
        { field: "flagStatus", headerName: "Flag Status", flex: 1, minWidth: 150 },
    { field: "emailId", headerName: "Email Id", flex: 1, minWidth: 180 },
    { field: "phoneNo", headerName: "Phone No", flex: 1, minWidth: 140 },
    { field: "poComments", headerName: "Comments", flex: 1, minWidth: 180 },

  ];

  return (
    <Box
      sx={{
        p: { xs: 1, md: 1.5 },
        mt: 15,
        width: "100%",
        maxWidth: 1350,
        mx: "auto",
        background: "radial-gradient(circle at top right, #ecf4ff 0%, #f7fbff 42%, #eef6ff 100%)",
        borderRadius: 2,
      }}
    >
      <Typography
        sx={{
          mb: 0.8,
          fontSize: { xs: "1rem", md: "1.5rem" },
          fontWeight: 700,
          color: "#1b4f91",
          alignContent: "center",
          textAlign: "center",
          fontFamily: "Arial",
        }}
      >
        Raise Flag Register
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 0.7,
          borderRadius: 1,
          border: "1px solid #d3e3fa",
          background: "linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%)",
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <TextField
              label="Raise Flag Date From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: "#fff", minWidth: 170 }}
            />
            <TextField
              label="Raise Flag Date To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: "#fff", minWidth: 170 }}
            />
            <Button
              variant="contained"
              onClick={() => loadData()}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                background: "linear-gradient(135deg, #1f62b2 0%, #0f7dd6 100%)",
                boxShadow: "0 8px 16px rgba(20, 93, 178, 0.28)",
                "&:hover": {
                  background: "linear-gradient(135deg, #1a5598 0%, #0c6dbc 100%)",
                },
                height: 32,
              }}
            >
              Filter
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/Home/AddEditInvoice")}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                height: 32,
              }}
            >
              Add/Edit Invoice
            </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* <Typography sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.5, fontSize: "1rem" }}>
            Pending (Not Yet Invoiced)
          </Typography> */}
          {pendingRows.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed #a8bfdc",
                borderRadius: 2,
                p: 1.5,
                textAlign: "center",
                color: "#4c6282",
                background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
                mb: 1.5,
              }}
            >
              <Typography>No pending flags found for this filter.</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                p: 0.7,
                borderRadius: 2,
                border: "1px solid #d5e3f8",
                background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
                boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
                mb: 1.5,
              }}
            >
              <CustomDataGrid2
                rows={pendingRows}
                columns={pendingColumns}
                title="Pending Invoices"
                loading={loading}
                gridHeight={350}
                searchableFields={["jobnumber", "projectmanager", "flagStatus"]}
                placeholder="Search pending flags..."
              />
            </Box>
          )}

          <Typography sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.5, fontSize: "1rem" }}>
            Invoiced Details
          </Typography>
          {invoicedRows.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px dashed #a8bfdc",
                borderRadius: 2,
                p: 1.5,
                textAlign: "center",
                color: "#4c6282",
                background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
              }}
            >
              <Typography>No invoiced flags found for this filter.</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                p: 0.7,
                borderRadius: 2,
                border: "1px solid #d5e3f8",
                background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
                boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
              }}
            >
              <CustomDataGrid2
                rows={invoicedRows}
                columns={invoicedColumns}
                title="Invoiced Details"
                loading={loading}
                gridHeight={350}
                searchableFields={["jobnumber", "projectmanager", "flagStatus"]}
                placeholder="Search invoiced flags..."
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default RaiseFlagRegister;
