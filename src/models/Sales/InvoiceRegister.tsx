import React, { useMemo, useState } from "react";
import {FormControl, Select, MenuItem, RadioGroup, FormControlLabel,  Radio,  Grid,  InputLabel,  Box,
  Card,  CardContent,  Typography,  CircularProgress,  Paper,  Button,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import axios from "axios";
import dayjs from "dayjs";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { baseUrl } from "../../const/BaseUrl";

const invoiceColumns: GridColDef[] = [
  { field: "jobnumber", headerName: "Jobnumber", minWidth: 250, flex: 1 },
  { field: "startdate", headerName: "Startdate", minWidth: 140 , flex: 1 },
  { field: "enddate", headerName: "Enddate", minWidth: 140, flex: 1 },
  { field: "billableHours", headerName: "BillableHrs", minWidth: 150, flex: 1 },
  { field: "nonBillableHours", headerName: "NonBillableHrs", minWidth: 160, flex: 1 },
  { field: "totalHours", headerName: "TotalHours", minWidth: 150, flex: 1 },
  { field: "numberOfResources", headerName: "NoOfResources", minWidth: 150, flex: 1 },
  { field: "duration", headerName: "Duration", minWidth: 150, flex: 1 },
  { field: "invoiceHours", headerName: "InvoiceHours", minWidth: 150, flex: 1 },
  { field: "ratePerHour", headerName: "RatePerHour", minWidth: 160, flex: 1 },
  { field: "billingType", headerName: "BillingType", minWidth: 170, flex: 1 },
  { field: "currency", headerName: "currency", minWidth: 160, flex: 1 },
  { field: "invoiceNo", headerName: "InvoiceNo", minWidth: 160, flex: 1 },

    { field: "invoice_Value", headerName: "InvoiceValue", minWidth: 160, flex: 1 },
  { field: "projectManager", headerName: "ProjectManager", minWidth: 160, flex: 1 },
  { field: "pcbtool", headerName: "PCBTool", minWidth: 170, flex: 1 },
  { field: "efforts", headerName: "Efforts", minWidth: 160, flex: 1 },
  { field: "status", headerName: "Status", minWidth: 120, flex: 1 },

      { field: "customer", headerName: "Customer", minWidth: 140, flex: 1 },
  { field: "salesManager", headerName: "SalesManager", minWidth: 160, flex: 1 },
  { field: "rejectedHours", headerName: "RejectedHrs", minWidth: 170, flex: 1 },
  { field: "approvedHours", headerName: "ApprovedHrs", minWidth: 160, flex: 1 },
  { field: "ecOhours", headerName: "ECOHrs", minWidth: 120, flex: 1 },

        { field: "raiseflagDate", headerName: "RaiseFLagDate", minWidth: 140, flex: 1 },
  { field: "rejectedRemarks", headerName: "RejectedRemarks", minWidth: 160, flex: 1 },
  { field: "rupees", headerName: "Rupees", minWidth: 170, flex: 1 },
  { field: "poNumber", headerName: "PONumber", minWidth: 160, flex: 1 },
  { field: "invoiceDate", headerName: "InvoiceDate", minWidth: 120, flex: 1 },

    { field: "enquirytype", headerName: "Enquiry Type", minWidth: 160, flex: 1 },
  { field: "actualEndDate", headerName: "Received Amount", minWidth: 170, flex: 1 },
  { field: "expectedDeliveryDate", headerName: "ExpectedDeliveryDate", minWidth: 160, flex: 1 },
  { field: "totalInvoicedAmt", headerName: "TotalInvoicedAmt", minWidth: 120, flex: 1 },

    { field: "totalInvoicedHrs", headerName: "TotalInvoicedHrs", minWidth: 160, flex: 1 },
  { field: "sapcustcode", headerName: "SapCustCode", minWidth: 120, flex: 1 },
];

const invoiceSearchableFields = [
  "invoice_no",
  "invoice_date",
  "customer",
  "customer_abb",
  "sales_resp",
  "po_no",
  "po_date",
  "taxable_value",
  "tax_amount",
  "invoice_amount",
  "received_amount",
  "pending_amount",
  "status",
];

const InvoiceRegister = () => {
  const [monthYear, setMonthYear] = useState(dayjs().format("MMM-YYYY"));
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const months = useMemo(() => {
    const start = dayjs("2025-01-01").startOf("month");
    const end = dayjs().startOf("month");
    const list: string[] = [];

    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end)) {
      list.push(cursor.format("MMM-YYYY"));
      cursor = cursor.add(1, "month");
    }

    return list;
  }, []);

  const fetchInvoiceRows = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${baseUrl}/api/Sales/InvoiceRegister/${monthYear}`, {
        params: { status },
      });
      const data = Array.isArray(response.data) ? response.data : [];
     
      const normalizedRows = data.map((row: any, index: number) => ({ 
        ...row,
        id:
          row?.id ??
          row?.invoice_id ??
          row?.InvoiceID ??
          `${monthYear}-${status}-${index + 1}`,
      }));
 
      setRows(normalizedRows);
    } catch (error) {
      console.error("Failed to load invoice register data:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!rows.length) return;
    exporttoexcel(rows, "InvoiceRegister", `Invoice_Register_${monthYear}_${status}.xlsx`);
  };

  return (
    <Box
      sx={{
        maxWidth: 1280,
        mx: "auto",
        mt: 15,
        px: { xs: 1.5, md: 0 },
        fontFamily: "Arial",
      }}
    >
      <Card
        sx={{
          width: "100%",
          m: "auto",
          mt: 1.25,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          "& .MuiTypography-root, & .MuiInputBase-input, & .MuiInputLabel-root": {
            fontFamily: "Arial",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.2 } }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0f4ea6",
              letterSpacing: "0.01em",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Invoice Register
          </Typography>

          <Box
            sx={{
              mt: 1.2,
              borderRadius: 2,
              border: "1px solid #d5e1f8",
              boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
              background: "#ffffff",
              p: { xs: 1.4, md: 1.7 },
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Month-Year</InputLabel>
                  <Select
                    value={monthYear}
                    label="Month-Year"
                    onChange={(e) => setMonthYear(e.target.value)}
                    size="small"
                  >
                    {months.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value)}>
                  <FormControlLabel value="Open" control={<Radio />} label="Open" />
                  <FormControlLabel value="Closed" control={<Radio />} label="Closed" />
                  <FormControlLabel value="All" control={<Radio />} label="All" />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={fetchInvoiceRows}
                  disabled={loading}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                  }}
                >
                  {loading ? "Loading..." : "Load Data"}
                </Button>
              </Grid>

              <Grid item xs={12} md={3}>
                <ExportButton
                  label={loading ? "Exporting..." : "Export to Excel"}
                  onClick={handleExport}
                  disabled={loading || rows.length === 0}
                />
              </Grid>
            </Grid>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <CircularProgress />
            </Box>
          ) : rows.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                mt: 2,
                border: "1px dashed #a8bfdc",
                borderRadius: 2,
                p: 2.2,
                textAlign: "center",
                color: "#4c6282",
                background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
              }}
            >
              <Typography>No records found.</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                mt: 2,
                p: 0.7,
                borderRadius: 2,
                border: "1px solid #d5e3f8",
                background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
                boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
              }}
            >
              <CustomDataGrid2
                rows={rows}
                columns={invoiceColumns}
                title="Invoice Register"
                loading={loading}
                gridHeight={580}
                searchableFields={invoiceSearchableFields}
                placeholder="Search invoices..."
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceRegister;
