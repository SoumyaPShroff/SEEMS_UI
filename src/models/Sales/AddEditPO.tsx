import React, { useEffect, useState } from "react";
import { Box, Button, Grid, TextField, Typography, Paper, Checkbox, FormControlLabel, CircularProgress } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import type { PurchaseOrderData } from "./PurchaseOrder";

interface DuplicateCheckResponse {
  exists: {
    isDuplicateForDifferentCustomer: boolean;
    message: string;
  };
}

interface ScopeConfig {
  layout: boolean;
  analysis: boolean;
  va: boolean;
  npi: boolean;
  library: boolean;
  dfm: boolean;
  isOnsite: boolean;
}

const MAX_QTY_DIGITS = 6;
const MAX_QTY_VALUE = 999999;

// Strips negative signs/exponent notation and caps the integer part to MAX_QTY_DIGITS digits
const sanitizeQtyInput = (raw: string): string => {
  let value = raw.replace(/[^0-9.]/g, ""); // drop "-", "+", "e"/"E" and any other non-numeric chars

  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value = value.slice(0, firstDot + 1) + value.slice(firstDot + 1).replace(/\./g, "");
  }

  const [intPart, decPart] = value.split(".");
  const trimmedInt = intPart.slice(0, MAX_QTY_DIGITS);
  return decPart !== undefined ? `${trimmedInt}.${decPart}` : trimmedInt;
};

// Blocks the "-", "+", "e"/"E" keystrokes that native <input type="number"> would otherwise accept
const blockNegativeAndExponentKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

const AddEditPO: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillEnquiryNo = (searchParams.get("enquiryno") || "").trim();

  const statePo = (location.state as { po?: PurchaseOrderData } | null)?.po ?? null;

  const [existingPos, setExistingPos] = useState<PurchaseOrderData[]>([]);
  const [po, setPo] = useState<PurchaseOrderData | null>(statePo);
  const [pageLoading, setPageLoading] = useState(!!id);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PurchaseOrderData>();

  // Wraps register() for Qty fields: enforces non-negative, max-6-digit values live as the user types
  const registerQty = (name: "layQty" | "analyQty" | "vaQty" | "npiQty" | "dfmQty" | "libQty") => {
    const field = register(name, {
      valueAsNumber: true,
      min: { value: 0, message: "Qty cannot be negative" },
      max: { value: MAX_QTY_VALUE, message: `Qty cannot exceed ${MAX_QTY_DIGITS} digits` },
    });
    return {
      ...field,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = sanitizeQtyInput(e.target.value);
        return field.onChange(e);
      },
    };
  };

  // Watch specific fields for calculation - Defined at the top to avoid TDZ ReferenceError
  const layQty = Number(watch("layQty") || 0);
  const layRate = Number(watch("layRateperhr") || 0);
  const analyQty = Number(watch("analyQty") || 0);
  const analyRate = Number(watch("analyRateperhr") || 0);
  const vaQty = Number(watch("vaQty") || 0);
  const vaRate = Number(watch("vaRateperhr") || 0);
  const npiQty = Number(watch("npiQty") || 0);
  const npiRate = Number(watch("npiRateperhr") || 0);
  const dfmQty = Number(watch("dfmQty") || 0);
  const dfmRate = Number(watch("dfmRateperhr") || 0);
  const libQty = Number(watch("libQty") || 0);
  const libRate = Number(watch("libRateperhr") || 0);
  const currencyId = Number(watch("pcurrency_id") || 0);

  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [scopeLoaded, setScopeLoaded] = useState(false);
  const [apiSameEnquiryDuplicate, setApiSameEnquiryDuplicate] = useState(false);
  const [enquiryOptions, setEnquiryOptions] = useState<{ value: string; label: string }[]>([]);
  const [quoteOptions, setQuoteOptions] = useState<{ value: string; label: string }[]>([]);
  const [scopeConfig, setScopeConfig] = useState<ScopeConfig>({
    layout: false,
    analysis: false,
    va: false,
    npi: false,
    library: false,
    dfm: false,
    isOnsite: false,
  });
  const [enquiryType, setEnquiryType] = useState<string>("");
  const [enquiryCategory, setEnquiryCategory] = useState<string>("");

  const goBack = () => navigate("/Home/PurchaseOrder");

  // Load the full PO list once, both for duplicate-checking and to resolve the PO being edited by id
  useEffect(() => {
    const loadExistingPos = async () => {
      try {
        const res = await axios.get<PurchaseOrderData[]>(`${baseUrl}/api/Sales/poenquiries`);
        const data = Array.isArray(res.data) ? res.data : [];
        setExistingPos(data);

        if (id) {
          const found = data.find((p) => String(p.id) === String(id));
          if (found) {
            setPo(found);
          } else if (!statePo) {
            toast.error("Purchase Order not found");
            goBack();
          }
        }
      } catch (error) {
        console.error("Error loading purchase orders:", error);
        toast.error("Failed to load Purchase Orders");
      } finally {
        setPageLoading(false);
      }
    };
    loadExistingPos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchScopeConfig = async (enqNo: string) => {
    try {
      setScopeLoaded(false);

      const enqDetailsRes = await axios.get(
        `${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enqNo}`
      );
      const enqData = Array.isArray(enqDetailsRes.data)
        ? enqDetailsRes.data[0]
        : enqDetailsRes.data;

      const currentEnquiryType = String(enqData?.enquirytype || "").toUpperCase();
      setEnquiryType(currentEnquiryType);
      setEnquiryCategory(enqData?.type || enqData?.enquiryType || "");

      const scopeRes = await axios.get<ScopeConfig>(
        `${baseUrl}/api/Sales/JobScopesConfig/${enqNo}`
      );

      let config = scopeRes.data as ScopeConfig;

      if (currentEnquiryType === "ONSITE") {
        config = {
          layout: true,
          analysis: false,
          va: false,
          npi: false,
          library: false,
          dfm: false,
          isOnsite: true,
        };
      }

      setScopeConfig(config);

      if (currentEnquiryType !== "ONSITE" && config && !(config.layout || config.analysis || config.va || config.npi || config.library || config.dfm)) {
        toast.warn("All the scopes are disabled. Please update the scope for the selected enquiry");
      }

      setScopeLoaded(true);
    } catch {
      setScopeLoaded(true);
    }
  };

  useEffect(() => {
    if (!scopeLoaded) return;

    const total =
      (enquiryType === "ONSITE"
        ? layQty * layRate
        : (scopeConfig.layout ? layQty * layRate : 0))
      +
      (scopeConfig.analysis && enquiryType !== "ONSITE" ? analyQty * analyRate : 0)
      +
      (scopeConfig.va && enquiryType !== "ONSITE" ? vaQty * vaRate : 0)
      +
      (scopeConfig.npi && enquiryType !== "ONSITE" ? npiQty * npiRate : 0)
      +
      (scopeConfig.dfm && enquiryType !== "ONSITE" ? dfmQty * dfmRate : 0)
      +
      (scopeConfig.library && enquiryType !== "ONSITE" ? libQty * libRate : 0);

    setValue("ppoamount", total);
    if (!po) { setValue("pbalanceamt", total); } // only set in add mode not in edit mode
  }, [
    scopeLoaded,
    layQty,
    layRate,
    analyQty,
    analyRate,
    vaQty,
    vaRate,
    npiQty,
    npiRate,
    dfmQty,
    dfmRate,
    libQty,
    libRate,
    scopeConfig,
    enquiryType
  ]);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/Sales/AllEnquiries?status=Realised`);
        const data = Array.isArray(res.data) ? res.data : [];
        setEnquiryOptions(data.map((item: any) => ({
          value: item.enquiryno,
          label: item.enquiryno
        })));
      } catch (error) {
        console.error("Error fetching realised enquiries:", error);
      }
    };
    fetchEnquiries();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const applyEnquirySelection = async (enqNo: string) => {
    setValue("penquiryno", enqNo, { shouldValidate: true });
    setValue("pquoteno", "");
    setQuoteOptions([]);
    if (enqNo) {
      await fetchScopeConfig(enqNo);
      const res = await axios.get(`${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enqNo}`);
      const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      setQuoteOptions(data.map((q: any) => ({ value: q.quoteNo, label: q.quoteNo })));
      if (po?.pquoteno) { setValue("pquoteno", po.pquoteno); }
    } else {
      setEnquiryType("");
      setEnquiryCategory("");
      setScopeConfig({ layout: false, analysis: false, va: false, npi: false, library: false, dfm: false, isOnsite: false });
    }
  };

  const onEnquiryChange = async (e: any) => {
    await applyEnquirySelection(e.target.value);
  };

  // Consolidated initialization for metadata and form values
  useEffect(() => {
    if (pageLoading) return;

    const initialize = async () => {
      if (po) {
        try {
          setScopeLoaded(false);
          const enqNo = po.penquiryno;
          const [enqRes, scopeRes, quotesRes] = await Promise.all([
            axios.get(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enqNo}`),
            axios.get(`${baseUrl}/api/Sales/JobScopesConfig/${enqNo}`),
            axios.get(`${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enqNo}`)
          ]);

          let config = scopeRes.data as ScopeConfig;
          const enqData = Array.isArray(enqRes.data) ? enqRes.data[0] : enqRes.data;
          const currentEnqType = String(enqData?.enquirytype || "").toUpperCase();
          setEnquiryType(currentEnqType);
          setEnquiryCategory(enqData?.type || enqData?.enquiryType || "");

          if (currentEnqType === "ONSITE") {
            config = {
              layout: true,
              analysis: false,
              va: false,
              npi: false,
              library: false,
              dfm: false,
              isOnsite: true,
            };
          }
          setScopeConfig(config);

          if (currentEnqType !== "ONSITE" && config && !(config.layout || config.analysis || config.va || config.npi || config.library || config.dfm)) {
            toast.warn("All the scopes are disabled. Please update the scope for the selected enquiry");
          }

          const qData = Array.isArray(quotesRes.data) ? quotesRes.data : quotesRes.data ? [quotesRes.data] : [];
          setQuoteOptions(qData.map((q: any) => ({ value: q.quoteNo, label: q.quoteNo })));

          const mappedData = {
            ...po,
            pcurrency_id: Number(po.pcurrency_id || 1),
            pconvrate: Number(po.pconvrate || 0),
            podate: po.podate ? po.podate.substring(0, 10) : "",

            layQty: currentEnqType === "ONSITE"
              ? Number(po.onsiteQty || 0)
              : Number(po.layQty || 0),

            layRateperhr: currentEnqType === "ONSITE"
              ? Number(po.onsiteRateperhr || 0)
              : Number(po.layRateperhr || 0),

            analyQty: Number(po.analyQty || 0),
            analyRateperhr: Number(po.analyRateperhr || 0),

            vaQty: Number(po.vaQty || 0),
            vaRateperhr: Number(po.vaRateperhr || 0),

            npiQty: Number(po.npiQty || 0),
            npiRateperhr: Number(po.npiRateperhr || 0),

            dfmQty: Number(po.dfmQty || 0),
            dfmRateperhr: Number(po.dfmRateperhr || 0),

            libQty: Number(po.libQty || 0),
            libRateperhr: Number(po.libRateperhr || 0),

            ppoamount: Number(po.ppoamount || 0),
            pbalanceamt: Number(po.pbalanceamt || 0),

            sez: po.sez === "YES" ? "YES" : "NO",
            quoteValue: po.quoteValue === "YES" ? "YES" : "NO",
            quoteTerms: po.quoteTerms === "YES" ? "YES" : "NO",
          };

          reset(mappedData);
          setValue("pcurrency_id", Number(po.pcurrency_id || 1));
          setValue("ppaymentterm", po.ppaymentterm || "");
          setValue("pquoteno", po.pquoteno || "");
          setValue("penquiryno", po.penquiryno || "");
          setScopeLoaded(true);
        } catch (err) {
          console.error("Initialization error:", err);
          setScopeLoaded(true);
        }
      } else {
        // Add mode: Reset all states and set defaults
        setEnquiryType("");
        setEnquiryCategory("");
        setScopeConfig({ layout: false, analysis: false, va: false, npi: false, library: false, dfm: false, isOnsite: false });
        setQuoteOptions([]);
        reset({
          pponumber: "", penquiryno: "", pquoteno: "",
          layQty: 0, layRateperhr: 0, analyQty: 0, analyRateperhr: 0,
          vaQty: 0, vaRateperhr: 0, npiQty: 0, npiRateperhr: 0,
          dfmQty: 0, dfmRateperhr: 0, libQty: 0, libRateperhr: 0,
          ppoamount: 0, pbalanceamt: 0, pcurrency_id: 1, pconvrate: 1,
          ppaymentterm: "", podate: new Date().toISOString().split("T")[0], pcomments: "",
          pemailid: "", pphoneno: "",
          sez: "NO", quoteValue: "NO", quoteTerms: "NO"
        });
        setScopeLoaded(true);

        // Arrived via "Add PO" link for a specific (Realised) enquiry - preselect it instead of
        // making the user pick it again from the dropdown.
        if (prefillEnquiryNo) {
          await applyEnquirySelection(prefillEnquiryNo);
        }
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoading, po, reset]);

  // Register controlled fields for validation
  useEffect(() => {
    register("penquiryno", { required: "Enquiry No is required" });
    register("pquoteno", { required: "Quote No is required" });
    register("ppaymentterm", { required: "Payment Terms are required" });
    register("pcurrency_id", { required: "Currency is required" });
  }, [register]);

  // Zero out disabled fields and recalculate total when config changes
  useEffect(() => {
    if (po) return; // Edit mode

    if (!scopeConfig.layout) { setValue("layQty", 0); setValue("layRateperhr", 0); }
    if (!scopeConfig.analysis) { setValue("analyQty", 0); setValue("analyRateperhr", 0); }
    if (!scopeConfig.va) { setValue("vaQty", 0); setValue("vaRateperhr", 0); }
    if (!scopeConfig.npi) { setValue("npiQty", 0); setValue("npiRateperhr", 0); }
    if (!scopeConfig.dfm) { setValue("dfmQty", 0); setValue("dfmRateperhr", 0); }
    if (!scopeConfig.library) { setValue("libQty", 0); setValue("libRateperhr", 0); }
  }, [scopeConfig, po, setValue]);

  // INR is always 1:1 - keep Conv Rate locked to 1 whenever Currency is INR
  useEffect(() => {
    if (currencyId === 1) {
      setValue("pconvrate", 1, { shouldValidate: true });
    }
  }, [currencyId, setValue]);

  // Validation Logic: Check for duplicate PO Number within the same Enquiry
  const watchedPoNumber = watch("pponumber");
  const watchedEnquiryNo = watch("penquiryno");

  const isDuplicate = !!watchedPoNumber?.trim() && !!watchedEnquiryNo && existingPos.some(item =>
    item.pponumber?.trim().toLowerCase() === watchedPoNumber.trim().toLowerCase() &&
    item.penquiryno === watchedEnquiryNo &&
    String(item.id) !== String(po?.id)
  );

  useEffect(() => {
    setApiSameEnquiryDuplicate(false);
  }, [watchedPoNumber, watchedEnquiryNo]);

  const onSubmit = async (data: PurchaseOrderData) => {
    if (!data.penquiryno || data.penquiryno.trim() === "") {
      toast.error("Enquiry No is required");
      return;
    }
    if (!data.pquoteno || data.pquoteno.trim() === "") {
      toast.error("Quote No is required");
      return;
    }
    if (!data.ppaymentterm || data.ppaymentterm === "Select" || data.ppaymentterm.trim() === "") {
      toast.error("Please select a valid Payment Term");
      return;
    }
    if (!data.pemailid || data.pemailid.trim() === "") {
      toast.error("Email ID is required");
      return;
    }
    if (!file && !po?.pouploadedfile) {
      toast.error("PO File upload is mandatory");
      return;
    }

    if (!po) {
      try {
        const checkResponse = await axios.get<DuplicateCheckResponse>(
          `${baseUrl}/api/Sales/CheckSamePOExistsForDifferentCustomer/${encodeURIComponent(data.pponumber)}/${encodeURIComponent(data.penquiryno)}`
        );

        const result = checkResponse.data?.exists;

        if (result?.isDuplicateForDifferentCustomer) {
          toast.error(result.message);
          return;
        }
      } catch (error: any) {
        console.error("Duplicate PO check failed", error);
        toast.error("Unable to validate PO Number");
        return;
      }
    }

    if (!po && isDuplicate) {
      toast.error("PO Number already exists for this enquiry");
      return;
    }

    if (Number(data.ppoamount || 0) <= 0) {
      toast.error("Cannot save a PO with zero amount. Please enter quantities and rates for the project scope.");
      return;
    }

    setSaving(true);
    const sessionUserId = sessionStorage.getItem("SessionUserID") || "guest";
    let finalPayload: PurchaseOrderData = { ...data };

    try {
      let url: string;

      if (enquiryType === "ONSITE") {
        finalPayload.onsiteQty = data.layQty;
        finalPayload.onsiteRateperhr = data.layRateperhr;

        finalPayload.onsite = String(Number(data.layQty || 0) * Number(data.layRateperhr || 0));

        finalPayload.layQty = "0";
        finalPayload.layRateperhr = "0";
        finalPayload.analyQty = "0";
        finalPayload.analyRateperhr = "0";
        finalPayload.vaQty = "0";
        finalPayload.vaRateperhr = "0";
        finalPayload.npiQty = "0";
        finalPayload.npiRateperhr = "0";
        finalPayload.dfmQty = "0";
        finalPayload.dfmRateperhr = "0";
        finalPayload.libQty = "0";
        finalPayload.libRateperhr = "0";
      } else {
        finalPayload.onsiteQty = "0";
        finalPayload.onsiteRateperhr = "0";
        finalPayload.onsite = "0";
      }

      finalPayload.sez = data.sez === "YES" ? "YES" : "NO";
      finalPayload.quoteValue = data.quoteValue === "YES" ? "YES" : "NO";
      finalPayload.quoteTerms = data.quoteTerms === "YES" ? "YES" : "NO";
      finalPayload.ppoamount = String(data.ppoamount || 0);
      finalPayload.pbalanceamt = String(data.pbalanceamt || 0);
      finalPayload.layQty = String(data.layQty || 0);
      finalPayload.layRateperhr = String(data.layRateperhr || 0);
      finalPayload.analyQty = String(data.analyQty || 0);
      finalPayload.analyRateperhr = String(data.analyRateperhr || 0);
      finalPayload.vaQty = String(data.vaQty || 0);
      finalPayload.vaRateperhr = String(data.vaRateperhr || 0);
      finalPayload.npiQty = String(data.npiQty || 0);
      finalPayload.npiRateperhr = String(data.npiRateperhr || 0);
      finalPayload.dfmQty = String(data.dfmQty || 0);
      finalPayload.dfmRateperhr = String(data.dfmRateperhr || 0);
      finalPayload.libQty = String(data.libQty || 0);
      finalPayload.libRateperhr = String(data.libRateperhr || 0);
      finalPayload.pconvrate = String(data.pconvrate || 0);
      finalPayload.pcurrency_id = String(data.pcurrency_id || 1);

      if (po) {
        url = `${baseUrl}/api/Sales/EditPO/${po.id}/${sessionUserId}`;
        finalPayload.pupdatedby = sessionUserId;
        finalPayload.pcreatedby = po.pcreatedby;
      } else {
        url = `${baseUrl}/api/Sales/AddPO/${sessionUserId}`;
        finalPayload.pcreatedby = sessionUserId;
      }

      finalPayload.ppoamount = Number(data.ppoamount || 0);
      finalPayload.pbalanceamt = Number(data.pbalanceamt || 0);
      finalPayload.layQty = Number(data.layQty || 0);
      finalPayload.layRateperhr = Number(data.layRateperhr || 0);
      finalPayload.analyQty = Number(data.analyQty || 0);
      finalPayload.analyRateperhr = Number(data.analyRateperhr || 0);
      finalPayload.vaQty = Number(data.vaQty || 0);
      finalPayload.vaRateperhr = Number(data.vaRateperhr || 0);
      finalPayload.npiQty = Number(data.npiQty || 0);
      finalPayload.npiRateperhr = Number(data.npiRateperhr || 0);
      finalPayload.dfmQty = Number(data.dfmQty || 0);
      finalPayload.dfmRateperhr = Number(data.dfmRateperhr || 0);
      finalPayload.libQty = Number(data.libQty || 0);
      finalPayload.libRateperhr = Number(data.libRateperhr || 0);
      finalPayload.pconvrate = String(data.pconvrate || 0);
      finalPayload.pcurrency_id = String(data.pcurrency_id || 1);

      const formData = new FormData();
      Object.entries(finalPayload).forEach(([key, value]) => {
        formData.append(key, value == null ? "" : String(value));
      });
      if (file) {
        formData.append("file", file);
      }

      if (po) {
        await axios.put(url, formData);
      } else {
        await axios.post(url, formData);
      }

      toast.success(po ? "PO Updated" : "PO Created");
      goBack();
    } catch (err: any) {
      console.error("Save error:", err);
      console.error(err.response?.data?.message || JSON.stringify(err.response?.data));
      toast.error(err.response?.data?.message || "Error saving Purchase Order");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ p: 3, mt: 10, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, mt: 10 }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 980,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid #d9e4f5",
          boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(90deg,#1b4f91,#1976d2)",
            color: "#fff",
            fontWeight: 700,
            py: 1.25,
            px: 2.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {po ? `Edit PO: ${po.pponumber}` : "Add New Purchase Order"}
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={1.5}>
              <Grid size={12}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "#1b4f91",
                    fontWeight: 700,
                    borderBottom: "2px solid #1976d2",
                    pb: 0.5,
                    mb: 0.5
                  }}
                >
                  Purchase Order Details
                </Typography>
                {(enquiryType || enquiryCategory) && (
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "orange", mb: 0.5, fontSize: "0.8rem" }}>
                    {enquiryType || "-"} | {enquiryCategory || "-"}
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectControl
                  name="penquiryno"
                  label="Enquiry No"
                  value={watch("penquiryno")}
                  options={enquiryOptions}
                  onChange={onEnquiryChange}
                  error={!!errors.penquiryno}
                  required
                />
                {errors.penquiryno && <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>{errors.penquiryno.message}</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectControl
                  name="pquoteno"
                  label="Quote No"
                  value={watch("pquoteno")}
                  options={quoteOptions}
                  onChange={(e: any) => setValue("pquoteno", e.target.value, { shouldValidate: true })}
                  error={!!errors.pquoteno}
                  required
                />
                {errors.pquoteno && <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>{errors.pquoteno.message}</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField {...register("pponumber", { required: "PO Number is required" })} label="PO Number" fullWidth size="small" required error={!!errors.pponumber} helperText={errors.pponumber?.message} InputLabelProps={{ shrink: true }} />
                {(isDuplicate || apiSameEnquiryDuplicate) && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block", fontWeight: "bold" }}>
                    This PO Number is already entered for this Enquiry.
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField {...register("podate", { required: "PO Date is required" })} type="date" label="PO Date" fullWidth size="small" required error={!!errors.podate} helperText={errors.podate?.message} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectControl
                  name="pcurrency_id"
                  label="Currency"
                  value={watch("pcurrency_id") ?? 1}
                  options={[
                    { value: 1, label: "INR" },
                    { value: 2, label: "USD" },
                    { value: 3, label: "EURO" },
                  ]}
                  onChange={(e: any) => setValue("pcurrency_id", Number(e.target.value), { shouldValidate: true })}
                  error={!!errors.pcurrency_id}
                  required
                />
                {errors.pcurrency_id && <Typography variant="caption" color="error" sx={{ fontWeight: "bold", ml: 1 }}>{errors.pcurrency_id.message}</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  {...register("pconvrate", {
                    required: "Conversion Rate is required"
                  })}
                  type="number"
                  inputProps={{ step: "any" }}
                  label="Conv Rate"
                  fullWidth
                  size="small"
                  required
                  disabled={currencyId === 1}
                  error={!!errors.pconvrate}
                  helperText={currencyId === 1 ? "INR is always 1" : errors.pconvrate?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectControl
                  name="ppaymentterm"
                  label="Payment Terms"
                  value={watch("ppaymentterm") ?? ""}
                  options={[
                    { value: "", label: "Select" },
                    { value: "100% Advance", label: "100% Advance" },
                    { value: "50% Advance, Balance Against Delivery", label: "50% Advance, Balance Against Delivery" },
                    { value: "Net 30 Days", label: "Net 30 Days" },
                    { value: "Within 30  Days", label: "Within 30  Days" },
                    { value: "Net 7 Days", label: "Net 7 Days" },
                    { value: "100% Against Invoice", label: "100% Against Invoice" },

                    { value: "30 Day PDC", label: "30 Day PDC" },
                    { value: "15 Days from the receipt of Invoice", label: "15 Days from the receipt of Invoice" },
                    { value: "25% Advance, 75% Against Delivery", label: "25% Advance, 75% Against Delivery" },
                    { value: "Net 60 Days", label: "Net 60 Days" },
                    { value: "Net 45 Days", label: "Net 45 Days" },
                  ]}
                  onChange={(e: any) => setValue("ppaymentterm", e.target.value, { shouldValidate: true })}
                  error={!!errors.ppaymentterm}
                  required
                />
                {errors.ppaymentterm && <Typography variant="caption" color="error" sx={{ fontWeight: "bold" }}>{errors.ppaymentterm.message}</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  {...register("pemailid", {
                    required: "Email ID is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                  label="Invoice To"
                  placeholder="Enter Email Id"
                  fullWidth
                  size="small"
                  required
                  error={!!errors.pemailid}
                  helperText={errors.pemailid?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  {...register("pphoneno")}
                  label="Phone No"
                  fullWidth
                  size="small"
                  error={!!errors.pphoneno}
                  helperText={errors.pphoneno?.message}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField {...register("pcomments")} label="Comments" fullWidth size="small" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                {/* <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mb: 0.3 }}>
                  Upload PO File <span style={{ color: "#d32f2f" }}>*</span>
                </Typography> */}
                <Box
                  sx={{
                    border: `2px dashed ${!file && !po?.pouploadedfile ? "#e57373" : "#9ebcf0"}`,
                    borderRadius: 2,
                    p: 0.5,
                    textAlign: "center",
                    bgcolor: "#f5f9ff",
                    cursor: "pointer",
                    minHeight: 40,
                    mx: "auto",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                  onClick={() => document.getElementById("poFileInput")?.click()}
                >
                  <CloudUploadIcon sx={{ fontSize: 16, color: "#2196f3", alignSelf: "center" }} />
                  <Typography variant="caption" sx={{ mt: 0.2, fontSize: "0.6rem", lineHeight: 1.1 }}>
                    {file
                      ? file.name
                      : po?.pouploadedfile
                        ? "Click to replace"
                        : "Click to upload PO file"}
                  </Typography>
                  <input
                    type="file"
                    id="poFileInput"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.4, display: "block", textAlign: "center", fontSize: "0.6rem" }}
                >
                  Zip multiple files before upload.
                </Typography>
                {!file && po?.pouploadedfile && (
                  <Typography variant="caption" sx={{ mt: 0.5, display: "block", textAlign: "center" }}>
                    Current file:{" "}
                    <a
                      href={`${baseUrl}/api/Sales/DownloadPOFile/${po.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </Typography>
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 1 }} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  sx={{
                    m: 0,
                    height: 32,
                    "& .MuiFormControlLabel-label": { fontSize: "1rem" },
                  }}
                  control={
                    <Checkbox
                      size="small"
                      sx={{ p: 0.5, "& .MuiSvgIcon-root": { fontSize: "1.4rem" } }}
                      checked={watch("sez") === "YES"}
                      onChange={(e) => setValue("sez", e.target.checked ? "YES" : "NO", { shouldValidate: true })}
                    />
                  }
                  label="SEZ"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 9 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: "#1b4f91", mb: 0.25 }}>
                  PO Validation against Quotation
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <FormControlLabel
                    sx={{
                      m: 0,
                      height: 32,
                      "& .MuiFormControlLabel-label": { fontSize: "1rem" },
                    }}
                    control={
                      <Checkbox
                        size="small"
                        sx={{ p: 0.5, "& .MuiSvgIcon-root": { fontSize: "1.4rem" } }}
                        checked={watch("quoteValue") === "YES"}
                        onChange={(e) => setValue("quoteValue", e.target.checked ? "YES" : "NO", { shouldValidate: true })}
                      />
                    }
                    label="Value"
                  />
                  <FormControlLabel
                    sx={{
                      m: 0,
                      height: 32,
                      "& .MuiFormControlLabel-label": { fontSize: "1rem" },
                    }}
                    control={
                      <Checkbox
                        size="small"
                        sx={{ p: 0.5, "& .MuiSvgIcon-root": { fontSize: "1.4rem" } }}
                        checked={watch("quoteTerms") === "YES"}
                        onChange={(e) => setValue("quoteTerms", e.target.checked ? "YES" : "NO", { shouldValidate: true })}
                      />
                    }
                    label="Terms & Conditions"
                  />
                </Box>
              </Grid>
              <Grid size={12}>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 0.75,
                        borderRadius: 1.5,
                        background:
                          "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                        color: "white",
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                        Total PO Amount
                      </Typography>

                      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {Number(watch("ppoamount") || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: 0.75,
                        borderRadius: 1.5,
                        background:
                          "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)",
                        color: "white",
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                        Balance Amount
                      </Typography>

                      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                        {Number(watch("pbalanceamt") || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>Scope & Breakdown</Typography>
                <Box sx={{ borderRadius: 3, p: 1.5, backgroundColor: "#fafafa", border: "1px solid #e0e0e0", boxShadow: 1 }}>
                  <Grid container spacing={1} alignItems="center">
                    {/* Layout */}
                    <Grid size={4}><Typography variant="body2">Layout</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("layQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.layout} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("layRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.layout} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>

                    {/* Analysis */}
                    <Grid size={4}><Typography variant="body2">Analysis</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("analyQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.analysis} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("analyRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.analysis} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>

                    {/* VA */}
                    <Grid size={4}><Typography variant="body2">VA</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("vaQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.va} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("vaRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.va} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>

                    {/*  NPI is replaced with ATS heading - ATS */} 
                    <Grid size={4}><Typography variant="body2">ATS</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("npiQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.npi} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("npiRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.npi} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>

                    {/* DFM */}
                    <Grid size={4}><Typography variant="body2">DFX</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("dfmQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.dfm} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("dfmRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.dfm} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>

                    {/* Library */}
                    <Grid size={4}><Typography variant="body2">Library</Typography></Grid>
                    <Grid size={4}><TextField {...registerQty("libQty")} onKeyDown={blockNegativeAndExponentKeys} disabled={!scopeConfig.library} type="number" inputProps={{ step: "any", min: 0, maxLength: MAX_QTY_DIGITS }} label="Qty" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                    <Grid size={4}><TextField {...register("libRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.library} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{
              p: 1.5,
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid #e5ecf8",
            }}
          >
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button onClick={goBack} color="inherit" size="small">
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={saving || isDuplicate || (!file && !po?.pouploadedfile)}
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none"
                }}
              >
                {po ? "Update" : "Save"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default AddEditPO;
