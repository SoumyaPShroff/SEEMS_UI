import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, CircularProgress, Button, Paper } from "@mui/material";
import type { GridColDef } from '@mui/x-data-grid';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import SelectControl from "../../components/resusablecontrols/SelectControl";

const ViewAllEnquiries = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Open");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUserName = sessionStorage.getItem("SessionUserName") || "guestName";
  const [hasSpecialRole, sethasSpecialRole] = useState(false);

  //check for access to edit - own enquiry of sesion user
  const canEditRow = (row: any) => {
    const isOwn = row.salesResponsibility === loginUserName;
    return isOwn;
  };

  // ✅ Correct column typing
  const columns: GridColDef[] = [
    { field: "enquiryno", headerName: "Enquiry No", flex: 1, minWidth: 150 },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 250 },
    { field: "createdon", headerName: "Createdon", flex: 1, minWidth: 150 },
    { field: "endDate", headerName: "EndDate", flex: 1, minWidth: 150 },
    { field: "salesResponsibility", headerName: "Sales Resp", flex: 1, minWidth: 150 },

    // 🟢 Add link columns like in your screenshot
    {
      field: "editEnquiry",
      headerName: "Edit Enquiry",
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const enabled = canEditRow(params.row);
        const hasAccess = enabled || hasSpecialRole; // ✅ allow for complete access users

        return (
          <a
            href="#"
            style={{
              color: hasAccess ? "#1976d2" : "gray",
              cursor: hasAccess ? "pointer" : "not-allowed",
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!hasAccess) return;
              handleEditEnquiry(params.row); // in order to recieve multiple no of columns
            }}
          >
            Edit Enquiry
          </a>
        );
      },
    },
    {
      field: "addQuote",
      headerName: "Add Quote",
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const enabled = canEditRow(params.row);
        const hasAccess = enabled || hasSpecialRole; // ✅ allow for complete access users

        return (
          <a
            href="#"
            style={{
              color: hasAccess ? "#1976d2" : "gray",
              cursor: hasAccess ? "pointer" : "not-allowed",
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!hasAccess) return;
              handleQuote(params.row);
            }}
          >
            Add Quote
          </a>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      minWidth: 160,
      sortable: false,
      renderCell: (params) => {
        const statusValue = params.value?.toString() || "";
        const isDisabled =
          statusValue === "Cancelled" ||
          statusValue === "Rejected By Customer" ||
          statusValue === "Rejected By Sienna";
        return (
          <span
            style={{
              color: isDisabled ? "gray" : "orange",
              textDecoration: isDisabled ? "none" : "underline",
              cursor: isDisabled ? "not-allowed" : "pointer",
              fontWeight: 400,
              opacity: isDisabled ? 0.6 : 1,
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!isDisabled) {
                // ✅ Navigate only if not disabled
                // navigate(`/enquiry-details/${params.row.enquiryno}`);
              }
            }}
          >
            {statusValue}
          </span>
        );
      },
    },
    {
      field: "addEstimate",
      headerName: "Add Estimate",
      flex: 1,
      minWidth: 140,
      sortable: false,
      renderCell: (params) => {
        const estiValue = params.row.esti?.toUpperCase() || "";
        const enabled = canEditRow(params.row);
        const hasAccess = enabled || hasSpecialRole; // ✅ allow for complete access users

        // ✅ Logic:
        // - Disable if DONE
        // - Enable only if esti == NO and user has rights
        //const isClickable = estiValue === "NO" && enabled;
        const isClickable = estiValue === "NO" && hasAccess;

        return (
          <span
            style={{
              color: isClickable ? "#1976d2" : "gray",
              textDecoration: isClickable ? "underline" : "none",
              cursor: isClickable ? "pointer" : "not-allowed",
              opacity: isClickable ? 1 : 0.6,
            }}
            onClick={(e) => {
              e.preventDefault();
              if (!isClickable) return; // ✅ Block click when disabled
              // handleAddEstimate(params.row);
            }}
          >
            Add Estimate
          </span>
        );
      },
    },
    { field: "esti", headerName: "Esti", flex: 1, minWidth:100 },
    { field: "completeResponsibility", headerName: "PM Resp", flex: 1, minWidth: 150 },
    { field: "enquiryType", headerName: "EnqType", flex: 1, minWidth: 150 },
    { field: "boardRef", headerName: "Board Ref", flex: 1, minWidth: 200 },
    { field: "referenceBy", headerName: "Reference By", flex: 1, minWidth: 170 },
  ];

  const loadData = async () => {
    try {
      setLoading(true);

      // Step 1: Get user role
      const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
      const userRole = userRoleRes.data;

      // Step 2: Get whether user has complete access
      const roleCheck = await axios.get<boolean>(
        `${baseUrl}/UserRoleInternalRights/${userRole}/viewallenquiries`
      );
      //const hasSpecialRole = roleCheck.data === true;
      const roleFlag = roleCheck.data === true;
      sethasSpecialRole(roleFlag); // ✅ store in state

      // Step 4: Build URL after setting the value
      let url = `${baseUrl}/api/sales/AllEnquiries`;

      let finalStatus = status;

      if (status === "All") {
        finalStatus = "Open,Tentative,Confirmed"; //  multiple statuses
      }

      // If user does NOT have complete rights → include their ID
      if (!roleFlag) {
        url += `?salesResponsibilityId=${loginId}&status=${finalStatus}`;
      } else {
        // User has complete rights → only pass default status
        url += `?status=${finalStatus}`;
      }

      // Step 5: Call API
      const viewres = await axios.get<any[]>(url);
      // ✅ Add a unique "id" to each row (use Enquiryno or fallback to index)
      const dataWithIds = viewres.data.map((row, index) => ({
        id: row.Enquiryno || index + 1,
        ...row,
      }));
      setRows(dataWithIds);
    } catch (error) {
      console.error("Error loading enquiries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loginId, status]);


  const handleViewEnqExport = () => {
    if (!rows || rows.length === 0) {
      toast.warning("⚠️ No data available to export.", { position: "bottom-right" });
      return;
    }

    exporttoexcel(rows, "ViewAllEnquiries", "ViewAllEnquiries.xlsx");
    toast.success("✅ All Enquiries Data exported!", { position: "bottom-right" });
  };

  const handleEditEnquiry = (row: any) => {
    const enqNo = row.enquiryno;
    const enqType = row.enquiryType?.toUpperCase() || "";

    if (!enqType) {
      toast.error("❌ Enquiry type not chosen");
      return;
    }

    if (enqType === "OFFSHORE") {
      navigate(`/Home/OffshoreEnquiry/${enqNo}`);
    } else if (enqType === "ONSITE") {
      navigate(`/Home/OnsiteEnquiry/${enqNo}`);
    } else {
      toast.error(`❌ Unknown Enquiry Type: ${enqType}`);
    }
  };

    const handleQuote = (row: any) => {
    const enqNo = row.enquiryno;
    navigate(`/Home/AddQuotation/${enqNo}`);
  };

  return (
    <Box
      sx={{
        p: { xs: 1, md: 1.5 },
        mt: 15,
        width: "100%",
        maxWidth: 1280,
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
        View All Enquiries
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
            alignItems: { xs: "stretch", sm: "flex-end" },
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <Box sx={{ width: { xs: "100%", sm: 260 } }}>
            <SelectControl
              name="status"
              label="Status"
              value={status}
              width="230px"
              height={35}
              options={[
                { value: "Open", label: "Open" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Tentative", label: "Tentative" },
                { value: "Realised", label: "Realised" },
                { value: "Cancelled", label: "Cancelled" },
                { value: "Rejected By Customer", label: "Rejected By Customer" },
                { value: "Rejected By Sienna", label: "Rejected By Sienna" },
                { value: "All", label: "All" },
              ]}
              onChange={(e: any) => setStatus(e.target.value)}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, ml: "auto", justifyContent: "flex-end" }}>
            <ExportButton label="Export to Excel" onClick={handleViewEnqExport} />
            <Button
              variant="contained"
              onClick={() => navigate("/Home/AddEnquiry")}
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
              Add Enquiry
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
          <Typography>No enquiries found for selected status.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            p: 0.7,
            borderRadius: 2,
            border: "1px solid #d5e3f8",
            background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
            boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
            maxWidth: 1240,
            mx: "auto",
          }}
        >
          <CustomDataGrid2
            rows={rows}
            columns={columns}
            title="View All Enquiries"
            loading={loading}
            gridHeight={800}
            searchableFields={[
              "enquiryno",
              "customer",
              "createdon",
              "endDate",
              "salesResponsibility",
              "status",
              "completeResponsibility",
              "enquiryType",
              "boardRef",
              "referenceBy",
            ]}
            placeholder="Search enquiries..."
          />
        </Box>
      )}
    </Box>
  );
};

export default ViewAllEnquiries;
