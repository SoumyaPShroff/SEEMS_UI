import { useEffect, useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box } from "@mui/material";//, Button
import CustomDataGrid from "../../components/resusablecontrols/CustomDataGrid";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { toast } from "react-toastify";
import ExportButton from "../../components/resusablecontrols/ExportButton";
//import { useNavigate } from "react-router-dom";


export default function ViewPOEnqData() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    // const navigate = useNavigate();
    // const loginId = sessionStorage.getItem("SessionUserID") || "guest";

    const columns: GridColDef[] = [
        { field: "penquiryno", headerName: "Enquiryno", flex:1, minWidth : 150 },
        { field: "pponumber", headerName: "POnumber" , flex:1, minWidth : 150 },
        { field: "podate", headerName: "PODate" , flex:1, minWidth : 130 },
        { field: "ppoamount", headerName: "POAmt", flex:1, minWidth : 150  },
        { field: "pbalanceamt", headerName: "BalAmt", flex:1, minWidth : 150  },
        { field: "layQty", headerName: "LayQty" , flex:1, minWidth : 130 },
        { field: "layRateperhr", headerName: "LayRate", flex:1, minWidth : 150  },
        { field: "playout", headerName: "LayAmt", flex:1, minWidth : 150  },
        { field: "analyQty", headerName: "AnalysQty" , flex:1, minWidth : 150 },
        { field: "analyRateperhr", headerName: "AnalysRate", flex:1, minWidth : 155  },
        { field: "panalysis", headerName: "AnalysAmt", flex:1, minWidth : 150  },
        { field: "vaQty", headerName: "VAQty", flex:1, minWidth : 130  },
        { field: "vaRateperhr", headerName: "VARate", flex:1, minWidth : 150  },
        { field: "pva", headerName: "VAAmt" , flex:1, minWidth : 150 },
        { field: "npiQty", headerName: "NPIQty", flex:1, minWidth : 130  },
        { field: "npiRateperhr", headerName: "NPIRate" , flex:1, minWidth : 150 },
        { field: "pnpi", headerName: "NPIAmt", flex:1, minWidth : 150  },
        { field: "libQty", headerName: "LibQty", flex:1, minWidth : 130  },
        { field: "libRateperhr", headerName: "LibRate" , flex:1, minWidth : 150 },
        { field: "plibrary", headerName: "LibAmt", flex:1, minWidth : 150  },
        { field: "dfmQty", headerName: "DFMQty", flex:1, minWidth : 130  },
        { field: "dfmRateperhr", headerName: "DFMRate", flex:1, minWidth : 150  },
        { field: "dfm", headerName: "DFMAmt" , flex:1, minWidth : 150 },
        { field: "onsiteQty", headerName: "onsiteQty", flex:1, minWidth : 150  },
        { field: "onsiteRateperhr", headerName: "onsiteRate", flex:1, minWidth : 150  },
        { field: "onsite", headerName: "onsiteAmt", flex:1, minWidth : 150  },
        { field: "ppaymentterm", headerName: "paymentterm", flex:1, minWidth : 170  },
        { field: "pcurrency_id", headerName: "currency" , flex:1, minWidth : 150 },
        { field: "pconvrate", headerName: "convrate", flex:1, minWidth : 150  },
        { field: "pcomments", headerName: "comments" , flex:1, minWidth : 150 },
        { field: "pquoteno", headerName: "quoteno", flex:1, minWidth : 150  },
        { field: "pcreatedon", headerName: "createdon", flex:1, minWidth : 150  },
        { field: "pcreatedby", headerName: "createdby", flex:1, minWidth : 150  },
        { field: "pupdatedby", headerName: "updatedby", flex:1, minWidth : 150  },
        { field: "pupdatedon", headerName: "updatedon", flex:1, minWidth : 150  },

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

        exporttoexcel(rows, "View PO dump Data", "View PO dump Data.xlsx");
        toast.success("✅ View PO dump Data exported!", { position: "bottom-right" });
    };

    useEffect(() => {
        // checkAccess();
        fetchData();
        // }, [navigate, baseUrl, loginId]);
    }, []);

    return (
        <Box sx={{ padding: "50px", mt: "10px", ml: "10px" }}>
            <Box sx={{ display: "flex", alignItems: "left", gap: 2 }}>
                {/* <Button variant="contained"    onClick={fetchData} style={{ height: 35 }}> View Data </Button> */}
                {/* <Button variant="contained"   onClick={handleViewEnqExport} style={{ height: 35 }}>Export to Excel</Button> */}
                <ExportButton label="Export to Excel" onClick={handleViewEnqExport} />
            </Box>
            {rows.length > 0 && (
                <CustomDataGrid
                    rows={rows}
                    columns={columns}
                    title="View PO dump Data"
                    loading={loading}
                    gridheight={400}
                />
            )}
        </Box>
    );
}
