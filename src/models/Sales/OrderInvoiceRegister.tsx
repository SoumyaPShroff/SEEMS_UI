import { useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, TextField } from "@mui/material";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../utils/exporttoexcel";
import { toast } from "react-toastify";
import ExportButton from "../../components/resusablecontrols/ExportButton";

export default function OrderInvoiceRegister() {
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    const columns: GridColDef[] = [
        { field: "projectStartDate", headerName: "Startdate", flex: 1, minWidth: 140 },
        { field: "projectEndDate", headerName: "EndDate", minWidth: 140},
        { field: "poNumber", headerName: "Allocated PO", minWidth:200 },
        { field: "poDate", headerName: "PO Date", minWidth: 140},
        { field: "poValue", headerName: "Value", minWidth: 140},
        { field: "customerName", headerName: "Customer", minWidth: 200 },
        { field: "jobNumber", headerName: "Jobnumber", minWidth: 150 },
        { field: "enquiryRef", headerName: "Enquiry", minWidth: 130 },
        { field: "quotationRef", headerName: "Quotation", minWidth: 150 },
        { field: "invoiceNo", headerName: "Invoice No", minWidth: 150 },
        { field: "invoiceDate", headerName: "Invoice Date", minWidth: 160 },
        { field: "remarks", headerName: "Status", minWidth: 200 },
    ];

    const fetchData = async () => {
        if (!startDate || !endDate) {
            toast.warning("⚠️ Please select both start and end dates.", { position: "bottom-right" });
            return;
        }

        setLoading(true);
        try {
            const url = `${baseUrl}/api/Sales/ProjOrderInvoiceRegisterRpt/${startDate}/${endDate}`;
            console.log("Fetching from:", url);
            const response = await axios.get(url);
            const data = response.data as any[];

            const mapped = data.map((item: any, index: number) => ({
                id: index + 1,
                ...item,
            }));

            setRows(mapped);
            if (mapped.length === 0) {
                toast.info("ℹ️ No data found for the selected date range.", { position: "bottom-right" });
            }
        } catch (err) {
            console.error(err);
            toast.error("❌ Failed to fetch data. Please try again.", { position: "bottom-right" });
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!rows || rows.length === 0) {
            toast.warning("⚠️ No data available to export.", { position: "bottom-right" });
            return;
        }

        exporttoexcel(rows, "Order Invoice Register", "Order Invoice Register.xlsx");
        toast.success("✅ Order Invoice Register exported!", { position: "bottom-right" });
    };

    return (
        <Box sx={{ padding: "50px", mt: "30px", ml: "20px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                        "& .MuiInputBase-root": {
                            height: 30,
                        },
                        "& input": {
                            padding: "6px 14px",
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
                            height: 30,
                        },
                        "& input": {
                            padding: "6px 14px",
                        },
                    }}
                />
                <Button variant="contained" onClick={fetchData} style={{ height: 35 }}>
                    View Data
                </Button>
                <ExportButton label="Export to Excel" onClick={handleExport} />
            </Box>
            <Box sx={{ mt: 3 }}>
                {rows.length > 0 && (
                    <CustomDataGrid2
                        rows={rows}
                        columns={columns}
                        title="Order Invoice Register"
                        loading={loading}
                        gridHeight={400}
                    />
                )}
            </Box>
        </Box>
    );
}
