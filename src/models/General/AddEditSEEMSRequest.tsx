import React, { ChangeEvent, useEffect, useState } from "react";
import { Box,  Button, Card,  CardContent,  CircularProgress,  Divider,  Link,  Stack,  Typography,} from "@mui/material";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Label from "../../components/resusablecontrols/Label";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import { standardInputStyle } from "../Sales/styles/standardInputStyle";


const REQUEST_TYPE_OPTIONS = [
  { value: "", label: "Select" },
  { value: "New Request", label: "New Request" },
  { value: "Bug Fix", label: "Bug Fix" },
  { value: "Others", label: "Others" },
];

const pageCardStyle = {
  width: "100%",
  maxWidth: 880,
  mx: "auto",
  mt: 3,
  borderRadius: 3,
  border: "1px solid #557ec6",
  boxShadow: "0 14px 30px rgba(24, 71, 153, 0.14)",
  background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
};

const statCardStyle = {
  borderRadius: 2,
  border: "1px solid #d5e1f8",
  boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
  background: "#ffffff",
};

const AddEditSEEMSRequest: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<RequestForm>(createInitialForm);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    void loadRequestIds();
  }, []);

  const resetForm = () => {
    setForm(createInitialForm());
    setSelectedId("");
    setMode("create");
  };

  const updateForm = <K extends keyof RequestForm>(field: K, value: RequestForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!form.type) {
      toast.error("Request type is required.");
      return false;
    }

    if (!form.module.trim()) {
      toast.error("Module / page name is required.");
      return false;
    }

    if (!form.comments.trim()) {
      toast.error("Comments are required.");
      return false;
    }

    if (mode === "edit" && !selectedId) {
      toast.error("Select a request to edit.");
      return false;
    }

    return true;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setForm((prev) => ({
      ...prev,
      file,
      fileName: file?.name ?? "",
    }));
  };

  const loadRequestIds = async () => {
    setLoadingRequests(true);
    try {
      const result = await fetchSEEMSRequests();
      setRequests(result);
    } catch (error) {
      toast.error("Unable to load request ids.");
      console.warn("Failed to load SEEMS request ids.", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadRequestDetails = async (id: string) => {
    setLoadingDetails(true);
    try {
      const result = await fetchSEEMSRequests({ requestid: id });
      const mappedRequest = result[0];
      if (!mappedRequest?.id) {
        throw new Error("No request found");
      }

      setRequests((prev) => {
        const remaining = prev.filter((item) => item.id !== mappedRequest.id);
        return [...remaining, mappedRequest].sort((a, b) => a.id.localeCompare(b.id));
      });
      setForm({
        type: mappedRequest.type,
        module: mappedRequest.module,
        comments: mappedRequest.comments,
        status: mappedRequest.status,
        file: null,
        fileName: mappedRequest.fileName,
      });
    } catch (error) {
      toast.error("Unable to load the selected request.");
      console.warn("Failed to load SEEMS request details.", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (mode === "create") {
      const newRequest: RequestItem = {
        id: Date.now().toString(),
        ...form,
        module: form.module.trim(),
        comments: form.comments.trim(),
        requestDate: new Date().toISOString().slice(0, 10),
      };

      setRequests((prev) => [...prev, newRequest]);
      toast.success("SEEMS request created.");
      resetForm();
      return;
    }

    setRequests((prev) =>
      prev.map((request) =>
        request.id === selectedId
          ? {
              ...request,
              ...form,
              module: form.module.trim(),
              comments: form.comments.trim(),
            }
          : request
      )
    );
    toast.success("SEEMS request updated.");
    resetForm();
  };

  const handleEditSelect = async (id: string) => {
    setSelectedId(id);
    if (!id) {
      setForm(createInitialForm());
      return;
    }

    setMode("edit");
    await loadRequestDetails(id);
  };

  const switchToEditMode = async () => {
    setMode("edit");
    if (requests.length === 0) {
      await loadRequestIds();
    }
  };

  const counts = {
    pending: requests.filter((request) => request.status === "Pending Review").length,
    progress: requests.filter((request) => request.status === "In Progress").length,
    done: requests.filter((request) => request.status === "Completed").length,
  };

  const openStatusView = (status: RequestStatus) => {
    navigate(`/Home/ViewSEEMSRequests?status=${encodeURIComponent(status)}`);
  };

  return (
    <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 2, fontFamily: "Arial" }}>
      <Card sx={pageCardStyle}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f4ea6" }}>
                Add-Edit SEEMS Request
              </Typography>
              <Typography sx={{ mt: 0.6, color: "#4b5f7a", fontSize: "0.92rem" }}>
                Create a new request or update an existing one from the list below.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 1.5,
              }}
            >
              <Card sx={statCardStyle}>
                <CardContent sx={{ py: 1.7 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => openStatusView("Pending Review")}
                        sx={{
                          fontSize: "0.82rem",
                          color: "#1d5db2",
                          fontWeight: 700,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        Pending Review
                      </Link>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f4ea6" }}>
                        {counts.pending}
                      </Typography>
                    </Box>
                    <HourglassEmptyRoundedIcon sx={{ fontSize: 30, color: "#f0a128" }} />
                  </Stack>
                </CardContent>
              </Card>
              <Card sx={statCardStyle}>
                <CardContent sx={{ py: 1.7 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => openStatusView("In Progress")}
                        sx={{
                          fontSize: "0.82rem",
                          color: "#1d5db2",
                          fontWeight: 700,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        In-Progress
                      </Link>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f4ea6" }}>
                        {counts.progress}
                      </Typography>
                    </Box>
                    <AutorenewRoundedIcon sx={{ fontSize: 30, color: "#2f80ed" }} />
                  </Stack>
                </CardContent>
              </Card>
              <Card sx={statCardStyle}>
                <CardContent sx={{ py: 1.7 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        onClick={() => openStatusView("Completed")}
                        sx={{
                          fontSize: "0.82rem",
                          color: "#1d5db2",
                          fontWeight: 700,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        Completed
                      </Link>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f4ea6" }}>
                        {counts.done}
                      </Typography>
                    </Box>
                    <CheckCircleRoundedIcon sx={{ fontSize: 30, color: "#2e9b5f" }} />
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant={mode === "create" ? "contained" : "outlined"}
                onClick={resetForm}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Create Request
              </Button>
              <Button
                variant={mode === "edit" ? "contained" : "outlined"}
                onClick={() => void switchToEditMode()}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                Edit Request
              </Button>
            </Stack>

            {mode === "edit" && (
              <Box sx={{ maxWidth: 360 }}>
                {loadingRequests ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, py: 1 }}>
                    <CircularProgress size={20} />
                    <Typography sx={{ fontSize: "0.9rem", color: "#4b5f7a" }}>
                      Loading request ids...
                    </Typography>
                  </Box>
                ) : (
                  <SelectControl
                    name="requestId"
                    label="Select Request ID"
                    value={selectedId}
                    options={[
                      { value: "", label: "Select" },
                      ...requests
                        .slice()
                        .sort((a, b) => a.id.localeCompare(b.id))
                        .map((request) => ({
                          value: request.id,
                          label: request.id,
                        })),
                    ]}
                    onChange={(event: { target: { value: string } }) =>
                      void handleEditSelect(event.target.value)
                    }
                    fullWidth
                    height={36}
                  />
                )}
              </Box>
            )}

            <Divider />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box sx={{ maxWidth: { xs: "100%", md: 320 } }}>
                <SelectControl
                  name="type"
                  label="Request Type"
                  value={form.type}
                  options={REQUEST_TYPE_OPTIONS}
                  onChange={(event: { target: { value: string } }) =>
                    updateForm("type", event.target.value)
                  }
                  required
                  fullWidth
                  height={36}
                />
              </Box>

              <Box>
                <Label text="Module / Page Name" bold required />
                <TextControl
                  name="module"
                  value={form.module}
                  onChange={(event) => updateForm("module", event.target.value)}
                  placeholder="Enter module or page name"
                  style={standardInputStyle}
                  fullWidth
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
                <Label text="Comments" bold required />
                <TextControl
                  name="comments"
                  value={form.comments}
                  onChange={(event) => updateForm("comments", event.target.value)}
                  placeholder="Describe the request"
                  style={{ ...standardInputStyle, minHeight: 90, padding: "10px 12px" }}
                  multiline
                  rows={4}
                  fullWidth
                />
              </Box>

              <Box>
                <Label text="Attachment" bold />
                <Box
                  sx={{
                    ...standardInputStyle,
                    height: "auto",
                    minHeight: 52,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Typography sx={{ fontSize: "0.88rem", color: form.fileName ? "#1f2f46" : "#6b7a90" }}>
                    {form.fileName || "No file selected"}
                  </Typography>
                  <Button component="label" variant="outlined" size="small" sx={{ textTransform: "none" }}>
                    Upload
                    <input hidden type="file" onChange={handleFileChange} />
                  </Button>
                </Box>
              </Box>

              {mode === "edit" && (
                <Box sx={{ maxWidth: { xs: "100%", md: 320 } }}>
                  <SelectControl
                    name="status"
                    label="Status"
                    value={form.status}
                    options={STATUS_OPTIONS}
                    onChange={(event: { target: { value: RequestStatus } }) =>
                      updateForm("status", event.target.value)
                    }
                    fullWidth
                    height={36}
                  />
                </Box>
              )}
            </Box>

            {mode === "edit" && loadingDetails && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <CircularProgress size={20} />
                <Typography sx={{ fontSize: "0.9rem", color: "#4b5f7a" }}>
                  Loading request details...
                </Typography>
              </Box>
            )}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{ minWidth: 120, textTransform: "none", fontWeight: 600 }}
              >
                {mode === "create" ? "Submit" : "Update"}
              </Button>
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{ minWidth: 120, textTransform: "none", fontWeight: 600 }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddEditSEEMSRequest;
