import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, CircularProgress, } from "@mui/material";
import type { GridColDef } from '@mui/x-data-grid';
import CustomDataGrid from "../components/common/CustomerDataGrid";
import { baseUrl } from "../const/BaseUrl";
import { useNavigate } from "react-router-dom";

const ViewAllEnquiries = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState("Open");
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const loginId = sessionStorage.getItem("SessionUserID") || "guest";
    const [salesResponsibilityId, setSalesResponsibilityId] = useState("");

    // ✅ Correct column typing
    const columns: GridColDef[] = [
        { field: "enquiryno", headerName: "Enquiryno", flex: 1, minWidth:70 },
        { field: "customer", headerName: "Customer", flex: 1, minWidth:200 },
        { field: "createdon", headerName: "Createdon", flex: 1, Width: 60 },
        { field: "endDate", headerName: "EndDate", flex: 1, Width: 60 },
        { field: "salesResponsibility", headerName: "Sales Resp", flex: 1, minWidth: 100 },

        
  // 🟢 Add link columns like in your screenshot
  {
    field: "editEnquiry",
    headerName: "Edit Enquiry",
    flex: 1,
    minWidth: 50,
    sortable: false,
    renderCell: (params) => (
      <a
        href="#"
        style={{ color: "#1976d2", textDecoration: "none", cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault();
         // handleEditEnquiry(params.row);
        }}
      >
        Edit Enquiry
      </a>
    ),
  },
  {
    field: "addQuote",
    headerName: "Add Quote",
    flex: 1,
    minWidth: 50,
    sortable: false,
    renderCell: (params) => (
      <a
        href="#"
        style={{ color: "#1976d2", textDecoration: "none", cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault();
       //   handleAddQuote(params.row);
        }}
      >
        Add Quote
      </a>
    ),
  },
{
  field: "status",
  headerName: "Status",
  flex: 1,
  minWidth: 40,
  sortable: false,
  renderCell: (params) => (
    <a
      href="#"
      style={{color:"orange",textDecoration: "none",cursor: "pointer"}}
      onClick={(e) => {
        e.preventDefault();
        // 👇 Navigate to your desired page with data
      //  navigate(`/enquiry-details/${params.row.enquiryno}`);
      }}
    >
      {params.value}
    </a>
  ),
},
  {
    field: "addEstimate",
    headerName: "Add Estimate",
    flex: 1,
    minWidth: 60,
    sortable: false,
    renderCell: (params) => (
      <a
        href="#"
        style={{ color: "#1976d2", textDecoration: "none", cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault();
        //  handleAddEstimate(params.row);
        }}
      >
        Add Estimate
      </a>
    ),
  },
        { field: "esti", headerName: "Esti", flex: 1, minWidth: 30 },
        { field: "completeResponsibility", headerName: "PM Resp", flex: 1, minWidth: 130 },
        { field: "enquiryType", headerName: "EnqType", flex: 1, minWidth: 60 },
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
            const hasSpecialRole = roleCheck.data === true;

            // Step 3: Set salesResponsibilityId (from loginId)
            setSalesResponsibilityId(loginId);

            // Step 4: Build URL after setting the value
            let url = `${baseUrl}/api/sales/AllEnquiries`;

            // If user does NOT have complete rights → include their ID
            if (!hasSpecialRole) {
                url += `?salesResponsibilityId=${loginId}&status=${status}`;
            } else {
                // User has complete rights → only pass default status
                url += `?status=${status}`;
            }

            console.log(url);
            // Step 5: Call API
            const viewres = await axios.get<any[]>(url);
            // ✅ Add a unique "id" to each row (use Enquiryno or fallback to index)
            const dataWithIds = viewres.data.map((row, index) => ({
                id: row.Enquiryno || index + 1,
                ...row,
            }));
            setRows(dataWithIds);
            console.log("API Data:", dataWithIds);
        } catch (error) {
            console.error("Error loading enquiries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [loginId, status]);

    return (
        <Box sx={{ height: 600, width: "100%", padding: "100px" }}>
            <InputLabel style={{ textAlign: "left" }}>Status</InputLabel>
            <FormControl sx={{ mb: 2, minWidth: 200 }}>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <MenuItem value="Open">Open</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Tentative">Tentative</MenuItem>
                    <MenuItem value="Realised">Realised</MenuItem>
                </Select>
            </FormControl>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <CustomDataGrid
                    autoHeight
                    rows={rows}
                    columns={columns}
                    title="View All Enquiries"
                    getRowId={(row) => row.Enquiryno} // ✅ alternate approach
                    loading={loading}
                />
            )}
        </Box>
    );
};

export default ViewAllEnquiries;
