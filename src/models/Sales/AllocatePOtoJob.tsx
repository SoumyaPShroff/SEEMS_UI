import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography, Divider, Paper, Button as MuiButton } from "@mui/material";
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

type AllocationDetails = {
  billingType: string;
  poHours: number;
  alreadyAllocatedHours: number;
  balancePoHours: number;
  ratePerHour: number | null;
  poDate: string | null;
  currency: string;
  conversionRate: number | null;
  paymentTerm: string | null;
};

type AllocationRow = {
  sno: number;
  jobNumber: string;
  poNumber: string;
  poAmount: string;
  poDate: string | null;
  conversionRate: number | null;
  currency: string;
  poReceived: string;
  deliveryDate: string | null;
  poStartDate: string | null;
  ratePerHour: number | null;
  allocatedHours: number | null;
  balancePoHours: number | null;
  contingencyHours: number | null;
  comments: string | null;
  billingType: string | null;
  paymentTerm: string | null;
};

const toDateInput = (value: string | null | undefined) => (value ? value.substring(0, 10) : "");

const sanitizeHoursInput = (raw: string, maxDigits = 5) => {
  let digitCount = 0;
  let result = "";
  for (const ch of raw) {
    if (ch >= "0" && ch <= "9") {
      if (digitCount >= maxDigits) continue;
      digitCount++;
      result += ch;
    } else if (ch === "." && !result.includes(".")) {
      result += ch;
    }
  }
  return result;
};

const AddEditPOtoJob = () => {
  const navigate = useNavigate();

  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUserName = sessionStorage.getItem("SessionUserName") || "guestName";

  const [actionType, setActionType] = useState<ActionType>("Add");
  const [saving, setSaving] = useState(false);

  // ---- Add mode state ----
  const [openJobOptions, setOpenJobOptions] = useState<Option[]>([]);
  const [selectedJobNumber, setSelectedJobNumber] = useState("");
  const [poOptions, setPoOptions] = useState<Option[]>([]);
  const [selectedPoNumber, setSelectedPoNumber] = useState("");
  const [details, setDetails] = useState<AllocationDetails | null>(null);
  const [loadingPoOptions, setLoadingPoOptions] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ---- Edit mode state ----
  const [allocJobOptions, setAllocJobOptions] = useState<Option[]>([]);
  const [selectedAllocJobNumber, setSelectedAllocJobNumber] = useState("");
  const [allocationOptions, setAllocationOptions] = useState<Option[]>([]);
  const [selectedSno, setSelectedSno] = useState<number | "">("");
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationRow | null>(null);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);

  // ---- Shared editable fields ----
  const [poReceived, setPoReceived] = useState("YES");
  const [allocatedHours, setAllocatedHours] = useState("");
  const [poStartDate, setPoStartDate] = useState("");
  const [poDate, setPoDate] = useState("");
  const [contingencyHours, setContingencyHours] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [comments, setComments] = useState("");

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

  const poReceivedOptions: Option[] = [
    { value: "YES", label: "YES" },
    { value: "NO", label: "NO" },
  ];

  const resetSharedFields = () => {
    setPoReceived("YES");
    setAllocatedHours("");
    setPoStartDate("");
    setPoDate("");
    setContingencyHours("");
    setDeliveryDate("");
    setComments("");
  };

  const resetAddSelection = () => {
    setSelectedJobNumber("");
    setSelectedPoNumber("");
    setPoOptions([]);
    setDetails(null);
    resetSharedFields();
  };

  const resetEditSelection = () => {
    setSelectedAllocJobNumber("");
    setSelectedSno("");
    setAllocationOptions([]);
    setSelectedAllocation(null);
    setLiveBalance(null);
    resetSharedFields();
  };

  const handleActionTypeChange = (type: ActionType) => {
    setActionType(type);
    resetAddSelection();
    resetEditSelection();
  };

  // Load dropdown data on mount
  useEffect(() => {
    const loadOpenJobs = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/Job/OpenJobNumbers`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setOpenJobOptions(rows.map((j: any) => ({ value: j.number, label: j.number })));
      } catch (error) {
        console.error("Failed to load open jobs:", error);
        toast.error("Unable to load open jobs.");
      }
    };

    const loadAllocJobs = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/Job/JobNumbersWithAllocations`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setAllocJobOptions(rows.map((j: any) => ({ value: j.number, label: j.number })));
      } catch (error) {
        console.error("Failed to load jobs with PO allocations:", error);
        toast.error("Unable to load jobs with existing PO allocations.");
      }
    };

    void loadOpenJobs();
    void loadAllocJobs();
  }, []);

  // ---- Add mode handlers ----
  const handleJobChange = async (e: any) => {
    const jobNumber = e.target.value;
    setSelectedJobNumber(jobNumber);
    setSelectedPoNumber("");
    setDetails(null);
    setPoOptions([]);
    resetSharedFields();

    if (!jobNumber) return;

    setLoadingPoOptions(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Job/AllocatablePONumbers/${encodeURIComponent(jobNumber)}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      setPoOptions(
        rows.map((p: any) => ({
          value: p.poNumber,
          label: `${p.poNumber} ---- ${p.balanceAmount} (${p.enquiryNo})`,
        }))
      );
    } catch (error) {
      console.error("Failed to load PO numbers:", error);
      toast.error("Unable to load PO numbers for the selected job.");
    } finally {
      setLoadingPoOptions(false);
    }
  };

  const handlePoChange = async (e: any) => {
    const poNumber = e.target.value;
    setSelectedPoNumber(poNumber);
    setDetails(null);
    resetSharedFields();

    if (!poNumber || !selectedJobNumber) return;

    setLoadingDetails(true);
    try {
      const res = await axios.get(
        `${baseUrl}/api/Job/POJobAllocationDetails/${encodeURIComponent(selectedJobNumber)}/${encodeURIComponent(poNumber)}`
      );
      setDetails(res.data);
    } catch (error) {
      console.error("Failed to load PO allocation details:", error);
      toast.error("Unable to load PO details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const addModeBalance =
    details && allocatedHours !== "" && !isNaN(Number(allocatedHours))
      ? details.balancePoHours - Number(allocatedHours)
      : details?.balancePoHours ?? null;

  const addModeAmount =
    details && details.ratePerHour != null && allocatedHours !== "" && !isNaN(Number(allocatedHours))
      ? details.ratePerHour * Number(allocatedHours)
      : null;

  // ---- Edit mode handlers ----
  const [lastLoadedRows, setLastLoadedRows] = useState<AllocationRow[]>([]);

  const handleAllocJobChange = async (e: any) => {
    const jobNumber = e.target.value;
    setSelectedAllocJobNumber(jobNumber);
    setSelectedSno("");
    setAllocationOptions([]);
    setSelectedAllocation(null);
    setLastLoadedRows([]);
    setLiveBalance(null);
    resetSharedFields();

    if (!jobNumber) return;

    setLoadingAllocations(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Job/AllocationsByJob/${encodeURIComponent(jobNumber)}`);
      const rows: AllocationRow[] = (Array.isArray(res.data) ? res.data : []).map((r: any) => ({
        sno: r.sno,
        jobNumber: r.jobNumber,
        poNumber: r.poNumber,
        poAmount: r.poAmount,
        poDate: r.poDate,
        conversionRate: r.conversionRate,
        currency: r.currency,
        poReceived: r.poReceived,
        deliveryDate: r.deliveryDate,
        poStartDate: r.poStartDate,
        ratePerHour: r.ratePerHour,
        allocatedHours: r.allocatedHours,
        balancePoHours: r.balancePoHours,
        contingencyHours: r.contingencyHours,
        comments: r.comments,
        billingType: r.billingType,
        paymentTerm: r.paymentTerm,
      }));

      setLastLoadedRows(rows);
      setAllocationOptions(rows.map((r) => ({ value: r.sno, label: `${r.poNumber} (Allocation #${r.sno})` })));

      if (rows.length === 1) {
        await selectAllocation(rows[0]);
      }
    } catch (error) {
      console.error("Failed to load allocations for job:", error);
      toast.error("Unable to load PO allocations for the selected job.");
    } finally {
      setLoadingAllocations(false);
    }
  };

  const selectAllocation = async (row: AllocationRow) => {
    setSelectedSno(row.sno);
    setSelectedAllocation(row);
    setPoReceived(row.poReceived || "");
    setAllocatedHours(row.allocatedHours != null ? String(row.allocatedHours) : "");
    setPoStartDate(toDateInput(row.poStartDate));
    setContingencyHours(row.contingencyHours != null ? String(row.contingencyHours) : "");
    setDeliveryDate(toDateInput(row.deliveryDate));
    setComments(row.comments || "");

    // Fetch fresh total/allocated hours for this PO so the live balance preview matches
    // exactly what the server will recompute on save.
    try {
      const res = await axios.get(
        `${baseUrl}/api/Job/POJobAllocationDetails/${encodeURIComponent(row.jobNumber)}/${encodeURIComponent(row.poNumber)}`
      );
      const d: AllocationDetails = res.data;
      const otherAllocated = d.alreadyAllocatedHours - (row.allocatedHours ?? 0);
      setLiveBalance(d.poHours - otherAllocated - (row.allocatedHours ?? 0));
      setDetails(d);
    } catch (error) {
      console.error("Failed to load fresh PO details for edit preview:", error);
    }
  };

  const handleAllocationChange = (e: any) => {
    const sno = Number(e.target.value);
    const row = lastLoadedRows.find((r) => r.sno === sno);
    if (row) void selectAllocation(row);
  };

  const editModeBalance =
    liveBalance != null && allocatedHours !== "" && !isNaN(Number(allocatedHours)) && selectedAllocation
      ? liveBalance + (selectedAllocation.allocatedHours ?? 0) - Number(allocatedHours)
      : liveBalance;

  // ---- Save ----
  const handleSave = async () => {
    if (!poReceived) {
      toast.error("Please select whether the PO has been received.");
      return;
    }
    if (!allocatedHours || Number(allocatedHours) <= 0) {
      toast.error("Please enter Allocated Hours greater than zero.");
      return;
    }
    if (!deliveryDate) {
      toast.error("Please select the Expected Delivery Date.");
      return;
    }

    setSaving(true);
    try {
      if (actionType === "Add") {
        if (!selectedJobNumber || !selectedPoNumber) {
          toast.error("Please select a job number and PO number.");
          setSaving(false);
          return;
        }
        const res = await axios.post(`${baseUrl}/api/Job/AddPOJobAllocation`, {
          jobNumber: selectedJobNumber,
          poNumber: selectedPoNumber,
          poReceived,
          allocatedHours: Number(allocatedHours),
          poStartDate: poStartDate || null,
          poDate: poDate || null,
          contingencyHours: contingencyHours ? Number(contingencyHours) : null,
          comments: comments || null,
          deliveryDate,
          sessionLoginName: loginUserName,
          sessionLoginId: loginId,
        });
        toast.success(res.data?.message || "PO allocated to job successfully.");
      } else {
        if (!selectedSno) {
          toast.error("Please select which allocation to edit.");
          setSaving(false);
          return;
        }
        const res = await axios.post(`${baseUrl}/api/Job/EditPOJobAllocation`, {
          sno: selectedSno,
          poReceived,
          allocatedHours: Number(allocatedHours),
          poStartDate: poStartDate || null,
          contingencyHours: contingencyHours ? Number(contingencyHours) : null,
          comments: comments || null,
          deliveryDate,
          sessionLoginName: loginUserName,
          sessionLoginId: loginId,
        });
        toast.success(res.data?.message || "PO allocation updated successfully.");
      }
      navigate("/Home/ViewAllJobs");
    } catch (error) {
      console.error("Failed to save PO-to-job allocation:", error);
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? error.message
          : error instanceof Error
          ? error.message
          : "Failed to save PO allocation.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const currentBillingType = actionType === "Add" ? details?.billingType : selectedAllocation?.billingType;
  const currentBalance = actionType === "Add" ? addModeBalance : editModeBalance;
  const showDetailsCard = actionType === "Add" ? !!details : !!selectedAllocation;
  const canEditFields = actionType === "Add" ? !!selectedPoNumber : !!selectedSno;

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
            PO Allocation to Job
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
            Allocate an existing PO's hours to a job, or edit a previously allocated PO
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
              Add PO to Job
            </MuiButton>
            <MuiButton
              variant={actionType === "Edit" ? "contained" : "outlined"}
              onClick={() => handleActionTypeChange("Edit")}
              disabled={saving}
              size="small"
              sx={{ borderRadius: 2, flex: 1, textTransform: "none", py: 0.5 }}
            >
              Edit Existing Allocation
            </MuiButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Card sx={sectionCardStyle}>
          <Box sx={sectionHeaderStyle}>
            <ReceiptLong sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>
              {actionType === "Add" ? "Select Job and PO" : "Select Allocation to Edit"}
            </Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1, "&:last-child": { pb: 1 } }}>
            {actionType === "Add" ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={fieldLabelStyle}>
                    Job Number <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <SelectControl
                    name="jobNumber"
                    label=""
                    value={selectedJobNumber}
                    onChange={handleJobChange}
                    options={openJobOptions}
                    required
                    width="100%"
                    height={32}
                    fontSize="0.85rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75 }}>
                    <Typography sx={fieldLabelStyle}>
                      PO Number <span style={{ color: "#d32f2f" }}>*</span>
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: "#6b7c93", fontStyle: "italic" }}>
                      (shows PO No -- Bal Amt (Enquiry No))
                    </Typography>
                  </Box>
                  <SelectControl
                    name="poNumber"
                    label=""
                    value={selectedPoNumber}
                    onChange={handlePoChange}
                    options={poOptions}
                    required
                    width="100%"
                    height={32}
                    fontSize="0.85rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={!selectedJobNumber || loadingPoOptions}
                  />
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                <Box>
                  <Typography sx={fieldLabelStyle}>
                    Job Number <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <SelectControl
                    name="allocJobNumber"
                    label=""
                    value={selectedAllocJobNumber}
                    onChange={handleAllocJobChange}
                    options={allocJobOptions}
                    required
                    width="100%"
                    height={32}
                    fontSize="0.85rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                  />
                </Box>
                {allocationOptions.length > 1 && (
                  <Box>
                    <Typography sx={fieldLabelStyle}>
                      Allocation <span style={{ color: "#d32f2f" }}>*</span>
                    </Typography>
                    <SelectControl
                      name="allocation"
                      label=""
                      value={selectedSno}
                      onChange={handleAllocationChange}
                      options={allocationOptions}
                      required
                      width="100%"
                      height={32}
                      fontSize="0.85rem"
                      labelFontWeight={600}
                      shrinkLabel={false}
                      disabled={loadingAllocations}
                    />
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        {showDetailsCard && (
          <Card sx={{ ...sectionCardStyle, mt: 1 }}>
            <Box sx={sectionHeaderStyle}>
              <Typography variant="subtitle2" fontWeight={600}>
                PO Details
              </Typography>
            </Box>
            <CardContent sx={{ ...sectionContentStyle, p: 1, "&:last-child": { pb: 1 } }}>
              {loadingDetails ? (
                <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>Loading PO details...</Typography>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                      gap: 0.75,
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={readOnlyLabelStyle}>Billing Type</Typography>
                      <Typography sx={readOnlyValueStyle}>{currentBillingType || "-"}</Typography>
                    </Box>
                    {actionType === "Add" && details && (
                      <>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>PO Hrs</Typography>
                          <Typography sx={readOnlyValueStyle}>{details.poHours}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Rate / Hour</Typography>
                          <Typography sx={readOnlyValueStyle}>{details.ratePerHour ?? "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Currency</Typography>
                          <Typography sx={readOnlyValueStyle}>{details.currency || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Conversion Rate</Typography>
                          <Typography sx={readOnlyValueStyle}>{details.conversionRate ?? "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Payment Term</Typography>
                          <Typography sx={readOnlyValueStyle}>{details.paymentTerm || "-"}</Typography>
                        </Box>
                      </>
                    )}
                    {actionType === "Edit" && selectedAllocation && (
                      <>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>PO Number</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.poNumber}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Rate / Hour</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.ratePerHour ?? "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>PO Amount</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.poAmount}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>PO Date</Typography>
                          <Typography sx={readOnlyValueStyle}>{toDateInput(selectedAllocation.poDate) || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Currency</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.currency || "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Conversion Rate</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.conversionRate ?? "-"}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={readOnlyLabelStyle}>Payment Term</Typography>
                          <Typography sx={readOnlyValueStyle}>{selectedAllocation.paymentTerm || "-"}</Typography>
                        </Box>
                      </>
                    )}
                    <Box sx={{ background: "#f0f4ff", borderRadius: 2, p: 0.75 }}>
                      <Typography sx={readOnlyLabelStyle}>Balance PO Hrs</Typography>
                      <Typography sx={{ ...readOnlyValueStyle, color: "#2e7d32" }}>
                        {currentBalance != null ? currentBalance.toFixed(2) : "-"}
                      </Typography>
                    </Box>
                    {actionType === "Add" && (
                      <Box>
                        <Typography sx={readOnlyLabelStyle}>Allocated Amount</Typography>
                        <Typography sx={readOnlyValueStyle}>{addModeAmount != null ? addModeAmount.toFixed(2) : "-"}</Typography>
                      </Box>
                    )}
                  </Box>

                  {canEditFields && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography sx={fieldLabelStyle}>
                            PO Received <span style={{ color: "#d32f2f" }}>*</span>
                          </Typography>
                          <SelectControl
                            name="poReceived"
                            label=""
                            value={poReceived}
                            onChange={(e: any) => setPoReceived(e.target.value)}
                            options={poReceivedOptions}
                            required
                            width="100%"
                            height={32}
                            fontSize="0.85rem"
                            labelFontWeight={600}
                            shrinkLabel={false}
                            disabled={saving}
                          />
                        </Box>
                        <Box>
                          <Typography sx={fieldLabelStyle}>
                            Allocated Hours <span style={{ color: "#d32f2f" }}>*</span>
                          </Typography>
                          <TextControl
                            name="allocatedHours"
                            type="number"
                            value={allocatedHours}
                            onChange={(e: any) => setAllocatedHours(sanitizeHoursInput(e.target.value))}
                            disabled={saving}
                            fullWidth
                            style={{ ...inputStyle, minHeight: 26, padding: "3px 10px" }}
                          />
                        </Box>
                        {actionType === "Add" && (
                          <Box>
                            <Typography sx={fieldLabelStyle}>PO Date</Typography>
                            <TextControl
                              name="poDate"
                              type="date"
                              value={poDate}
                              onChange={(e: any) => setPoDate(e.target.value)}
                              disabled={saving}
                              fullWidth
                              style={inputStyle}
                            />
                          </Box>
                        )}
                        <Box>
                          <Typography sx={fieldLabelStyle}>Contingency Hours</Typography>
                          <TextControl
                            name="contingencyHours"
                            type="number"
                            value={contingencyHours}
                            onChange={(e: any) => setContingencyHours(sanitizeHoursInput(e.target.value))}
                            disabled={saving}
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                        <Box>
                          <Typography sx={fieldLabelStyle}>
                            Expected Delivery Date <span style={{ color: "#d32f2f" }}>*</span>
                          </Typography>
                          <TextControl
                            name="deliveryDate"
                            type="date"
                            value={deliveryDate}
                            onChange={(e: any) => setDeliveryDate(e.target.value)}
                            disabled={saving}
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                        <Box sx={{ gridColumn: { xs: "auto", sm: "span 2" } }}>
                          <Typography sx={fieldLabelStyle}>Comments</Typography>
                          <TextControl
                            name="comments"
                            value={comments}
                            onChange={(e: any) => setComments(e.target.value)}
                            disabled={saving}
                            fullWidth
                            style={{ ...inputStyle, minHeight: 40 }}
                          />
                        </Box>
                      </Box>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5 }}>
          <Button label="Cancel" onClick={() => navigate("/Home/ViewAllJobs")} variant="outlined" disabled={saving} />
          <Button
            label={saving ? "Saving..." : "Save"}
            onClick={handleSave}
            variant="contained"
            disabled={saving || !canEditFields}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AddEditPOtoJob;
