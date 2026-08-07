import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, Button, Paper, TextField } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../const/BaseUrl";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";

const ViewAllJobs = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const columns: GridColDef[] = [
    { field: "enquiryno", headerName: "Enquiry No", flex: 1, minWidth: 150 },
    { field: "jobnumber", headerName: "Job Number", flex: 1, minWidth: 250 },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 250 },
    { field: "requestdate", headerName: "Request Date", flex: 1, minWidth: 180 },
    { field: "billingtype", headerName: "Billing Type", flex: 1, minWidth: 160 },
    { field: "projectmanager", headerName: "Project Manager", flex: 1, minWidth: 190 },
    {
      field: "transferJob",
      headerName: "Transfer Job",
      flex: 1,
      minWidth: 130,
      sortable: false,
     // renderCell: (params) => (
     renderCell: () => (
        <a
          href="#"
          style={{ color: "#1976d2", cursor: "pointer" }}
          onClick={(e) => {
            e.preventDefault();
         //   handleTransferJob(params.row);
         handleTransferJob();
          }}
        >
          Transfer Job
        </a>
      ),
    },
    { field: "costcenter", headerName: "Cost Center", flex: 1, minWidth: 160 },
    { field: "endDate1", headerName: "End Date", flex: 1, minWidth: 140 },

  ];

  const loadData = async (from = fromDate, to = toDate) => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { count: 200 };
      if (from) params.fromDate = from;
      if (to) params.toDate = to;
      const res = await axios.get<any[]>(`${baseUrl}/api/Job/RecentJobs`, { params });
      const rows = Array.isArray(res.data) ? res.data : [];
      const dataWithIds = rows.map((row, index) => ({
        id: row.jobNumber || index + 1,
        enquiryno: row.enquiryNo,
        jobnumber: row.jobNumber,
        customer: row.customer,
        requestdate: row.requestDate,
        enddate: row.endDate,
        billingtype: row.billingType,
        projectmanager: row.projectManager,
        costcenter: row.costCenter,
      }));
      setRows(dataWithIds);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

//  const handleTransferJob = (row: any) => {
   // navigate(`/Home/TransferJob?jobnumber=${encodeURIComponent(row.jobnumber)}`);
 // };
const handleTransferJob = () => {
};

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    loadData("", "");
  };

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
        View All Jobs
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
              label="Request Date From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ backgroundColor: "#fff", minWidth: 170 }}
            />
            <TextField
              label="Request Date To"
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
            <Button
              variant="outlined"
              onClick={handleClearFilter}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                height: 32,
              }}
            >
              Clear
            </Button>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            onClick={() => navigate("/Home/JobCreationForm")}
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
            Create Job
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/Home/AllocatePOtoJob")}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 1.5,
              px: 1.5,
              py: 0.5,
              height: 32,
            }}
          >
            Allocate PO to Job
          </Button>
          </Box>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: "1px dashed #a8bfdc",
            borderRadius: 2,
            p: 2.2,
            textAlign: "center",
            color: "#4c6282",
            background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
          }}
        >
          <Typography>No jobs found.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            p: 0.7,
            borderRadius: 2,
            border: "1px solid #d5e3f8",
            background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
            boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
            maxWidth: 1400,
            mx: "auto",
          }}
        >
          <CustomDataGrid2
            rows={rows}
            columns={columns}
            title="View All Jobs"
            loading={loading}
            gridHeight={800}
            searchableFields={["enquiryno", "jobnumber", "customer", "projectmanager", "costcenter"]}
            placeholder="Search jobs..."
          />
        </Box>
      )}
    </Box>
  );
};

export default ViewAllJobs;