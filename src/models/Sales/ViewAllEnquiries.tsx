import { useEffect, useState } from "react";
import axios from "axios";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, CircularProgress, Button } from "@mui/material";
import type { GridColDef } from '@mui/x-data-grid';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import CustomDataGrid from "../../components/resusablecontrols/CustomDataGrid";

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
    { field: "enquiryno", headerName: "Enquiryno", flex: 1, minWidth: 100 },
    { field: "customer", headerName: "Customer", flex: 1, minWidth: 200 },
    { field: "createdon", headerName: "Createdon", flex: 1, minWidth: 100 },
    { field: "endDate", headerName: "EndDate", flex: 1, minWidth: 100 },
    { field: "salesResponsibility", headerName: "Sales Resp", flex: 1, minWidth: 150 },

    // 🟢 Add link columns like in your screenshot
    {
      field: "editEnquiry",
      headerName: "Edit Enquiry",
      flex: 1,
      minWidth: 100,
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
      minWidth: 100,
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
      minWidth: 100,
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
      minWidth: 100,
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
    { field: "esti", headerName: "Esti", flex: 1, minWidth: 50 },
    { field: "completeResponsibility", headerName: "PM Resp", flex: 1, minWidth: 120 },
    { field: "enquiryType", headerName: "EnqType", flex: 1, minWidth: 100 },
    { field: "boardRef", headerName: "Board Ref", flex: 1, minWidth: 100 },
    { field: "referenceBy", headerName: "Reference By", flex: 1, minWidth: 100 },
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
    <Box sx={{ height: "100%", width: "100%", padding: "40px", mt: "20px", ml: "-5px" }}>
      <InputLabel style={{ textAlign: "left" }}>Status</InputLabel>
      <FormControl sx={{ mb: 2, display: "flex", flexDirection: "row", gap: 2 }} >
        <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ height: "35px", width: "230px" }}>
          <MenuItem value="Open">Open</MenuItem>
          <MenuItem value="Confirmed">Confirmed</MenuItem>
          <MenuItem value="Tentative">Tentative</MenuItem>
          <MenuItem value="Realised">Realised</MenuItem>
          <MenuItem value="Cancelled">Cancelled</MenuItem>
          <MenuItem value="Rejected By Customer">Rejected By Customer</MenuItem>
          <MenuItem value="Rejected By Sienna">Rejected By Sienna</MenuItem>
          <MenuItem value="All">All</MenuItem>
        </Select>
         <ExportButton label="Export to Excel" onClick={handleViewEnqExport} />
        <Button variant="contained"   onClick={() => navigate("/Home/AddEnquiry")}>Add Enquiry</Button>  
      </FormControl>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Typography
          variant="subtitle1"
          sx={{ textAlign: "center", mt: 4, color: "gray" }}
        >
          No enquiries found for selected status.
        </Typography>
      ) : (
        <CustomDataGrid
          rows={rows}
          columns={columns}
          title="View All Enquiries"
          loading={loading}
          gridheight={800}
        />
      )}
    </Box>
  );
};

export default ViewAllEnquiries;
