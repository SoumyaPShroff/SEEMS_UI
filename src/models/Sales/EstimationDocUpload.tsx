// EditEstimation.tsx
// React + Material UI + TypeScript
// Modern UI for ASP.NET/VB.NET Estimation Module

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { baseUrl } from "../../const/BaseUrl";

const EstimationDocUpload: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const enquiryNo = searchParams.get("enquiryno")?.trim() || "";

  useEffect(() => {
    if (!enquiryNo) {
      setError("Enquiry number is missing.");
    }
  }, [enquiryNo]);

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
    return `${cleanedEnquiryNo}-${sessionLogin}-${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}-${originalFileName}`;
  };

  const handleUpload = async () => {
    if (!file || !enquiryNo) return;

    const formData = new FormData();
    const sessionUserId = sessionStorage.getItem("SessionUserID") || "";
    const formattedFileName = buildEstimationFileName(file.name);
    const formattedFile = new File([file], formattedFileName, {
      type: file.type,
    });

    formData.append("file", formattedFile, formattedFileName);
    formData.append("enquiryno", enquiryNo);
    formData.append("sessionUserId", sessionUserId);

    await axios.post(
      `${baseUrl}/api/Sales/UploadEstimationDoc`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success("Estimation doc uploaded successfully.");
    navigate("/Home/ViewAllEnquiries", { replace: true });
  };

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Card elevation={4}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Upload Estimation Document
          </Typography>

          <Divider sx={{ mb: 3 }} />

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
    </Box>
  );
};

export default EstimationDocUpload;
