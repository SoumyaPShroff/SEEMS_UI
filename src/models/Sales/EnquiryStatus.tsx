import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Label from "../../components/resusablecontrols/Label";
import { baseUrl } from "../../const/BaseUrl";
import { REMARKS_ALLOWED_CHARS_REGEX } from "../../const/ValidationPatterns";
import { standardInputStyle } from "./styles/standardInputStyle";
import { formatDateYYYYMMDD } from "../../components/utils/DateUtils";

const EnquiryStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const enquiryNo = searchParams.get("enquiryno");
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [statusremarks, setStatusRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [tentativeDate, setTentativeDate] = useState("");
  const [enquiryType, setEnquiryType] = useState("");
  const [salesResponsibilityId, setSalesResponsibilityId] = useState("");
  const [completeResponsibilityId, setCompleteResponsibilityId] = useState("");
  const [loading, setLoading] = useState(true);
  const loginId = sessionStorage.getItem("SessionUserID") || "";
  const defaultStatusOptions = [
    "Open",
    "Tentative",
    "Confirmed",
   // "Realised",   'since Realised is now a reason for statusremarks in payload, it should not be in the default list'
    "Hold",
    "Cancelled",
    "Rejected By Customer",
    "Rejected By Sienna",
  ];

  const normalizeStatus = (value: string) => value.trim();

  const buildStatusOptions = (currentStatus: string, sourceOptions: string[]) => {
    const current = normalizeStatus(currentStatus);
    const base = sourceOptions.length > 0 ? sourceOptions : defaultStatusOptions;

    if (current === "Open") {
      return base.filter((s) => normalizeStatus(s) !== "Open");
    }

    if (current === "Hold") {
      return [
        "Cancelled",
        "Confirmed",
        "Rejected By Sienna",
        "Rejected By Customer",
      ];
    }

    if (current === "Confirmed") {
      return [
        "Realised",
        "Hold",
        "Tentative",
        "Cancelled",
        "Rejected By Sienna",
        "Rejected By Customer",
      ];
    }

    return base.filter((s) => normalizeStatus(s) !== current);
  };

  useEffect(() => {
    void loadEnquiry();
  }, []);

  const loadEnquiry = async () => {
    if (!enquiryNo) {
      toast.error("Invalid enquiry number.");
      setLoading(false);
      return;
    }

    try {
      const detailsRes = await axios.get(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enquiryNo}`);
      const row = Array.isArray(detailsRes.data) ? detailsRes.data[0] : detailsRes.data;
      setEnquiryType(String(row?.enquirytype ?? row?.enquirytype ?? ""));
      setSalesResponsibilityId(String(row?.salesresponsibilityid ?? ""));
      setCompleteResponsibilityId(String(row?.completeresponsibilityid ?? ""));

      const currentStatus = String(row?.status ?? "");
      setStatus("");
      setStatusOptions(buildStatusOptions(currentStatus, defaultStatusOptions));
    } catch (error) {
      console.error("Failed to load enquiry status details.", error);
      toast.error("Unable to load enquiry status details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!enquiryNo) {
      toast.error("Invalid enquiry number.");
      return;
    }
    const normalizedStatus = String(status ?? "").trim().toLowerCase();
    if (!normalizedStatus || normalizedStatus === "select") {
      toast.error("Status is required.");
      return;
    }

    if (status === "Confirmed" && !tentativeDate &&  enquiryType === "OFFSHORE") {
      toast.error("Tentative Start Date is required for OFFSHORE enquiry.");
      return;
    }

    if (status === "Realised" && enquiryType === "ONSITE" && !billingDate) {
      toast.error("Billing Date is required for ONSITE realised enquiry.");
      return;
    }

    const fetchEmailListFromIds = async (ids: string[]) => {
      const uniqueIds = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
      if (uniqueIds.length === 0) return [];
      const { data } = await axios.get(`${baseUrl}/EmailId/${uniqueIds.join(",")}`);
      const list = Array.isArray(data) ? data : [data];
      return list.map((x) => String(x ?? "").trim()).filter(Boolean);
    };

    let toList: string[] = [];
    let ccList: string[] = [];
    try {
      toList = await fetchEmailListFromIds([salesResponsibilityId, completeResponsibilityId]);
      ccList = await fetchEmailListFromIds([loginId]);
    } catch (error) {
      console.warn("Failed to resolve To/CC email lists.", error);
    }

    const isReasonStatus = defaultStatusOptions.includes(status);

    const payload = {
      enquiryno: enquiryNo,
      status,
      billingDate: enquiryType === "ONSITE" ?  billingDate  || null : null,
      tentativeDate: enquiryType === "OFFSHORE" ? tentativeDate || null : null,
      reason: isReasonStatus ? reason : null,
     // statusremarks: !isReasonStatus ? statusremarks : null,
      statusremarks: status === "Realised" ? statusremarks : null,
      ToMailList: JSON.stringify(toList),
      CCMailList: JSON.stringify(ccList),
    };

    const endpoints = [{ method: "put" as const, url: `${baseUrl}/api/Sales/UpdateEnquiryStatus` },];

    let updated = false;
    for (const ep of endpoints) {
      try {
        await axios[ep.method](ep.url, payload);
        updated = true;
        break;
      } catch (error) {
        console.warn("Failed to update enquiry status:", ep, error);
        // try next endpoint variant
      }
    }

    if (!updated) {
      toast.error("Unable to update enquiry status.");
      return;
    }

    toast.success("Enquiry status updated.");
    navigate("/Home/ViewAllEnquiries");
  };

  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: "auto",
        mt: 20,
        px: { xs: 1.5, md: 0 },
        fontFamily: "Arial",
      }}
    >
      <Card
        sx={{
          width: "100%",
          m: "auto",
          mt: 1.25,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          "& .MuiTypography-root, & .MuiInputBase-input, & .MuiInputLabel-root": {
            fontFamily: "Arial",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.2 } }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#0f4ea6", letterSpacing: "0.01em", fontSize: { xs: "1rem", md: "1.1rem" } }}
          >
            Status of the Enquiry
          </Typography>

          <Box
            sx={{
              mt: 1.2,
              borderRadius: 2,
              border: "1px solid #d5e1f8",
              boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
              background: "#ffffff",
              p: { xs: 1.4, md: 1.7 },
            }}
          >
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={26} />
              </Box>
            ) : (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", rowGap: 1.2 }}>
                  <Box sx={{ maxWidth: 250 }}>
                    <SelectControl
                      name="status"
                      label="Status"
                      value={status}
                      options={[
                        { value: "", label: "Select" },
                        ...statusOptions.map((s) => ({ value: s, label: s })),
                      ]}
                      onChange={(e: any) => setStatus(e.target.value)}
                      fullWidth
                      height={34}
                    />
                  </Box>

                  {enquiryType === "ONSITE" && status === "Realised" && (
                    <Box sx={{ maxWidth: 250 }}>
                      <Label text="Billing Date" bold />
                      <TextControl
                        type="date"
                        name="billingDate"
                        value={formatDateYYYYMMDD(billingDate)}
                        onChange={(e) => setBillingDate(formatDateYYYYMMDD(e.target.value))}
                        fullWidth
                        style={standardInputStyle}
                      />
                    </Box>
                  )}

                  {["Rejected By Customer", "Rejected By US", "Cancelled", "Hold", "Confirmed", "Tentative"].includes(status) && (
                    <Box>
                      <Label text="Reason" bold />
                      <TextControl
                        name="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        multiline
                        rows={2}
                        fullWidth
                        style={{ ...standardInputStyle, padding: "8px", height: "60px" }}
                      />
                    </Box>
                  )}

                  {status === "Realised" && (
                    <Box>
                      <Label text="Status Remarks" bold />
                      <TextControl
                        name="statusremarks"
                        value={statusremarks}
                        onChange={(e) =>
                          setStatusRemarks(e.target.value.replace(REMARKS_ALLOWED_CHARS_REGEX, ""))
                        }
                        multiline
                        rows={2}
                        fullWidth
                        style={{
                          ...standardInputStyle,
                          height: "auto",
                          minHeight: 72,
                          padding: "8px 10px",
                          resize: "vertical",
                        }}
                      />
                    </Box>
                  )}

                  {status === "Confirmed" && (
                    <Box sx={{ maxWidth: 250 }}>
                      <Label text="Tentative Start Date" bold />
                      <TextControl
                        type="date"
                        name="tentativeDate"
                      //  value={formatDateYYYYMMDD(tentativeDate)}
                        value={tentativeDate}
                      //  onChange={(e) => setTentativeDate(formatDateYYYYMMDD(e.target.value))}
                      onChange={(e) => setTentativeDate(e.target.value)}
                        fullWidth
                        style={standardInputStyle}
                      />
                    </Box>
                  )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                  <Button variant="contained" size="small" onClick={handleSubmit}>
                    Submit
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnquiryStatus;
