import React, { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";
import { Box,  Button, Card,  CardContent,  CircularProgress,  Divider,  Link,  Stack,  Typography,} from "@mui/material";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { baseUrl } from "../../const/BaseUrl";
import Label from "../../components/resusablecontrols/Label";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import { standardInputStyle } from "../Sales/styles/standardInputStyle";

type RequestStatus = "OPEN" | "IN-PROCESS" | "COMPLETED";

interface RequestForm {
  Requesttype: string;
  Modulename: string;
  Description: string;
  filename: string;
}

interface RequestItem extends RequestForm {
  Reqid: string;
  Requestedon: string;
  Requestedby: string;
}

interface AddRequestPayload {
  Modulename: string;
  Description: string;
  Requestedby: string;
  filename?: string;
}

interface ApiRequestRecord {
  [key: string]: unknown;
}

const createInitialForm = (): RequestForm => ({
  Requesttype: "",
  Modulename: "",
  Description: "",
  filename: "",
});

const REQUEST_ENDPOINT = `${baseUrl}/SEEMSRequestData`;
const ADD_REQUEST_ENDPOINT = `${baseUrl}/AddSEEMSRequest`;
const EDIT_REQUEST_ENDPOINT = `${baseUrl}/EditSEEMSRequest`;

const asString = (value: unknown): string => (value == null ? "" : String(value).trim());

const normalizeStatus = (value: string): RequestStatus => {
  const normalized = value.trim();
  if (normalized === "IN-PROCESS") {
    return "IN-PROCESS";
  }
  if (normalized === "COMPLETED") {
    return "COMPLETED";
  }
  return "OPEN";
};

const extractRecords = (data: unknown): ApiRequestRecord[] => {
  if (Array.isArray(data)) {
    return data as ApiRequestRecord[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: ApiRequestRecord[] }).data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    (data as { data?: unknown }).data &&
    !Array.isArray((data as { data?: unknown }).data)
  ) {
    return [(data as { data: ApiRequestRecord }).data];
  }

  if (typeof data === "object" && data !== null) {
    return [data as ApiRequestRecord];
  }

  return [];
};

const mapApiRequest = (record: ApiRequestRecord): RequestItem => ({
  Reqid: asString(record.Reqid),
  Requestedon: asString(record.Requestedon),
  Requestedby: asString(record.Requestedby),
  Requesttype: asString(record.Requesttype),
  Modulename: asString(record.Modulename),
  Description: asString(record.Description),
  Status: normalizeStatus(asString(record.Status)),
  filename: asString(record.filename ?? record.fileName),
});

const fetchEmailFromId = async (id: string): Promise<string> => {
  const trimmedId = id.trim();
  if (!trimmedId) {
    return "";
  }

  const { data } = await axios.get(`${baseUrl}/EmailId/${trimmedId}`);
  const list = Array.isArray(data) ? data : [data];
  return String(list[0] ?? "").trim();
};

const fetchSEEMSRequests = async (filters?: { Reqid?: string }): Promise<RequestItem[]> => {
  const response = await axios.get(REQUEST_ENDPOINT, { params: filters });
  return extractRecords(response.data).map(mapApiRequest).filter((item) => Boolean(item.Reqid));
};

const saveSEEMSRequest = async ({
  payload,
  mode,
  Reqid,
  emaillist,
}: {
  payload: RequestForm | AddRequestPayload;
  mode: "create" | "edit";
  Reqid?: string;
  emaillist: string;
}) => {
  await axios.post(mode === "create" ? ADD_REQUEST_ENDPOINT : EDIT_REQUEST_ENDPOINT, payload, {
    params: {
      ...(mode === "edit" && Reqid ? { Reqid } : {}),
      emaillist,
    },
  });
};

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
  const loginId = sessionStorage.getItem("SessionUserID") || "";

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
    if (!form.Requesttype.trim()) {
      toast.error("Request type is required.");
      return false;
    }

    if (!form.Modulename.trim()) {
      toast.error("Module / page name is required.");
      return false;
    }

    if (!form.Description.trim()) {
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
      filename: file?.name ?? "",
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
      const result = await fetchSEEMSRequests({ Reqid: id });
      const mappedRequest = result[0];
      if (!mappedRequest?.Reqid) {
        throw new Error("No request found");
      }

      setRequests((prev) => {
        const remaining = prev.filter((item) => item.Reqid !== mappedRequest.Reqid);
        return [...remaining, mappedRequest].sort((a, b) => a.Reqid.localeCompare(b.Reqid));
      });
      setForm({
        Requesttype: mappedRequest.Requesttype,
        Modulename: mappedRequest.Modulename,
        Description: mappedRequest.Description,
        filename: mappedRequest.filename,
      });
    } catch (error) {
      toast.error("Unable to load the selected request.");
      console.warn("Failed to load SEEMS request details.", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const sessionUserEmail = await fetchEmailFromId(loginId);
      const payload: RequestForm | AddRequestPayload =
        mode === "create"
          ? {
              Modulename: form.Modulename.trim(),
              Description: form.Description.trim(),
              Requestedby: loginId,
              ...(form.filename ? { filename: form.filename } : {}),
            }
          : {
              Requesttype: form.Requesttype.trim(),
              Modulename: form.Modulename.trim(),
              Description: form.Description.trim(),
              filename: form.filename,
            };

      await saveSEEMSRequest({
        payload,
        mode,
        Reqid: mode === "edit" ? selectedId : undefined,
        emaillist: sessionUserEmail,
      });
      await loadRequestIds();
      toast.success(mode === "create" ? "SEEMS request created." : "SEEMS request updated.");
      resetForm();
    } catch (error) {
      toast.error(mode === "create" ? "Unable to create SEEMS request." : "Unable to update SEEMS request.") +   " " +
      (error?.response?.data?.message || error.message || "");
    }
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
    pending: requests.filter((request) => request.Status === "OPEN").length,
    progress: requests.filter((request) => request.Status === "IN-PROCESS").length,
    done: requests.filter((request) => request.Status === "COMPLETED").length,
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
                        onClick={() => openStatusView("OPEN")}
                        sx={{
                          fontSize: "0.82rem",
                          color: "#1d5db2",
                          fontWeight: 700,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        OPEN
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
                        onClick={() => openStatusView("IN-PROCESS")}
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
                        onClick={() => openStatusView("COMPLETED")}
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
                    name="Reqid"
                    label="Select Request ID"
                    value={selectedId}
                    options={[
                      { value: "", label: "Select" },
                      ...requests
                        .slice()
                        .sort((a, b) => a.Reqid.localeCompare(b.Reqid))
                        .map((request) => ({
                          value: request.Reqid,
                          label: request.Reqid,
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
                  value={form.Requesttype}
                  options={REQUEST_TYPE_OPTIONS}
                  onChange={(event: { target: { value: string } }) =>
                    updateForm("Requesttype", event.target.value)
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
                  value={form.Modulename}
                  onChange={(event) => updateForm("Modulename", event.target.value)}
                  placeholder="Enter module or page name"
                  style={standardInputStyle}
                  fullWidth
                />
              </Box>

              <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
                <Label text="Comments" bold required />
                <TextControl
                  name="comments"
                  value={form.Description}
                  onChange={(event) => updateForm("Description", event.target.value)}
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
                  <Typography sx={{ fontSize: "0.88rem", color: form.filename ? "#1f2f46" : "#6b7a90" }}>
                    {form.filename || "No file selected"}
                  </Typography>
                  <Button component="label" variant="outlined" size="small" sx={{ textTransform: "none" }}>
                    Upload
                    <input hidden type="file" onChange={handleFileChange} />
                  </Button>
                </Box>
              </Box>

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
