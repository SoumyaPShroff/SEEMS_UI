import {useEffect, useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button } from "@mui/material";
import CustomDataGrid from "../../components/common/CustomerDataGrid";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { toast } from "react-toastify";
//import { useNavigate } from "react-router-dom";


export default function ViewPOEnqData() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
   // const navigate = useNavigate();
   // const loginId = sessionStorage.getItem("SessionUserID") || "guest";

    const columns: GridColDef[] = [
        { field: "penquiryno", headerName: "Enquiryno"},
        { field: "pponumber", headerName: "POnumber" },
        { field: "podate", headerName: "PODate"},
        { field: "ppoamount", headerName: "POAmt" },
        { field: "pbalanceamt", headerName: "BalAmt" },
        { field: "layQty", headerName: "LayQty"},
        { field: "layRateperhr", headerName: "LayRate" },
        { field: "playout", headerName: "LayAmt"},
        { field: "analyQty", headerName: "AnalysQty" },
        { field: "analyRateperhr", headerName: "AnalysRate" },
        { field: "panalysis", headerName: "AnalysAmt" },
        { field: "vaQty", headerName: "VAQty" },
        { field: "vaRateperhr", headerName: "VARate" },
        { field: "pva", headerName: "VAAmt"},
        { field: "npiQty", headerName: "NPIQty" },
        { field: "npiRateperhr", headerName: "NPIRate"},
        { field: "pnpi", headerName: "NPIAmt" },
        { field: "libQty", headerName: "LibQty" },
        { field: "libRateperhr", headerName: "LibRate"},
        { field: "plibrary", headerName: "LibAmt" },
        { field: "dfmQty", headerName: "DFMQty" },
        { field: "dfmRateperhr", headerName: "DFMRate"},
        { field: "dfm", headerName: "DFMAmt"},
        { field: "onsiteQty", headerName: "onsiteQty"},
        { field: "onsiteRateperhr", headerName: "onsiteRate" },
        { field: "onsite", headerName: "onsiteAmt"},
        { field: "ppaymentterm", headerName: "paymentterm"},
        { field: "pcurrency_id", headerName: "currency" },
        { field: "pconvrate", headerName: "convrate" },
        { field: "pcomments", headerName: "comments"},
        { field: "pquoteno", headerName: "quoteno"},
        { field: "pcreatedon", headerName: "createdon" },
        { field: "pcreatedby", headerName: "createdby" },
        { field: "pupdatedby", headerName: "updatedby" },
        { field: "pupdatedon", headerName: "updatedon" },
 
    ];
// const checkAccess = async () => {
//       try {
//         // Step 1: Get user role
//         const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
//         const userRole = userRoleRes.data;

//         // Step 2: Verify internal rights
//         const roleCheck = await axios.get<boolean>(
//           `${baseUrl}/UserRoleInternalRights/${userRole}/salesmgmtdashboard`
//         );

//         // Step 3: If not authorized, redirect
//         if (!roleCheck.data) {
//           navigate("/blank");
//         }
//       } catch (error) {
//         console.error("Error checking role:", error);
//         navigate("/blank");
//       }
//     };

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${baseUrl}/api/Sales/poenquiries`);
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

        exporttoexcel(rows, "View PO Enquiry Data", "View PO Enquiry Data.xlsx");
        toast.success("✅ View PO Enquiry Data exported!", { position: "bottom-right" });
    };

    useEffect(() => {
       // checkAccess();
       fetchData();
   // }, [navigate, baseUrl, loginId]);
     }, []);

    return (
        <Box sx={{ padding: "100px", mt: "30px", ml: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "left", gap: 2 }}>
                <Button variant="contained"    onClick={fetchData} style={{ height: 35 }}> View Data </Button>
                <Button variant="contained"   onClick={handleViewEnqExport} style={{ height: 35 }}>Export to Excel</Button>
            </Box>
            <CustomDataGrid
              //  autoHeight={true}
                rows={rows}
                columns={columns}
                title="View PO Enquiry Data"
                loading={loading}
                gridheight={400}
            />
        </Box>
    );
}
