import { useEffect, useState } from "react";
import axios from "axios";
import type { GridColDef } from '@mui/x-data-grid';
import { Box, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl } from "@mui/material";
import CustomDataGrid from "../../components/resusablecontrols/CustomDataGrid";
import { baseUrl } from "../../const/BaseUrl";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { toast } from "react-toastify";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import { formatDateYYYYMMDD } from "../../components/utils/DateUtils";
import { useNavigate } from "react-router-dom";
import { getCurrentMonthDates } from "../../components/utils/DateUtils";

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
    const [searchText, setSearchText] = useState<string>("");
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
        setLoading(true);
        let url = "";
        try {

            // 🔹 Priority 1: Quote No (query param)
            if (searchText.trim()) {
                url = `${baseUrl}/api/Sales/ViewQuoteDetails?quoteno=${encodeURIComponent(searchText.trim())}`;
            }
            // 🔹 Priority 2: Date range
            else {
                if (!startDate || !endDate) {
                    toast.warning("Please select start and end dates or enter Quote No");
                    setRows([]);
                    setLoading(false);
                    return;
                }
                const fromDate = formatDateYYYYMMDD(startDate);
                const toDate = formatDateYYYYMMDD(endDate);

                url = `${baseUrl}/api/Sales/ViewQuoteDetails?startdate=${fromDate}&enddate=${toDate}`;
            }

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
                <TextField
                    label="Search Quote No"
                    value={searchText}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSearchText(value);

                        // ✅ If cleared, hide grid
                        if (!value.trim()) {
                            setRows([]);
                        }
                    }}
                    sx={{
                        "& .MuiInputBase-root": {
                            height: 40,
                        },
                        "& input": {
                            padding: "2px 2px",
                            textAlign: "center",
                        },
                    }}
                />
                <IconButton
                    color="primary"
                    onClick={fetchData}
                    sx={{
                        height: 35,
                        width: 35,
                        border: "1px solid #1976d2",
                        borderRadius: 1,
                    }}
                >
                    <SearchIcon />
                </IconButton>
            </Box>
            {rows.length > 0 && (
                <CustomDataGrid
                    rows={rows}
                    columns={columns}
                    title="View Quote Details"
                    loading={loading}
                    gridheight={400}
                />
            )}
        </Box>
    );
}
