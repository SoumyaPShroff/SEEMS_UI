import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography, Divider, Paper } from "@mui/material";
import { toast } from "react-toastify";
import { EventNote } from "@mui/icons-material";
import type { GridColDef } from "@mui/x-data-grid";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Button from "../../components/resusablecontrols/Button";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../utils/exporttoexcel";
import { baseUrl } from "../../const/BaseUrl";
import { formatDateYYYYMMDD } from "../../utils/DateUtils";

type Option = {
  value: string | number;
  label: string;
};

type HistoryRow = {
  id: number;
  seqNo: number;
  companyName: string;
  contactPerson: string;
  calledDate: string;
  reachedBy: string;
  modeOfMeeting: string;
  remarks: string;
  followupDate: string;
};

const modeOfMeetingOptions: Option[] = [
  { value: "Phone", label: "Phone" },
  { value: "Email", label: "Email" },
  { value: "Conference Call", label: "Conference Call" },
  { value: "At Office", label: "At Office" },
  { value: "At Customer Place", label: "At Customer Place" },
  { value: "Teams Call", label: "Teams Call" },
  {value: "At Expo", label: "At Expo" },
  { value: "Others", label: "Others" },
];

const todayInput = () => new Date().toISOString().split("T")[0];

const SalesMeetingRecorder = () => {
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUserName = sessionStorage.getItem("SessionUserName") || "guestName";

  const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [calledDate, setCalledDate] = useState(todayInput());
  const [reachedBy, setReachedBy] = useState("");
  const [modeOfMeeting, setModeOfMeeting] = useState("");
  const [remarks, setRemarks] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);

  const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: "#243a5a", mb: 0.3 };

  const sectionCardStyle = {
    borderRadius: 3,
    border: "1px solid #d9e4f5",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
  };
  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 1.5,
    py: 0.75,
    background: "linear-gradient(90deg,#0f4ea6,#3c78d8)",
    color: "white",
    minHeight: 34,
  };
  const sectionContentStyle = { background: "linear-gradient(180deg,#ffffff 0%,#f2f7ff 100%)" };
  const inputStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.85rem",
    borderRadius: 6,
    border: "1px solid #cfd9ea",
    padding: "5px 10px",
    minHeight: 32,
    boxSizing: "border-box" as const,
    width: "100%",
    backgroundColor: "#fff",
  };

  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true);
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/SalesMeetingCustomers`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setCustomerOptions(rows.map((c: string) => ({ value: c, label: c })));
      } catch (error) {
        console.error("Failed to load customers:", error);
        toast.error("Unable to load customers.");
      } finally {
        setLoadingCustomers(false);
      }
    };

    void loadCustomers();
  }, []);

  const clearFields = () => {
    setCustomerName("");
    setContactPerson("");
    setCalledDate(todayInput());
    setReachedBy("");
    setModeOfMeeting("");
    setRemarks("");
    setFollowupDate("");
  };

  const handleSubmit = async () => {
    if (!customerName) {
      toast.error("Please select the Customer Name.");
      return;
    }
    if (!contactPerson.trim()) {
      toast.error("Please enter the Contact Person.");
      return;
    }
    if (!calledDate) {
      toast.error("Please select the Called Date.");
      return;
    }
    if (!reachedBy.trim()) {
      toast.error("Please enter the Reached By.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${baseUrl}/api/Sales/AddSalesMeetingRecord`, {
        customerName,
        contactPerson: contactPerson.trim(),
        calledDate,
        reachedBy: reachedBy.trim(),
        modeOfMeeting: modeOfMeeting || null,
        remarks: remarks || null,
        followupDate: followupDate || null,
        sessionLoginId: loginId,
        sessionLoginName: loginUserName,
      });
      toast.success(res.data?.message || "Record added successfully.");
      clearFields();
      if (showHistory) {
        void loadHistory();
      }
    } catch (error) {
      console.error("Failed to add sales meeting record:", error);
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? error.message
          : error instanceof Error
          ? error.message
          : "Record failed to add.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/SalesMeetingHistory`);
      const rows = Array.isArray(res.data) ? res.data : [];
      setHistoryRows(
        rows.map((r: any) => ({
          id: r.seqNo,
          seqNo: r.seqNo,
          companyName: r.companyName,
          contactPerson: r.contactPerson,
          calledDate: r.calledDate,
          reachedBy: r.reachedBy,
          modeOfMeeting: r.modeOfMeeting,
          remarks: r.remarks,
          followupDate: r.followupDate,
        }))
      );
    } catch (error) {
      console.error("Failed to load meeting history:", error);
      toast.error("Unable to load meeting history.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleViewHistory = async () => {
    setShowHistory(true);
    await loadHistory();
  };

  const handleExportHistory = () => {
    if (!historyRows || historyRows.length === 0) {
      toast.warning("No data available to export.");
      return;
    }

    const exportRows = historyRows.map((row) => ({
      ...row,
      calledDate: formatDateYYYYMMDD(row.calledDate),
      followupDate: formatDateYYYYMMDD(row.followupDate),
    }));

    exporttoexcel(
      {
        data: exportRows,
        sheetName: "Sales Meeting Recorder",
        fileName: "SalesMeetingHistory.xlsx",
        columns: [
          { field: "companyName", headerName: "Company Name" },
          { field: "contactPerson", headerName: "Contact Person" },
          { field: "calledDate", headerName: "Called Date" },
          { field: "reachedBy", headerName: "Reached By" },
          { field: "modeOfMeeting", headerName: "Mode of Meeting" },
          { field: "remarks", headerName: "Remarks" },
          { field: "followupDate", headerName: "Next Followup Date" },
          { field: "seqNo", headerName: "SI No" },
        ],
      }
    );
    toast.success("Meeting history exported!");
  };

  const historyColumns: GridColDef<HistoryRow>[] = [
    { field: "companyName", headerName: "Company Name", flex: 1, minWidth: 180 },
    { field: "contactPerson", headerName: "Contact Person", flex: 1, minWidth: 150 },
    {
      field: "calledDate",
      headerName: "Called Date",
      flex: 1,
      minWidth: 120,
      valueFormatter: (value: string) => formatDateYYYYMMDD(value),
    },
    { field: "reachedBy", headerName: "Reached By", flex: 1, minWidth: 140 },
    { field: "modeOfMeeting", headerName: "Mode of Meeting", flex: 1, minWidth: 150 },
    { field: "remarks", headerName: "Remarks", flex: 1.5, minWidth: 200 },
    {
      field: "followupDate",
      headerName: "Next Followup Date",
      flex: 1,
      minWidth: 150,
      valueFormatter: (value: string) => formatDateYYYYMMDD(value),
    },
    { field: "seqNo", headerName: "SI No", flex:1, minWidth: 100 }
  ];

  return (
    <Box sx={{ p: 2.5, background: "#f4f7fb", fontFamily: "'Inter', sans-serif" }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.1 }}>
            Sales Meeting Recorder
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            Log a customer call/meeting, and browse previously recorded meetings
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Card sx={sectionCardStyle}>
          <Box sx={sectionHeaderStyle}>
            <EventNote sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              Meeting Details
            </Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1, "&:last-child": { pb: 1 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              <Box>
                <Typography sx={fieldLabelStyle}>
                  Customer Name <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <SelectControl
                  name="customerName"
                  label=""
                  value={customerName}
                  onChange={(e: any) => setCustomerName(e.target.value)}
                  options={customerOptions}
                  required
                  width="100%"
                  height={32}
                  fontSize="0.85rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={loadingCustomers || saving}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>
                  Contact Person <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <TextControl
                  name="contactPerson"
                  value={contactPerson}
                  onChange={(e: any) => setContactPerson(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={inputStyle}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>
                  Called Date <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <TextControl
                  name="calledDate"
                  type="date"
                  value={calledDate}
                  onChange={(e: any) => setCalledDate(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={inputStyle}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>
                  Reached By <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <TextControl
                  name="reachedBy"
                  value={reachedBy}
                  onChange={(e: any) => setReachedBy(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={inputStyle}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>Mode of Meeting</Typography>
                <SelectControl
                  name="modeOfMeeting"
                  label=""
                  value={modeOfMeeting}
                  onChange={(e: any) => setModeOfMeeting(e.target.value)}
                  options={modeOfMeetingOptions}
                  width="100%"
                  height={32}
                  fontSize="0.85rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={saving}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>Next Followup Date</Typography>
                <TextControl
                  name="followupDate"
                  type="date"
                  value={followupDate}
                  onChange={(e: any) => setFollowupDate(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={inputStyle}
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "auto", sm: "span 2", md: "span 2" } }}>
                <Typography sx={fieldLabelStyle}>Remarks</Typography>
                <TextControl
                  name="remarks"
                  value={remarks}
                  onChange={(e: any) => setRemarks(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={{ ...inputStyle, minHeight: 60 }}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1.5, mt: 1.5 }}>
          <Button
            label="View Meeting History"
            onClick={handleViewHistory}
            variant="outlined"
            disabled={loadingHistory}
          />
          <Button
            label={saving ? "Saving..." : "Submit"}
            onClick={handleSubmit}
            variant="contained"
            disabled={saving}
          />
        </Box>

        {showHistory && (
          <Box sx={{ mt: 1.5 }}>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.5 }}>
              <ExportButton
                label="Export to Excel"
                onClick={handleExportHistory}
                disabled={loadingHistory || historyRows.length === 0}
              />
            </Box>
            <Box
              sx={{
                p: 0.7,
                borderRadius: 2,
                border: "1px solid #d5e3f8",
                background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
                boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
              }}
            >
              <CustomDataGrid2
                rows={historyRows}
                columns={historyColumns}
                title="Meeting History"
                loading={loadingHistory}
                gridHeight={420}
                placeholder="Search for any field..."
              />
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SalesMeetingRecorder;
