import React, { useState, useEffect, useRef } from 'react';
import "./styles/JobCreationForm.css";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, Button as MuiButton,  Divider, Paper, Chip, Alert} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Button from "../../components/resusablecontrols/Button";
import { baseUrl } from "../../const/BaseUrl";

type BillingType = 'Fixed-Cost' | 'Time and Material';

interface EnquiryOption {
  id: string;
  label: string;
}

interface POOption {
  id: string;
  number: string;
}

interface FormState {
  billingType: BillingType;
  enquiry: string;
  poNumber: string;
  boardRef: string;
  billingDate: string;
}

interface PODetails {
  totalAmount: number;
  totalHours: number;
  balanceHours: number;
}

const JobCreationForm: React.FC = () => {
  const navigate = useNavigate();
  const lastErrorRef = useRef<string | null>(null);

  const [formState, setFormState] = useState<FormState>({
    billingType: 'Fixed-Cost',
    enquiry: '',
    poNumber: '',
    boardRef: '',
    billingDate: '',
  });

  const [enquiries, setEnquiries] = useState<EnquiryOption[]>([]);
  const [poNumbers, setPoNumbers] = useState<POOption[]>([]);
  const [poDetails, setPoDetails] = useState<PODetails>({
    totalAmount: 0,
    totalHours: 0,
    balanceHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showErrorToast = (errorMsg: string) => {
    if (lastErrorRef.current !== errorMsg) {
      toast.error(errorMsg);
      lastErrorRef.current = errorMsg;
    }
  };

  // Fetch enquiries on component mount and when billing type changes
  useEffect(() => {
    fetchEnquiries(formState.billingType);
  }, [formState.billingType]);

  // Fetch PO numbers when enquiry changes
  useEffect(() => {
    if (formState.enquiry) {
      fetchPONumbers();
      setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });
      setFormState(prev => ({
        ...prev,
        poNumber: '',
        billingDate: '',
        boardRef: '',
      }));
    }
  }, [formState.enquiry]);

  // Fetch PO details when PO number changes
  useEffect(() => {
    if (formState.poNumber) {
      fetchPODetails();
    }
  }, [formState.poNumber]);

  const fetchEnquiries = async (billingType: BillingType) => {
    try {
      setError(null);
      const url = new URL(`${baseUrl}/api/Sales/RealisedEnquiries`);
      url.searchParams.append('billingType', billingType);
      const response = await axios.get(url.toString());
      setEnquiries(response.data);
      // Reset enquiry and PO selection when fetching new enquiries
      setFormState(prev => ({
        ...prev,
        enquiry: '',
        poNumber: '',
        billingDate: '',
        boardRef: '',
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching enquiries';
      setError(errorMsg);
      showErrorToast(errorMsg);
    }
  };

  const fetchPONumbers = async () => {
    try {
      setError(null);
      const encodedEnquiry = encodeURIComponent(formState.enquiry);
      const response = await axios.get(`${baseUrl}/api/Sales/PONumbersByEnquiry/${encodedEnquiry}`);

      if (Array.isArray(response.data)) {
        setPoNumbers(response.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching PO numbers';
      setError(errorMsg);
      showErrorToast(errorMsg);
      setPoNumbers([]);
    }
  };

  const fetchPODetails = async () => {
    try {
      setError(null);
      const encodedPoNumber = encodeURIComponent(formState.poNumber);
      const response = await axios.get(`${baseUrl}/api/Sales/PODetailsAsync/${encodedPoNumber}`);

      if (response.data) {
        setPoDetails(response.data);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching PO details';
      setError(errorMsg);
      showErrorToast(errorMsg);
      setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });
    }
  };

  // const createScopeBasedJobs = async (projectId: number, enquiry: string, jobNumber: string) => {
  //   try {
  //     const sessionLoginName = sessionStorage.getItem('SessionUserName') || 'System';
  //     const sessionLoginId = sessionStorage.getItem('SessionUserID') || 'system-user';

  //     const scopeJobsPayload = {
  //       enquiry,
  //       billingType: formState.billingType,
  //       boardRef: formState.boardRef || null,
  //       sessionLoginName,
  //       sessionLoginId  
  //     };

  //     await axios.post(`${baseUrl}/api/Sales/CreateScopeBasedJobs`, scopeJobsPayload);
  //     toast.success('Scope-based jobs created successfully');
  //   } catch (err) {
  //     const errorMsg = err instanceof Error ? err.message : 'Error creating scope-based jobs';
  //     toast.error(errorMsg);
  //   }
  // };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBillingTypeChange = (type: BillingType) => {
    setFormState(prev => ({
      ...prev,
      billingType: type,
      boardRef: type === 'Fixed-Cost' ? '' : prev.boardRef,
      billingDate: '',
      enquiry: '',
      poNumber: '',
    }));
    setEnquiries([]);
    setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });
  };

  const validateForm = (): boolean => {
    if (!formState.enquiry) {
      const msg = 'Please select an enquiry';
      setError(msg);
      showErrorToast(msg);
      return false;
    }
    if (!formState.poNumber) {
      const msg = 'Please select a PO number';
      setError(msg);
      showErrorToast(msg);
      return false;
    }
    if (formState.billingType === 'Time and Material' && !formState.billingDate) {
      const msg = 'Please select a billing date';
      setError(msg);
      showErrorToast(msg);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const sessionLoginName = sessionStorage.getItem('SessionUserName') || 'System';
      const sessionLoginId = sessionStorage.getItem('SessionUserID') || 'system-user';

      const payload: any = {
        billingType: formState.billingType,
        enquiry: formState.enquiry,
        poNumber: formState.poNumber,
        poAmount: poDetails.totalAmount,
        poHours: poDetails.totalHours,
        sessionLoginName,
        sessionLoginId,
      };

      // Add billing type specific fields
      if (formState.billingType === 'Fixed-Cost') {
        payload.boardRef = formState.boardRef;
      } else {
        payload.billingDate = formState.billingDate;
      }

      const response = await axios.post(`${baseUrl}/api/Sales/CreateJob`, payload);
      toast.success(`Job created successfully! Job Number: ${response.data.jobNumber}`);
      handleClearForm();

      // Redirect after success
    setTimeout(() => {
      navigate(`/Home/JobCreationForm`);
    }, 1000);
    } catch (err: any) {
 
  let errorMsg = "Error creating job";

  // Try to extract error message from different .NET response formats
  if (err.response?.data) {
    // Check for common .NET exception response formats
    errorMsg = err.response.data.message
      || err.response.data.title
      || err.response.data.detail
      || err.response.data.exceptionMessage
      || err.response.data.Message
      || (typeof err.response.data === 'string' ? err.response.data : null)
      || err.message
      || "Error creating job";
  } else if (err.message) {
    errorMsg = err.message;
  }

  setError(errorMsg);
  showErrorToast(errorMsg);
}
  };

  const handleClearForm = () => {
    setFormState({
      billingType: 'Fixed-Cost',
      enquiry: '',
      poNumber: '',
      boardRef: '',
      billingDate: '',
    });
    setError(null);
  };

  // Convert EnquiryOption to SelectControl format
  const enquiryOptions = enquiries.map(enq => ({
    value: enq.id,
    label: enq.label,
  }));

  // Convert POOption to SelectControl format
  const poOptions = poNumbers.map(po => ({
    value: po.id,
    label: po.number,
  }));

  // Styling constants (following AddEditCustContLocReg pattern)
  const fieldLabelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#243a5a",
    mb: 0.6,
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

  const fieldShellStyle = {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignSelf: "stretch",
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

  return (
    <Box
      sx={{
        p: 3,
        background: "#f4f7fb",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 5,
          background: "linear-gradient(180deg,#ffffff,#f8fbff)",
          border: "1px solid #dce6f5",
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#0f4ea6",
              mb: 0.5,
            }}
          >
            Create New Project Job
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Select billing type, enquiry, and PO details to create a new project job
          </Typography>
          <Chip
            label={`Billing Type: ${formState.billingType === 'Fixed-Cost' ? 'Fixed-Cost' : 'Time & Material'}`}
            color={formState.billingType === 'Fixed-Cost' ? 'primary' : 'info'}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Billing Type Selector */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ ...fieldLabelStyle, mb: 1.5 }}>
            Select Billing Type <span style={{ color: "#d32f2f" }}>*</span>
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <MuiButton
              variant={formState.billingType === 'Fixed-Cost' ? 'contained' : 'outlined'}
              onClick={() => handleBillingTypeChange('Fixed-Cost')}
              disabled={loading}
              sx={{ borderRadius: 3, flex: 1 }}
            >
              💼 Fixed-Cost
            </MuiButton>
            <MuiButton
              variant={formState.billingType === 'Time and Material' ? 'contained' : 'outlined'}
              onClick={() => handleBillingTypeChange('Time and Material')}
              disabled={loading}
              sx={{ borderRadius: 3, flex: 1 }}
            >
              ⏱️ Time & Material
            </MuiButton>
          </Box>
        </Box>

        {/* Error Alert */}
        {/* {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )} */}

        {/* Main Form Card */}
        <Card sx={sectionCardStyle}>
          <Box sx={sectionHeaderStyle}>
            <Typography variant="h6" fontWeight={600}>
              Job Details
            </Typography>
          </Box>

          <CardContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Enquiry Number */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Enquiry Number <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <SelectControl
                    name="enquiry"
                    value={formState.enquiry}
                    options={enquiryOptions}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    disabled={loading}
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                  />
                </Box>
              </Grid>

              {/* PO Number */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    PO Number <span style={{ color: "#d32f2f" }}>*</span>
                  </Typography>
                  <SelectControl
                    name="poNumber"
                    value={formState.poNumber}
                    options={poOptions}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    disabled={!formState.enquiry || loading}
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                  />
                </Box>
              </Grid>

              {/* Billing Date (Time & Material Only) */}
              {formState.billingType === 'Time and Material' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={fieldShellStyle}>
                    <Typography sx={fieldLabelStyle}>
                      Billing Date <span style={{ color: "#d32f2f" }}>*</span>
                    </Typography>
                    <TextControl
                      name="billingDate"
                      type="date"
                      value={formState.billingDate}
                      onChange={handleInputChange}
                      disabled={loading}
                      fullWidth
                      style={inputStyle}
                    />
                  </Box>
                </Grid>
              )}

              {/* Board Ref (Fixed Cost Only) */}
              {formState.billingType === 'Fixed-Cost' && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={fieldShellStyle}>
                    <Typography sx={fieldLabelStyle}>Board Reference</Typography>
                    <TextControl
                      name="boardRef"
                      value={formState.boardRef}
                      onChange={handleInputChange}
                      placeholder="Optional"
                      disabled={loading}
                      fullWidth
                      style={inputStyle}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* PO Details Summary Card */}
        {formState.poNumber && (
          <Card sx={{ ...sectionCardStyle, mt: 3 }}>
            <Box sx={sectionHeaderStyle}>
              <Typography variant="h6" fontWeight={600}>
                Purchase Order Summary
              </Typography>
            </Box>

            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5f6f86",
                        mb: 0.5,
                      }}
                    >
                      Total PO Amount
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#0f4ea6",
                      }}
                    >
                      {poDetails.totalAmount.toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5f6f86",
                        mb: 0.5,
                      }}
                    >
                      Total PO Hours
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#0f4ea6",
                      }}
                    >
                      {poDetails.totalHours.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ textAlign: "center", p: 2, background: "#f0f4ff", borderRadius: 2 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5f6f86",
                        mb: 0.5,
                      }}
                    >
                      Balance Hours
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#2e7d32",
                      }}
                    >
                      {poDetails.balanceHours.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Typography color="text.secondary" sx={{ flex: 1, minWidth: 200 }}>
            Review all details before creating the job
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              label="Clear Form"
              onClick={handleClearForm}
              variant="outlined"
              disabled={loading}
            />
            <Button
              label={loading ? 'Creating Job...' : 'Create Job'}
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !formState.enquiry || !formState.poNumber}
            />
          </Box>
        </Box>
      </Paper>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </Box>
  );
};

export default JobCreationForm;
