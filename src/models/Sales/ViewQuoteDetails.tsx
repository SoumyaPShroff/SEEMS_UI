import { useEffect, useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl } from "@mui/material";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../utils/exporttoexcel";
import { toast } from "react-toastify";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { formatDateYYYYMMDD } from "../../utils/DateUtils";
import { useNavigate } from "react-router-dom";
import { getCurrentMonthDates } from "../../utils/DateUtils";

interface QuoteDetails {
    enquiryno: string;
    quoteNo: string;
    customer: string;
    createdon: string;
    name: string;
    totalquoteAmt: number;
    versionno: number;
}

export default function ViewQuoteDetails() {
    const [rows, setRows] = useState<any[]>([]);
    const { startdate: initialStart, enddate: initialEnd } = getCurrentMonthDates();
    const [startDate, setStartDate] = useState<string>(initialStart);
    const [endDate, setEndDate] = useState<string>(initialEnd);
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [gstMode, setGstMode] = useState<string>("with");

    const columns: GridColDef[] = [
        { field: "enquiryno", headerName: "Enquiry No", minWidth : 130 },
        { field: "quoteNo", headerName: "Quote No", minWidth: 117 },
        { field: "customer", headerName: "Customer", minWidth: 320 },
        { field: "createdon", headerName: "CreatedOn", minWidth: 150 },
        { field: "name", headerName: "Name", minWidth: 160 },
        { field: "totalquoteAmt", headerName: "TotalQuoteAmt", minWidth: 190 },
        { field: "versionno", headerName: "Versionno", minWidth: 150 },
        // ⭐ NEW COLUMN
        {
            field: "viewQuote",
            headerName: "View Quote",
            width: 140,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <Button
                    variant="text"
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={() => {
                        const basePath = gstMode === "with" ? "ViewQuoteReport" : "ViewQuoteReportNoGST";
                        navigate(`/Home/${basePath}/${params.row.quoteNo}/${params.row.versionno}/${params.row.enquiryno}`);
                    }}
                >
                    Generate Quote
                </Button>
            ),
        },
    ];

    useEffect(() => {
        if (!startDate || !endDate) {
            toast.warning("Please select start and end dates");
            return;
        }
        fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        if (!startDate || !endDate) {
            toast.warning("Please select start and end dates");
            return;
        }
        setLoading(true);
        try {
            const fromDate = formatDateYYYYMMDD(startDate);
            const toDate = formatDateYYYYMMDD(endDate);

            const url = `${baseUrl}/api/Sales/ViewQuoteDetails?startdate=${fromDate}&enddate=${toDate}`;

            axios.get<QuoteDetails[]>(url).then(response => {
                const mapped = response.data.map((item: any, index: number) => ({
                    id: index + 1,
                    ...item,
                }));
                setRows(mapped);
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load quote details");
        } finally {
            setLoading(false);
        }
    };

    const handleViewQuoteExport = () => {
        if (!rows || rows.length === 0) {
            toast.warning("⚠️ No data available to export.", { position: "bottom-right" });
            return;
        }
        exporttoexcel(rows, "View Quote Details", "View Quote Details.xlsx");
        toast.success("✅ View Quote Details exported!", { position: "bottom-right" });
    };

    return (
        <Box sx={{ padding: "50px", mt: "10px", ml: "12px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                            padding: "6px 18px", // optional to adjust inner text padding
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
                            padding: "6px 18px", // optional to adjust inner text padding
                        },
                    }}
                />
                <Button variant="contained" onClick={fetchData} style={{ height: 35 }}> View Data </Button>
                <FormControl component="fieldset" sx={{ ml: 2 }}>
                    <RadioGroup row value={gstMode} onChange={(e) => setGstMode(e.target.value)}>
                        <FormControlLabel value="with" control={<Radio size="small" />} label="With GST" />
                        <FormControlLabel value="without" control={<Radio size="small" />} label="Without GST" />
                    </RadioGroup>
                </FormControl>
                <ExportButton label="Export to Excel" onClick={handleViewQuoteExport} />
            </Box>
            <Box sx={{ mt: 2 }}>
                <CustomDataGrid2
                    rows={rows}
                    columns={columns}
                    title="View Quote Details"
                    loading={loading}
                    gridHeight={400}
                    searchableFields={["quoteNo", "enquiryno", "customer", "name"]}
                    placeholder="Search Quote No, Enquiry, Customer..."
                />
            </Box>
        </Box>
    );
}
