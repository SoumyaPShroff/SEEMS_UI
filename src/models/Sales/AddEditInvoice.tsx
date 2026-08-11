import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography, Divider, Paper, Button as MuiButton, Checkbox, FormControlLabel } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ReceiptLong } from "@mui/icons-material";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Button from "../../components/resusablecontrols/Button";
import { baseUrl } from "../../const/BaseUrl";

type Option = {
  value: string | number;
  label: string;
};

type ActionType = "Add" | "Edit";

// Composite key encodings for dropdown values - joined with "|" since none of these
// business identifiers can themselves contain that character.
const addKey = (jobNumber: string, jobId: string, sno: string) => `${jobNumber}|${jobId}|${sno}`;
const parseAddKey = (key: string) => {
  const [jobNumber, jobId, sno] = key.split("|");
  return { jobNumber, jobId, sno };
};
const editKey = (jobNumber: string, invoiceCount: number | string) => `${jobNumber}|${invoiceCount}`;
const parseEditKey = (key: string) => {
  const [jobNumber, invoiceCount] = key.split("|");
  return { jobNumber, invoiceCount };
};

type InvoiceJobContext = {
  customerApprovedHrs: number | null;
  wipHrs: number | null;
  lastTimesheetClosedDate: string | null;
  timesheetNotYetClosed: boolean;
  ratePerHour: number | null;
  poNumber: string | null;
};

const toDateInput = (value: string | null | undefined) => (value ? value.substring(0, 10) : "");

// Strips "-", "+", "e"/"E" and any other non-numeric characters so a field can never go negative
const sanitizeNonNegativeNumber = (raw: string): string => {
  let value = raw.replace(/[^0-9.]/g, "");
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, "");
  }
  return value;
};

const AddEditInvoice = () => {
  const navigate = useNavigate();

  const [actionType, setActionType] = useState<ActionType>("Add");
  const [saving, setSaving] = useState(false);

  // ---- Add mode state ----
  const [jobOptions, setJobOptions] = useState<Option[]>([]);
  const [selectedJobKey, setSelectedJobKey] = useState("");
  const [context, setContext] = useState<InvoiceJobContext | null>(null);
  const [loadingJobOptions, setLoadingJobOptions] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);

  // ---- Edit mode state ----
  const [editOptions, setEditOptions] = useState<Option[]>([]);
  const [selectedEditKey, setSelectedEditKey] = useState("");
  const [loadingEditOptions, setLoadingEditOptions] = useState(false);
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);

  // ---- Shared editable fields ----
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceHours, setInvoiceHours] = useState("");
  const [ratePerHour, setRatePerHour] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [isCreditNote, setIsCreditNote] = useState(false);
  const [invoiceNo, setInvoiceNo] = useState(""); // Edit mode only - display only, backend-generated

  // Deep-link entry (mirrors invoicing.aspx's ?jobnumber=<job> TotalHrs=<n> Click=<True|False>,
  // from the upstream "Raise Flag Register" page): resolved once the relevant option list has
  // loaded, since we need to match it against a real job/invoice option to select it.
  const [pendingDeepLink, setPendingDeepLink] = useState<{ jobNumber: string; totalHrs: string; isAdd: boolean } | null>(null);

  const fieldLabelStyle = { fontSize: 12, fontWeight: 600, color: "#243a5a", mb: 0.3 };
  const readOnlyLabelStyle = { fontSize: 11.5, fontWeight: 400, color: "#243a5a", mb: 0.2 };
  const readOnlyValueStyle = { fontSize: "0.85rem", fontWeight: 600, color: "#0f2d55" };

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

  const resetSharedFields = () => {
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setInvoiceHours("");
    setRatePerHour("");
    setInvoiceAmount("");
    setPoNumber("");
    setIsCreditNote(false);
    setInvoiceNo("");
  };

  const resetAddSelection = () => {
    setSelectedJobKey("");
    setContext(null);
    resetSharedFields();
  };

  const resetEditSelection = () => {
    setSelectedEditKey("");
    resetSharedFields();
  };

  const handleActionTypeChange = (type: ActionType) => {
    setActionType(type);
    resetAddSelection();
    resetEditSelection();
  };

  // Load dropdown data on mount, and parse any deep-link query string.
  useEffect(() => {
    const loadJobOptions = async () => {
      setLoadingJobOptions(true);
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/InvoiceableJobs`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setJobOptions(
          rows.map((r: any) => ({
            value: addKey(r.jobNumber, r.jobId, r.sno),
            label: `${r.jobNumber} (WIP #${r.sno})`,
          }))
        );
      } catch (error) {
        console.error("Failed to load invoiceable jobs:", error);
        toast.error("Unable to load jobs available for invoicing.");
      } finally {
        setLoadingJobOptions(false);
      }
    };

    const loadEditOptions = async () => {
      setLoadingEditOptions(true);
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/InvoiceEditOptions`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setEditOptions(
          rows.map((r: any) => ({
            value: editKey(r.jobNumber, r.invoiceCount),
            label: `${r.jobNumber} (Invoice #${r.invoiceCount})`,
          }))
        );
      } catch (error) {
        console.error("Failed to load existing invoices:", error);
        toast.error("Unable to load existing invoices.");
      } finally {
        setLoadingEditOptions(false);
      }
    };

    void loadJobOptions();
    void loadEditOptions();

    // Legacy format (URL-decoded): "<jobnumber> TotalHrs=<n> Click=<True|False>", with any
    // stray "'" characters stripped.
    const raw = new URLSearchParams(window.location.search).get("jobnumber");
    if (raw) {
      const cleaned = raw.replace(/'+/g, "");
      const jobNumber = cleaned.replace(/\s*TotalHrs=.*/i, "").trim();
      const totalHrsMatch = cleaned.match(/TotalHrs=([\d.]+)/i);
      const clickMatch = cleaned.match(/Click=(True|False)/i);
      setPendingDeepLink({
        jobNumber,
        totalHrs: totalHrsMatch ? totalHrsMatch[1] : "",
        isAdd: clickMatch ? clickMatch[1].toLowerCase() === "true" : true,
      });
    }
  }, []);

  // ---- Add mode handlers ----
  const loadJobContext = async (jobNumber: string) => {
    setContext(null);
    setLoadingContext(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/InvoiceJobContext/${encodeURIComponent(jobNumber)}`);
      const d: InvoiceJobContext = res.data;
      setContext(d);
      setRatePerHour(d.ratePerHour != null ? String(d.ratePerHour) : "");
      setPoNumber(d.poNumber || "");
    } catch (error) {
      console.error("Failed to load invoice job context:", error);
      toast.error("Unable to load job details for invoicing.");
    } finally {
      setLoadingContext(false);
    }
  };

  const handleJobChange = async (e: any) => {
    const key = e.target.value;
    setSelectedJobKey(key);
    resetSharedFields();
    setInvoiceDate(new Date().toISOString().split("T")[0]);

    if (!key) {
      setContext(null);
      return;
    }
    const { jobNumber } = parseAddKey(key);
    await loadJobContext(jobNumber);
  };

  // Invoice Amount auto-recomputes from Hours x Rate whenever either changes - matches legacy's
  // PO_Hours_TextChanged/TextBox3_TextChanged postback handlers. Still directly editable by the
  // user afterward, until Hours or Rate change again.
  useEffect(() => {
    const hrs = Number(invoiceHours);
    const rate = Number(ratePerHour);
    if (invoiceHours !== "" && ratePerHour !== "" && !isNaN(hrs) && !isNaN(rate)) {
      setInvoiceAmount(String(hrs * rate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceHours, ratePerHour]);

  // ---- Edit mode handlers ----
  const handleEditSelectionChange = async (e: any) => {
    const key = e.target.value;
    setSelectedEditKey(key);
    resetSharedFields();

    if (!key) return;
    const { jobNumber, invoiceCount } = parseEditKey(key);

    setLoadingEditDetails(true);
    try {
      const res = await axios.get(
        `${baseUrl}/api/Sales/InvoiceEditDetails/${encodeURIComponent(jobNumber)}/${encodeURIComponent(invoiceCount)}`
      );
      const d = res.data;
      setInvoiceAmount(d.poAmount != null ? String(d.poAmount) : "");
      setInvoiceDate(toDateInput(d.invoiceDate));
      setRatePerHour(d.ratePerHour != null ? String(d.ratePerHour) : "");
      setInvoiceNo(d.invoiceNo || "");
      setInvoiceHours(d.invoiceHours != null ? String(d.invoiceHours) : "");
      setPoNumber(d.poNumber || "");
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      toast.error("Unable to load the selected invoice's details.");
    } finally {
      setLoadingEditDetails(false);
    }
  };

  // ---- Deep-link resolution ----
  useEffect(() => {
    if (!pendingDeepLink) return;

    if (pendingDeepLink.isAdd) {
      if (jobOptions.length === 0) return;
      const match = jobOptions.find((o) => o.label.startsWith(`${pendingDeepLink.jobNumber} (`));
      if (!match) return;
      setActionType("Add");
      setSelectedJobKey(String(match.value));
      setInvoiceDate(new Date().toISOString().split("T")[0]);
      setInvoiceHours(pendingDeepLink.totalHrs);
      const { jobNumber } = parseAddKey(String(match.value));
      void loadJobContext(jobNumber);
      setPendingDeepLink(null);
    } else {
      if (editOptions.length === 0) return;
      const match = editOptions.find((o) => o.label.startsWith(`${pendingDeepLink.jobNumber} (`));
      if (!match) return;
      setActionType("Edit");
      setSelectedEditKey(String(match.value));
      void handleEditSelectionChange({ target: { value: String(match.value) } });
      setPendingDeepLink(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDeepLink, jobOptions, editOptions]);

  // ---- Save ----
  const handleSave = async () => {
    if (!invoiceDate) {
      toast.error("Please select the Date of Invoice.");
      return;
    }
    if (!invoiceHours || Number(invoiceHours) <= 0) {
      toast.error("Please enter Invoice Hours greater than zero.");
      return;
    }
    if (!ratePerHour || Number(ratePerHour) <= 0) {
      toast.error("Please enter a valid Rate per Hour.");
      return;
    }
    if (!invoiceAmount || Number(invoiceAmount) <= 0) {
      toast.error("Please enter a valid Invoice Amount.");
      return;
    }
    setSaving(true);
    try {
      if (actionType === "Add") {
        if (!selectedJobKey) {
          toast.error("Please select a Job Number.");
          setSaving(false);
          return;
        }
        const { jobNumber, jobId, sno } = parseAddKey(selectedJobKey);
        const res = await axios.post(`${baseUrl}/api/Sales/AddInvoice`, {
          jobId,
          sno,
          jobNumber,
          invoiceDate,
          invoiceHours: Number(invoiceHours),
          ratePerHour: Number(ratePerHour),
          invoiceAmount: Number(invoiceAmount),
          poNumber: poNumber || null,
        });
        toast.success(res.data?.message || "Invoice added successfully.");
      } else {
        if (!selectedEditKey) {
          toast.error("Please select which invoice to update.");
          setSaving(false);
          return;
        }
        const { jobNumber, invoiceCount } = parseEditKey(selectedEditKey);
        const res = await axios.post(`${baseUrl}/api/Sales/EditInvoice`, {
          jobNumber,
          invoiceCount: Number(invoiceCount),
          poAmount: Number(invoiceAmount),
          invoiceDate,
          ratePerHour: Number(ratePerHour),
          invoiceHours: Number(invoiceHours),
          poNumber: poNumber || null,
          isCreditNote,
        });
        toast.success(res.data?.message || "Invoice updated successfully.");
      }
      // Delay the navigation so the success toast has time to show before the page changes.
      setTimeout(() => navigate("/Home/RaiseFlagRegister"), 800);
    } catch (error) {
      console.error("Failed to save invoice:", error);
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? error.message
          : error instanceof Error
          ? error.message
          : "Failed to save invoice.";
      toast.error(message);
      setSaving(false);
    }
  };

  const showDetailsCard = actionType === "Add" ? !!selectedJobKey : !!selectedEditKey;
  const canEditFields = actionType === "Add" ? !!selectedJobKey : !!selectedEditKey;

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
          maxWidth: 800,
          mx: "auto",
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.1 }}>
            Invoice Details
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            Raise a new invoice against a job's open WIP hours, or edit a previously raised invoice
          </Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography sx={fieldLabelStyle}>
            Action <span style={{ color: "#d32f2f" }}>*</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <MuiButton
              variant={actionType === "Add" ? "contained" : "outlined"}
              onClick={() => handleActionTypeChange("Add")}
              disabled={saving}
              size="small"
              sx={{ borderRadius: 2, flex: 1, textTransform: "none", py: 0.5 }}
            >
              Add Invoice Details
            </MuiButton>
            <MuiButton
              variant={actionType === "Edit" ? "contained" : "outlined"}
              onClick={() => handleActionTypeChange("Edit")}
              disabled={saving}
              size="small"
              sx={{ borderRadius: 2, flex: 1, textTransform: "none", py: 0.5 }}
            >
              Update Invoice Details
            </MuiButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Card sx={sectionCardStyle}>
          <Box sx={sectionHeaderStyle}>
            <ReceiptLong sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              {actionType === "Add" ? "Select Job" : "Select Invoice to Update"}
            </Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1, "&:last-child": { pb: 1 } }}>
            {actionType === "Add" ? (
              <Box>
                <Typography sx={fieldLabelStyle}>
                  Job Number <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <SelectControl
                  name="jobNumber"
                  label=""
                  value={selectedJobKey}
                  onChange={handleJobChange}
                  options={jobOptions}
                  required
                  width="100%"
                  height={32}
                  fontSize="0.85rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={loadingJobOptions}
                />
                {loadingContext && (
                  <Typography sx={{ fontSize: 11, color: "#6b7c93", mt: 0.5 }}>Loading job details...</Typography>
                )}
                {context && !loadingContext && (
                  <Box sx={{ mt: 0.75 }}>
                    <Typography sx={{ fontSize: 11.5, color: "#243a5a" }}>
                      Customer Approved Hrs: {context.customerApprovedHrs ?? 0}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: "#6b7c93" }}>
                      {context.timesheetNotYetClosed
                        ? "Timesheet Not Yet Closed For This Month."
                        : `Last Timesheet Closed Date: ${context.lastTimesheetClosedDate ?? "-"}`}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Box>
                <Typography sx={fieldLabelStyle}>
                  Job Number / Invoice <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <SelectControl
                  name="editSelection"
                  label=""
                  value={selectedEditKey}
                  onChange={handleEditSelectionChange}
                  options={editOptions}
                  required
                  width="100%"
                  height={32}
                  fontSize="0.85rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={loadingEditOptions}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {showDetailsCard && (
          <Card sx={{ ...sectionCardStyle, mt: 1 }}>
            <Box sx={sectionHeaderStyle}>
              <Typography variant="subtitle2" fontWeight={600}>
                Invoice Details
              </Typography>
            </Box>
            <CardContent sx={{ ...sectionContentStyle, p: 1, "&:last-child": { pb: 1 } }}>
              {loadingEditDetails ? (
                <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Loading invoice details...</Typography>
              ) : (
                canEditFields && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                      gap: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={fieldLabelStyle}>
                        Date of Invoice <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>
                      <TextControl
                        name="invoiceDate"
                        type="date"
                        value={invoiceDate}
                        onChange={(e: any) => setInvoiceDate(e.target.value)}
                        disabled={saving}
                        fullWidth
                        style={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={fieldLabelStyle}>
                        Invoice Hours <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>
                      <TextControl
                        name="invoiceHours"
                        type="number"
                        value={invoiceHours}
                        onChange={(e: any) => setInvoiceHours(sanitizeNonNegativeNumber(e.target.value))}
                        disabled={saving}
                        fullWidth
                        style={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={fieldLabelStyle}>
                        Rate per Hr <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>
                      <TextControl
                        name="ratePerHour"
                        type="number"
                        value={ratePerHour}
                        onChange={(e: any) => setRatePerHour(e.target.value)}
                        disabled={saving}
                        fullWidth
                        style={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={fieldLabelStyle}>
                        Invoice Amount <span style={{ color: "#d32f2f" }}>*</span>
                      </Typography>
                      <TextControl
                        name="invoiceAmount"
                        type="number"
                        value={invoiceAmount}
                        onChange={(e: any) => setInvoiceAmount(sanitizeNonNegativeNumber(e.target.value))}
                        disabled={saving}
                        fullWidth
                        style={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={readOnlyLabelStyle}>PO Number</Typography>
                      <Typography sx={readOnlyValueStyle}>{poNumber || "-"}</Typography>
                    </Box>
                    {actionType === "Edit" && (
                      <Box>
                        <Typography sx={readOnlyLabelStyle}>Invoice No</Typography>
                        <Typography sx={readOnlyValueStyle}>{invoiceNo || "-"}</Typography>
                      </Box>
                    )}
                    {actionType === "Edit" && (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isCreditNote}
                              onChange={(e) => setIsCreditNote(e.target.checked)}
                              disabled={saving}
                              size="small"
                            />
                          }
                          label={
                            <Typography sx={{ fontSize: "0.8rem", color: "#243a5a" }}>
                              Credit Note (generate next invoice no.)
                            </Typography>
                          }
                        />
                      </Box>
                    )}
                  </Box>
                )
              )}
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button label="Cancel" onClick={() => navigate("/Home/ViewAllJobs")} variant="outlined" disabled={saving} />
          <Button
            label={saving ? "Saving..." : actionType === "Add" ? "Submit" : "Update"}
            onClick={handleSave}
            variant="contained"
            disabled={saving || !canEditFields}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AddEditInvoice;
