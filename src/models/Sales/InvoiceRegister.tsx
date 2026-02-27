import React, { useMemo, useState } from "react";
import {FormControl, Select, MenuItem, RadioGroup, FormControlLabel, Radio, Grid, InputLabel,
 Box,  Card,  CardContent,Typography,} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";
import ExportButton from "../../components/resusablecontrols/ExportButton";

const InvoiceRegister = () => {
  const [monthYear, setMonthYear] = useState(dayjs().format("MMM-YYYY"));
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(false);

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

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await axios.post("/api/Sales/InvoiceRegister", { monthYear, status, },{responseType: "blob",});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Invoice_Register_${monthYear}_${status}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 650,
        mx: "auto",
        mt: 20,
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
              <Grid item xs={12} md={4}>
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

              <Grid item xs={12} md={4}>
                <RadioGroup row value={status} onChange={(e) => setStatus(e.target.value)}>
                  <FormControlLabel value="Open" control={<Radio />} label="Open" />
                  <FormControlLabel value="Closed" control={<Radio />} label="Closed" />
                  <FormControlLabel value="All" control={<Radio />} label="All" />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} md={4}>
                <ExportButton
                  label={loading ? "Exporting..." : "Export to Excel"}
                  onClick={handleExport}
                  disabled={loading}
                 />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InvoiceRegister;
