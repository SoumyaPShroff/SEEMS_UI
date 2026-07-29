import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography, Divider, Paper, Button as MuiButton } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { ContentCopy } from "@mui/icons-material";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Button from "../../components/resusablecontrols/Button";
import { baseUrl } from "../../const/BaseUrl";

type Option = {
  value: string | number;
  label: string;
};

type JobSummary = {
  jobNumber: string;
  jobName: string;
  customer: string;
  projectManager: string;
  costCenter: string;
};

type ActionType = "Scope" | "Revision";

const AddScopeRevisionJob = () => {
  const navigate = useNavigate();

  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUserName = sessionStorage.getItem("SessionUserName") || "guestName";

  const [actionType, setActionType] = useState<ActionType>("Scope");

  const [enquiryOptions, setEnquiryOptions] = useState<Option[]>([]);
  const [selectedEnquiry, setSelectedEnquiry] = useState("");

  const [jobOptions, setJobOptions] = useState<Option[]>([]);
  const [selectedJobNumber, setSelectedJobNumber] = useState("");
  const [jobSummary, setJobSummary] = useState<JobSummary | null>(null);

  const [newJobNumber, setNewJobNumber] = useState("");

  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  const fieldLabelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#243a5a",
    mb: 0.6,
  };

  const readOnlyLabelStyle = {
    fontSize: 13,
    fontWeight: 400,
    color: "#243a5a",
    mb: 0.6,
  };

  const sectionCardStyle = {
    borderRadius: 4,
    border: "1px solid #d9e4f5",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 2,
    py: 1.5,
    background: "linear-gradient(90deg,#0f4ea6,#3c78d8)",
    color: "white",
  };

  const sectionContentStyle = {
    background: "linear-gradient(180deg,#ffffff 0%,#f2f7ff 100%)",
  };

  const readOnlyValueStyle = {
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#0f2d55",
  };

  const wrapValueStyle = {
    ...readOnlyValueStyle,
    wordBreak: "break-word" as const,
    overflowWrap: "break-word" as const,
  };

  const inputStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    borderRadius: 8,
    border: "1px solid #cfd9ea",
    padding: "9px 12px",
    minHeight: 40,
    boxSizing: "border-box" as const,
    width: "100%",
    backgroundColor: "#fff",
  };

  useEffect(() => {
    const loadEnquiries = async () => {
      setLoadingEnquiries(true);
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/RealisedEnquiries`);
        const rows = Array.isArray(res.data) ? res.data : [];
        setEnquiryOptions(rows.map((e: any) => ({ value: e.id, label: e.label })));
      } catch (error) {
        console.error("Failed to load realised enquiries:", error);
        toast.error("Unable to load realised enquiries.");
      } finally {
        setLoadingEnquiries(false);
      }
    };

    void loadEnquiries();
  }, []);

  const handleEnquiryChange = async (e: any) => {
    const enquiryNo = e.target.value;
    setSelectedEnquiry(enquiryNo);
    setSelectedJobNumber("");
    setJobSummary(null);
    setNewJobNumber("");
    setJobOptions([]);

    if (!enquiryNo) return;

    setLoadingJobs(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/JobNumbersByEnquiry/${encodeURIComponent(enquiryNo)}`);
      const rows = Array.isArray(res.data) ? res.data : [];
      setJobOptions(rows.map((j: any) => ({ value: j.number, label: j.number })));
    } catch (error) {
      console.error("Failed to load job numbers:", error);
      toast.error("Unable to load job numbers for the selected enquiry.");
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleJobNumberChange = async (e: any) => {
    const jobNumber = e.target.value;
    setSelectedJobNumber(jobNumber);
    setJobSummary(null);
    setNewJobNumber(jobNumber);

    if (!jobNumber) return;

    setLoadingJobDetails(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Job/JobDataByNumber/${encodeURIComponent(jobNumber)}`);
      const jobData = res.data || {};
      setJobSummary({
        jobNumber: jobData.jobNumber ?? jobNumber,
        jobName: jobData.jobName ?? "",
        customer: jobData.customer ?? "",
        projectManager: jobData.projectManager ?? "",
        costCenter: jobData.costCenter ?? "",
      });
    } catch (error) {
      console.error("Failed to load job details:", error);
      toast.error("Unable to load details for the selected job.");
    } finally {
      setLoadingJobDetails(false);
    }
  };

  const handleSave = async () => {
    if (!selectedJobNumber) {
      toast.error("Please select a job number.");
      return;
    }
    if (!newJobNumber.trim()) {
      toast.error("Please provide a new job number.");
      return;
    }
    if (newJobNumber.trim() === selectedJobNumber) {
      toast.error("New job number must be different from the selected job number.");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.post(`${baseUrl}/api/Sales/AddScopeRevisionJob`, {
        sourceJobNumber: selectedJobNumber,
        newJobNumber: newJobNumber.trim(),
        sessionLoginName: loginUserName,
        sessionLoginId: loginId,
        isRevisionJob: actionType === "Revision",
      });
      toast.success(`Job ${res.data.jobNumber} created successfully.`);
      navigate("/Home/ViewAllJobs");
    } catch (error) {
      console.error("Failed to add new scope/revision job:", error);
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? error.message
          : error instanceof Error
          ? error.message
          : "Failed to create job.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        p: 8,
        background: "#f4f7fb",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.3 }}>
            Add New Scope and Revision Job
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
            Select an existing job and create an exact copy of it under a new job number
          </Typography>
        </Box>

        <Box sx={{ mb: 1.5 }}>
          <Typography sx={fieldLabelStyle}>
            Action <span style={{ color: "#d32f2f" }}>*</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <MuiButton
              variant={actionType === "Scope" ? "contained" : "outlined"}
              onClick={() => setActionType("Scope")}
              disabled={saving}
              sx={{ borderRadius: 3, flex: 1, textTransform: "none" }}
            >
              Add Scope to Job
            </MuiButton>
            <MuiButton
              variant={actionType === "Revision" ? "contained" : "outlined"}
              onClick={() => setActionType("Revision")}
              disabled={saving}
              sx={{ borderRadius: 3, flex: 1, textTransform: "none" }}
            >
              Revision Job
            </MuiButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Card sx={sectionCardStyle}>
          <Box sx={sectionHeaderStyle}>
            <ContentCopy />
            <Typography variant="h6" fontWeight={600}>
              Select Job to Copy
            </Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1.5, "&:last-child": { pb: 1.5 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography sx={fieldLabelStyle}>
                  Realised Enquiry <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <SelectControl
                  name="enquiry"
                  label=""
                  value={selectedEnquiry}
                  onChange={handleEnquiryChange}
                  options={enquiryOptions}
                  required
                  width="100%"
                  height={40}
                  fontSize="0.9rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={loadingEnquiries}
                />
              </Box>

              <Box>
                <Typography sx={fieldLabelStyle}>
                  Job Number <span style={{ color: "#d32f2f" }}>*</span>
                </Typography>
                <SelectControl
                  name="jobNumber"
                  label=""
                  value={selectedJobNumber}
                  onChange={handleJobNumberChange}
                  options={jobOptions}
                  required
                  width="100%"
                  height={40}
                  fontSize="0.9rem"
                  labelFontWeight={600}
                  shrinkLabel={false}
                  disabled={!selectedEnquiry || loadingJobs}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {selectedJobNumber && (
          <Card sx={{ ...sectionCardStyle, mt: 1.5 }}>
            <Box sx={sectionHeaderStyle}>
              <Typography variant="h6" fontWeight={600}>
                Selected Job Details
              </Typography>
            </Box>
            <CardContent sx={{ ...sectionContentStyle, p: 1.5, "&:last-child": { pb: 1.5 } }}>
              {loadingJobDetails ? (
                <Typography color="text.secondary">Loading job details...</Typography>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Job Number</Typography>
                    <Typography sx={wrapValueStyle}>{jobSummary?.jobNumber || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Customer</Typography>
                    <Typography sx={wrapValueStyle}>{jobSummary?.customer || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Project Manager</Typography>
                    <Typography sx={readOnlyValueStyle}>{jobSummary?.projectManager || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Cost Center</Typography>
                    <Typography sx={readOnlyValueStyle}>{jobSummary?.costCenter || "-"}</Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ maxWidth: 420 }}>
                <Typography sx={fieldLabelStyle}>
                  New Job Number
                  <span style={{ color: "#d32f2f" }}> *</span>
                </Typography>
                <TextControl
                  name="newJobNumber"
                  value={newJobNumber}
                  onChange={(e: any) => setNewJobNumber(e.target.value)}
                  disabled={saving}
                  fullWidth
                  style={inputStyle}
                />
                <Typography sx={{ mt: 1, fontSize: 12, color: "#5f6f86" }}>
                  Edit the job number to reflect the new {actionType === "Revision" ? "revision" : "scope"}{" "}
                  (for example, append a suffix). Saving will create a new job that is a copy of the
                  selected job's details, stored under this new job number.{" "}
                  {actionType === "Revision"
                    ? "This will be treated as a new project (new JOBID)."
                    : "This will stay grouped under the same project (same JOBID) as the selected job."}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            label="Cancel"
            onClick={() => navigate("/Home/ViewAllJobs")}
            variant="outlined"
            disabled={saving}
          />
          <Button
            label={saving ? "Saving..." : "Save"}
            onClick={handleSave}
            variant="contained"
            disabled={saving || !selectedJobNumber || !newJobNumber.trim()}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default AddScopeRevisionJob;
