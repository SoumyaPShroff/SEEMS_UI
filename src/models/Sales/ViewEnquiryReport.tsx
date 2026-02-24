import { useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, TextField } from "@mui/material";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { toast } from "react-toastify";
import ExportButton from "../../components/resusablecontrols/ExportButton";

export default function ViewEnquiryReport() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    //const navigate = useNavigate();
    //const loginId = sessionStorage.getItem("SessionUserID") || "guest";

    const columns: GridColDef[] = [
        { field: "enquiryno", headerName: "Enquiry No", flex:1, minWidth : 150 },
        { field: "customer", headerName: "Customer", width: 300 },
        { field: "enquiry_createdon", headerName: "Enquiry_Createdon", width: 220 },
        { field: "quote_generatedon", headerName: "Quote_Generatedon", width: 220 },
        { field: "job_Createdon", headerName: "Job_Createdon", width: 200 },
        { field: "salesperson", headerName: "Sales Person", width: 200 },
        { field: "completeresponsibility", headerName: "Complete Responsibility", width: 240 },
        { field: "quoteCreatedby", headerName: "QuoteCreatedby", width: 200 },
        { field: "status", headerName: "Status", width: 120 },
        { field: "remarks", headerName: "Remarks", width: 200 },
        { field: "cancelledremarks", headerName: "Cancelled Remarks", width: 200 },
    ];

    const fetchData = async () => {
        setLoading(true);
        try {

            // // Step 1: Get user role
            // const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
            // const userRole = userRoleRes.data;

            // // Step 2: Get whether user has complete access
            // const roleCheck = await axios.get<boolean>(
            //     `${baseUrl}/UserRoleInternalRights/${userRole}/ViewEnquiryReport`
            // );
            // const roleFlag = roleCheck.data === true;
            // sethasSpecialRole(roleFlag); // ✅ store in state

            let url = `${baseUrl}/api/Sales/RptViewEnquiryData/${startDate}/${endDate}`;
            const response = await axios.get(url);
            const data = response.data as any[];

            // If user does NOT have complete rights → include their ID
            // if (!roleFlag) {
            //     url += `?salesResponsibilityId=${loginId}`;
            // }     
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

    return (
        <Box sx={{ padding: "50px", mt: "30px", ml: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "left", gap: 2 }}>
                <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        "& .MuiInputBase-root": {
                            height: 30,   // ← adjust height here
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
                            height: 30,   // ← adjust height here
                        },
                        "& input": {
                            padding: "6px 14px", // optional to adjust inner text padding
                        },
                    }}
                />
                <Button variant="contained" onClick={fetchData} style={{ height: 35 }}> View Data </Button>
                {/* <Button variant="contained"   onClick={handleViewEnqExport} style={{ height: 35 }}>Export to Excel</Button> */}
                <ExportButton label="Export to Excel" onClick={handleViewEnqExport} />
            </Box>
            <Box sx={{ mt: 3 }}>
            {rows.length > 0 && (
                <CustomDataGrid2
                    rows={rows}
                    columns={columns}
                    title="View Enquiry Report"
                    loading={loading}
                    gridHeight={400}
                />
            )}
            </Box>
        </Box>
    );
}
