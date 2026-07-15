import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography, Divider, Paper } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SwapHoriz } from "@mui/icons-material";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import Button from "../../components/resusablecontrols/Button";
import { baseUrl } from "../../const/BaseUrl";

type Option = {
  value: string | number;
  label: string;
};

type JobSummary = {
  jobNumber: string;
  enquiryno: string;
  customer: string;
  projectManager: string;
  costCenter: string;
};

const TransferJob = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobNumber = (searchParams.get("jobnumber") || "").trim();

  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUserName = sessionStorage.getItem("SessionUserName") || "guestName";

  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [job, setJob] = useState<JobSummary | null>(null);
  const [completeResponsibilityName, setCompleteResponsibilityName] = useState("");
  const [costCenterOptions, setCostCenterOptions] = useState<Option[]>([]);
  const [newCostCenter, setNewCostCenter] = useState("");

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

  const loadJobDetails = async () => {
    if (!jobNumber) return;
    setLoading(true);
    try {
      const jobRes = await axios.get(`${baseUrl}/api/Job/JobDataByNumber/${encodeURIComponent(jobNumber)}`);
      const jobData = jobRes.data || {};

      const summary: JobSummary = {
        jobNumber: jobData.jobNumber ?? jobNumber,
        enquiryno: jobData.enquiryno ?? "",
        customer: jobData.customer ?? "",
        projectManager: jobData.projectManager ?? "",
        costCenter: jobData.costCenter ?? "",
      };
      setJob(summary);

      if (summary.enquiryno) {
        const enquiryRes = await axios.get(
          `${baseUrl}/api/Sales/EnquiryDetailsAsync/${encodeURIComponent(summary.enquiryno)}`
        );
        setCompleteResponsibilityName(enquiryRes.data?.completeResponsibilityName ?? "");
      }
    } catch (error) {
      console.error("Failed to load job details:", error);
      toast.error("Unable to load job details.");
    } finally {
      setLoading(false);
    }
  };

  const loadCostCenterOptions = async () => {
    try {
      const res = await axios.get<any[]>(`${baseUrl}/api/Job/TransferCostCenters`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows
        .filter((row) => !!row.costCenter)
        .map((row) => ({
          value: row.costCenter,
          label: row.hopc1Name ? `${row.costCenter} - ${row.hopc1Name}` : row.costCenter,
        }));
      setCostCenterOptions(mapped);
    } catch (error) {
      console.error("Failed to load cost centers:", error);
      toast.error("Unable to load cost center options.");
    }
  };

  useEffect(() => {
    void loadJobDetails();
    void loadCostCenterOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobNumber]);

  const handleTransfer = async () => {
    if (!jobNumber) {
      toast.error("No job selected.");
      return;
    }
    if (!newCostCenter.trim()) {
      toast.error("Please select a new cost center.");
      return;
    }

    setTransferring(true);
    try {
      await axios.post(`${baseUrl}/api/Job/TransferJob`, {
        jobNumber,
        newCostCenter,
        sessionLoginId: loginId,
        sessionLoginName: loginUserName,
      });
      toast.success(`Job ${jobNumber} transferred successfully.`);
      navigate("/Home/ViewAllJobs");
    } catch (error) {
      console.error("Failed to transfer job:", error);
      const message =
        axios.isAxiosError(error)
          ? error.response?.data?.message ?? error.message
          : error instanceof Error
          ? error.message
          : "Failed to transfer job.";
      toast.error(message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
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
            Transfer Job
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
            Move a job to a new cost center and project manager
          </Typography>
          {/* {jobNumber && <Chip label={jobNumber} color="primary" sx={{ fontWeight: 700 }} />} */}
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {!jobNumber ? (
          <Paper
            elevation={0}
            sx={{
              border: "1px dashed #a8bfdc",
              borderRadius: 2,
              p: 2.2,
              textAlign: "center",
              color: "#4c6282",
            }}
          >
            <Typography>No job selected. Go back to the jobs list and choose a job to transfer.</Typography>
          </Paper>
        ) : (
          <>
            <Card sx={sectionCardStyle}>
              <Box sx={sectionHeaderStyle}>
                <SwapHoriz />
                <Typography variant="h6" fontWeight={600}>
                  Current Job Details
                </Typography>
              </Box>
              <CardContent sx={{ ...sectionContentStyle, p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Job Number</Typography>
                    <Typography sx={wrapValueStyle}>{job?.jobNumber || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Customer</Typography>
                    <Typography sx={wrapValueStyle}>{job?.customer || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Current Project Manager</Typography>
                    <Typography sx={readOnlyValueStyle}>{job?.projectManager || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Complete Responsibility</Typography>
                    <Typography sx={readOnlyValueStyle}>{completeResponsibilityName || "-"}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={readOnlyLabelStyle}>Alloted Cost Center</Typography>
                    <Typography sx={readOnlyValueStyle}>{job?.costCenter || "-"}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ ...sectionCardStyle, mt: 1.5 }}>
              <Box sx={sectionHeaderStyle}>
                <Typography variant="h6" fontWeight={600}>
                  Transfer To
                </Typography>
              </Box>
              <CardContent sx={{ ...sectionContentStyle, p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Box sx={{ maxWidth: 320 }}>
                  <Typography sx={fieldLabelStyle}>
                    New Cost Center
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <SelectControl
                    name="newCostCenter"
                    label=""
                    value={newCostCenter}
                    onChange={(e: any) => setNewCostCenter(e.target.value)}
                    options={costCenterOptions}
                    required
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={loading}
                  />
                </Box>
                <Typography sx={{ mt: 1, fontSize: 12, color: "#5f6f86" }}>
                  Transferring will set the job's project manager to the enquiry's complete
                  responsibility, mark it approved, and notify both by email.
                </Typography>
              </CardContent>
            </Card>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                label="Cancel"
                onClick={() => navigate("/Home/ViewAllJobs")}
                variant="outlined"
                disabled={transferring}
              />
              <Button
                label={transferring ? "Transferring..." : "Transfer Job"}
                onClick={handleTransfer}
                variant="contained"
                disabled={transferring || loading || !newCostCenter.trim()}
              />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TransferJob;
