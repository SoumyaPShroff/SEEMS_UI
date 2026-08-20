// EditEstimation.tsx
// React + Material UI + TypeScript
// Modern UI for ASP.NET/VB.NET Estimation Module

import React, { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Divider, Typography,RadioGroup,TextField,Radio,  FormLabel,
  FormControlLabel,} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { baseUrl } from "../../const/BaseUrl";
//import axios, { isAxiosError } from "axios";
import axios from "axios";
import SelectControl from "../../components/resusablecontrols/SelectControl";

interface UploadResponse {
  emailSent?: boolean;
  message?: string;
}

interface ManagerCostCenter {
  hopc1id: string;
  hopc1name: string;
  costcenter: string;
}

interface EngineerOption {
  idno: string;
  name: string;
}

const EstimationDocUpload: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const enquiryNo = searchParams.get("enquiryno")?.trim() || "";
  const enquiryTypeParam = searchParams.get("enquirytype")?.trim().toUpperCase() || "";
  const lockedEnquiryType: "OFFSHORE" | "ONSITE" | null =
    enquiryTypeParam === "OFFSHORE" || enquiryTypeParam === "ONSITE" ? enquiryTypeParam : null;
  const [enquiryType, setEnquiryType] = useState<"OFFSHORE" | "ONSITE">(
    lockedEnquiryType ?? "OFFSHORE"
  );
  const [hours, setHours] = useState("");

  const [managers, setManagers] = useState<ManagerCostCenter[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [engineers, setEngineers] = useState<EngineerOption[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState("");

  useEffect(() => {
    if (!enquiryNo) {
      setError("Enquiry number is missing.");
    }
  }, [enquiryNo]);

  useEffect(() => {
    if (enquiryType === "ONSITE") return;
    setSelectedManagerId("");
  }, [enquiryType]);

  useEffect(() => {
    if (enquiryType !== "ONSITE") return;
    if (managers.length > 0) return;

    axios
      .get<ManagerCostCenter[]>(`${baseUrl}/api/Home/HOPCManagerList`)
      .then((res) => setManagers(res.data || []))
      .catch((err) => {
        console.error("Failed to load manager cost centers", err);
        setManagers([]);
      });
  }, [enquiryType, managers.length]);

  useEffect(() => {
    setEngineers([]);
    setSelectedEngineerId("");

    if (!selectedManagerId) return;

    axios
      .get<EngineerOption[]>(`${baseUrl}/api/Home/EngineersByManager/${encodeURIComponent(selectedManagerId)}`)
      .then((res) => setEngineers(res.data || []))
      .catch((err) => {
        console.error("Failed to load engineers for selected manager", err);
        setEngineers([]);
      });
  }, [selectedManagerId]);

  useEffect(() => {
    if (lockedEnquiryType) {
      setEnquiryType(lockedEnquiryType);
    }
  }, [lockedEnquiryType]);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files?.length) {
      setFile(event.target.files[0]);
    }
  };

  const buildEstimationFileName = (originalFileName: string) => {
    const cleanedEnquiryNo = enquiryNo.replace(/'/g, "");
    const sessionLogin =
      sessionStorage.getItem("SessionUserID") ||
      sessionStorage.getItem("SessionUserName") ||
      "guest";

    const now = new Date();
    return `${cleanedEnquiryNo}-${sessionLogin}-${now.getDate()}-${now.getMonth() + 1
      }-${now.getFullYear()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${originalFileName}`;
  };

  const handleUpload = async () => {
    if (!file || !enquiryNo) return;
    if (enquiryType === "ONSITE") {
      if (!hours.trim()) {
        toast.error("Please enter Hours for ONSITE enquiry.");
        return;
      }
      if (!selectedManagerId) {
        toast.error("Please select Complete Responsibility (manager cost center) for ONSITE enquiry.");
        return;
      }
      if (!selectedEngineerId) {
        toast.error("Please select Engineer Name for ONSITE enquiry.");
        return;
      }
    }

    try {
      const formData = new FormData();
      const sessionUserId = sessionStorage.getItem("SessionUserID") || "";
      const formattedFileName = buildEstimationFileName(file.name);
      const formattedFile = new File([file], formattedFileName, {
        type: file.type,
      });

      formData.append("file", formattedFile, formattedFileName);
      formData.append("enquiryno", enquiryNo);
      formData.append("sessionUserId", sessionUserId);
      formData.append("enquiryType", enquiryType);

      if (enquiryType === "ONSITE") {
        formData.append("Hrs", hours);
        formData.append("CompleteResponsibilityId", selectedManagerId);
        formData.append("EngineerName", selectedEngineerId);
      }

      const response = await axios.post<UploadResponse>(
        `${baseUrl}/api/Sales/UploadEstimationDoc`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

     // console.log("Estimation document upload successful", response.data);
      //console.log("Response:", response.data);
      const emailFailed = (response.data as any)?.emailSent === false;
      const toastMessage = (
        <div>
          {emailFailed
            ? "Estimation doc uploaded successfully, but email notification failed."
            : "Estimation doc uploaded successfully."}
          <Button
            style={{ marginLeft: "10px", color: "#273992", textDecoration: "underline" }}
            onClick={() => navigate("/Home/ViewAllEnquiries")}
          >
            Return to ViewAllEnquiries
          </Button>
        </div>
      );

      toast.success(toastMessage, {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
      });
    } catch (err: any) {
      console.error("Estimation document upload failed", err);
      const error = err as any;
      if (error?.response) {
        toast.error(`Failed to upload estimation document: ${err.response.status} ${err.response.statusText}`);
      } else {
        toast.error("Failed to upload estimation document.");
      }
       // if (axios.isAxiosError(err)) { console.log(JSON.stringify(err.response?.data, null, 2));}
    }
  };

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

 return (
  <>
    <Box p={4}>
      <Card
        elevation={4}
        sx={{
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
        }}
      >
        <CardContent>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 700, color: "#0f4ea6", letterSpacing: "0.01em" }}
          >
            Upload Estimation Document
          </Typography>

          <Divider sx={{ mb: 3, borderColor: "#d5e1f8" }} />

          <Box mb={3}>
            <FormLabel>Enquiry Type</FormLabel>

            <RadioGroup
              row
              value={enquiryType}
              onChange={(e) =>
                setEnquiryType(e.target.value as "OFFSHORE" | "ONSITE")
              }
            >
              <FormControlLabel
                value="OFFSHORE"
                control={<Radio />}
                label="OFFSHORE"
                disabled={lockedEnquiryType !== null && lockedEnquiryType !== "OFFSHORE"}
              />
              <FormControlLabel
                value="ONSITE"
                control={<Radio />}
                label="ONSITE"
                disabled={lockedEnquiryType !== null && lockedEnquiryType !== "ONSITE"}
              />
            </RadioGroup>

            {enquiryType === "ONSITE" && (
              <>
                <TextField
                  label="Hours"
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                 // fullWidth
                  sx={{ mt: 2 }}
                  inputProps={{ min: 1 }}
                />

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 2, maxWidth: 560 }}>
                  <SelectControl
                    name="completeResponsibilityId"
                    label="Complete Responsibility"
                    value={selectedManagerId}
                    options={managers.map((m) => ({
                      value: m.hopc1id,
                      label: `${m.hopc1name} (${m.costcenter})`,
                    }))}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    required
                  />
                  <SelectControl
                    name="engineerName"
                    label="Engineer Name"
                    value={selectedEngineerId}
                    options={engineers.map((e) => ({
                      value: e.idno,
                      label: e.name,
                    }))}
                    onChange={(e) => setSelectedEngineerId(e.target.value)}
                    required
                    disabled={!selectedManagerId}
                  />
                </Box>
              </>
            )}
          </Box>

          <Box mt={4}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Enquiry No: {enquiryNo}
            </Typography>

            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
            >
              Choose File
              <input hidden type="file" onChange={handleFileChange} />
            </Button>

            {file && (
              <Typography mt={1}>
                {file.name}
              </Typography>
            )}

            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleUpload}
                disabled={!file}
              >
                Upload Document
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />
    </Box>
  </>
);
};

export default EstimationDocUpload;
