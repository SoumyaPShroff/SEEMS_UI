import { useEffect, useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, TextField } from "@mui/material";
import CustomDataGrid from "../../components/common/CustomerDataGrid";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { toast } from "react-toastify";
//import { useNavigate } from "react-router-dom";

export default function ViewEnquiryReport() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    //const navigate = useNavigate();
    //const loginId = sessionStorage.getItem("SessionUserID") || "guest";

    const columns: GridColDef[] = [
        { field: "enquiryno", headerName: "enquiryno", width: 100 },
        { field: "customer", headerName: "customer", width: 200 },
        { field: "enquiry_createdon", headerName: "enquiry_createdon", width: 150 },
        { field: "quote_generatedon", headerName: "quote_generatedon", width: 150 },
        { field: "job_Createdon", headerName: "Job_Createdon", width: 150 },
        { field: "salesperson", headerName: "salesperson", width: 150 },
        { field: "completeresponsibility", headerName: "completeresponsibility", width: 170 },
        { field: "quoteCreatedby", headerName:"quoteCreatedby", width:150},
        { field: "status", headerName: "status", width: 120 },
        { field: "remarks", headerName: "remarks", width:100 },
        { field: "cancelledremarks", headerName: "cancelledremarks", width: 150 },
    ];

    // const checkAccess = async () => {
    //     try {
    //         // Step 1: Get user role
    //         const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
    //         const userRole = userRoleRes.data;

    //         // Step 2: Verify internal rights
    //         const roleCheck = await axios.get<boolean>(
    //             `${baseUrl}/UserRoleInternalRights/${userRole}/ViewEnquiryReport`
    //         );

    //         // Step 3: If not authorized, redirect
    //         if (!roleCheck.data) {
    //             navigate("/blank");
    //         }
    //     } catch (error) {
    //         console.error("Error checking role:", error);
    //         navigate("/blank");
    //     }
    // };

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `${baseUrl}/api/Sales/RptViewEnquiryData`;

            // Pass only if both dates are selected
            if (startDate && endDate) {
                url += `?startdate=${startDate}&enddate=${endDate}`;
            }

            const response = await axios.get(url);
            //const data = response.data;
            const data = response.data as any[];

            const mapped = data.map((item: any, index: number) => ({
                id: index + 1,
                ...item,
            }));

            setRows(mapped);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewEnqExport = () => {
        if (!rows || rows.length === 0) {
            toast.warning("⚠️ No data available to export.", { position: "bottom-right" });
            return;
        }

        exporttoexcel(rows, "View Enquiry Report", "View Enquiry Report.xlsx");
        toast.success("✅ View Enquiry Report exported!", { position: "bottom-right" });
    };

    
    useEffect(() => {
       // checkAccess();
        fetchData();
   // }, [navigate, baseUrl, loginId]);
       }, []);

    return (
        <Box sx={{ padding: "100px", mt: "30px", ml: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "left", gap: 2 }}>
                <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        "& .MuiInputBase-root": {
                            height: 35,   // ← adjust height here
                        },
                        "& input": {
                            padding: "6px 14px", // optional to adjust inner text padding
                        },
                    }}
                />
                <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        "& .MuiInputBase-root": {
                            height: 35,   // ← adjust height here
                        },
                        "& input": {
                            padding: "6px 14px", // optional to adjust inner text padding
                        },
                    }}
                />
                <Button variant="contained"    onClick={fetchData} style={{ height: 35 }}> View Data </Button>
                <Button variant="contained"   onClick={handleViewEnqExport} style={{ height: 35 }}>Export to Excel</Button>
            </Box>
            <CustomDataGrid
               // autoHeight={true}
                rows={rows}
                columns={columns}
                title="View Enquiry Report"
                loading={loading}
                gridheight={400}
            />
        </Box>
    );
}
