import React, { useEffect, useState, useMemo } from "react";
// import {
//   Box, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Tooltip,
//   TextField, Typography, CircularProgress
// } from "@mui/material";
import { Box,  Button, IconButton,  Dialog,  DialogTitle,  DialogContent,  DialogActions,
  Grid,  Tooltip,  TextField,  Typography,  CircularProgress,  Paper,  Divider} from "@mui/material";
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../const/BaseUrl";

interface PurchaseOrderData {
  id?: number | string;
  itemno?: string;
  pponumber: string;
  penquiryno: string;
  pquoteno: string;
  layQty?: string | number;
  layRateperhr?:string | number;
  analyQty?: string | number;
  analyRateperhr?:string | number;
  vaQty?: string | number;
  vaRateperhr?:string | number;
  npiQty?: string | number;
  npiRateperhr?: string | number;
  dfmQty?: string | number;
  dfmRateperhr?: string | number;
  libQty?: string | number;
  libRateperhr?:  string | number;
  pcurrency_id?: number | string;
  ppoamount: string | number;
  pbalanceamt?: string | number;
  podate?: string;
  ppaymentterm?: string;
  pconvrate?: string | number;
  pcomments?: string;
  pcreatedby?: string;
  pupdatedby?: string;

  onsite?: string | number;
  onsiteQty?: string | number;
  onsiteRateperhr?: string | number;

}

const PurchaseOrder: React.FC = () => {
  const [rows, setRows] = useState<PurchaseOrderData[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrderData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRemarks, setDeleteRemarks] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PurchaseOrderData[]>(`${baseUrl}/api/Sales/poenquiries`);
      const data = Array.isArray(response.data) ? response.data : [];
      // Ensure each row has a unique 'id' for the DataGrid
      const normalizedRows = data.map((row: PurchaseOrderData, index: number) => ({
        ...row,
        // id: row.id || row.itemno || index + 1,
        id: Number(row.id) || index + 1,

      }));
      setRows(normalizedRows);
    } catch (error) {
      console.error("Error loading purchase orders:", error);
      toast.error("Failed to load Purchase Orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return rows;
    const lowerSearch = searchText.toLowerCase();
    return rows.filter((row) =>
      row.pponumber?.toLowerCase().includes(lowerSearch) ||
      row.penquiryno?.toLowerCase().includes(lowerSearch) ||
      row.pquoteno?.toLowerCase().includes(lowerSearch)
    );
  }, [rows, searchText]);

  const openDeleteDialog = (id: number | string) => {
    setPendingDeleteId(id);
    setDeleteRemarks("");
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setPendingDeleteId(null);
    setDeleteRemarks("");
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;

    const sessionUserId = sessionStorage.getItem("SessionUserID") || "guest";

    try {
      await axios.post(
        `${baseUrl}/api/Sales/DeletePO/${pendingDeleteId}`,
        null,
        {
          params: {
            sessionUserId,
            delRemarks: deleteRemarks
          }
        }
      );
      toast.success("PO deleted successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to delete PO");
    } finally {
      handleCancelDelete();
    }
  };

  const handleEdit = (po: PurchaseOrderData) => {
    setSelected(po);
    setOpen(true);
  };

  const columns: GridColDef<PurchaseOrderData>[] = [
    { field: "pponumber", headerName: "PO Number", flex: 1 },
    { field: "penquiryno", headerName: "Enquiry", flex: 1 },
    { field: "ppoamount", headerName: "PO Amount", flex: 1 },
    { field: "pbalanceamt", headerName: "Bal Amount", flex: 1 },
    { field: "podate", headerName: "PO Date", flex: 1 },
    { field: "pquoteno", headerName: "Quote", flex: 1 },
    { field: "ppaymentterm", headerName: "PaymentTerms", flex: 1 },
    {
      field: "pcurrency_id",
      headerName: "Currency",
      flex: 1,
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
        const currencyMap: Record<number, string> = { 1: "INR", 2: "USD", 3: "EURO" };
        const label = currencyMap[Number(params.value)] || "Unknown";
        return (
          <Tooltip title={label} arrow>
            <span>{params.value}</span>
          </Tooltip>
        );
      }
    },
    { field: "pconvrate", headerName: "ConvRate", flex: 1 },
    { field: "pcomments", headerName: "Comments", flex: 1 },

    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton color="error" onClick={() => params.row.id && openDeleteDialog(params.row.id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3, mt: 10 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#1b4f91" }}>
        Purchase Order Management
      </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>

      <Button
        variant="contained"
        onClick={() => { setSelected(null); setOpen(true); }}
        sx={{ mb: 2 }}
      >
        New PO
      </Button>
   <TextField
          label="Search POs (Number, Enquiry, Quote)"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ width: '300px' }}
        />
      </Box>
      <Box sx={{ height: 400, width: "100%", mt: 2 }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
        />
      </Box>

      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="sm" fullWidth>
        <DialogTitle>Delete PO?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this Purchase Order? This action cannot be undone.
          </Typography>
          <TextField
            label="Remarks (Optional)"
            multiline
            minRows={3}
            fullWidth
            value={deleteRemarks}
            onChange={(e) => setDeleteRemarks(e.target.value)}
            placeholder="Enter remarks for deletion..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <PoModal
        open={open}
        po={selected}
        existingPos={rows}
        onSave={() => { setOpen(false); loadData(); }}
        onClose={() => setOpen(false)}
      />
      <ToastContainer />
    </Box>
  );
};

/** 
 * Modal Component for Add/Edit PO
 */
interface PoModalProps {
  open: boolean;
  po: PurchaseOrderData | null;
  onSave: () => void;
  onClose: () => void;
  existingPos: PurchaseOrderData[];
}

const PoModal: React.FC<PoModalProps> = ({ open, po, onSave, onClose, existingPos }) => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<PurchaseOrderData>();

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

  const [saving, setSaving] = useState(false);
  const [scopeLoaded, setScopeLoaded] = useState(false);
  const [apiSameEnquiryDuplicate, setApiSameEnquiryDuplicate] = useState(false);
  const [enquiryOptions, setEnquiryOptions] = useState<{ value: string; label: string }[]>([]);
  const [quoteOptions, setQuoteOptions] = useState<{ value: string; label: string }[]>([]);
  const [scopeConfig, setScopeConfig] = useState<Record<string, boolean>>({
    // Initially all disabled
    layout: false,
    analysis: false,
    va: false,
    npi: false,
    library: false,
    dfm: false,
    isOnsite: false, // This field is not directly used for disabling in the current UI, but kept for consistency
  });
  const [enquiryType, setEnquiryType] = useState<string>(""); // New state for enquiryType
  const [enquiryCategory, setEnquiryCategory] = useState<string>("");

  // const fetchScopeConfig = async (enqNo: string) => {
  //   try {
  //     // Fetch enquiry details first to get enquiryType
  //     const enqDetailsRes = await axios.get(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enqNo}`);
  //     const enqData = Array.isArray(enqDetailsRes.data) ? enqDetailsRes.data[0] : enqDetailsRes.data;
  //     const currentEnquiryType = enqData?.enquirytype || "";
  //     setEnquiryType(currentEnquiryType);

  //     // Fetch job scopes config
  //     const scopeRes = await axios.get(`${baseUrl}/api/Sales/JobScopesConfig/${enqNo}`);
  //     let fetchedScopeConfig = scopeRes.data;

  //     // Apply ONSITE specific logic: only layout is enabled
  //     if (currentEnquiryType === "ONSITE") {
  //       fetchedScopeConfig = {
  //         layout: true,
  //         analysis: false,
  //         va: false,
  //         npi: false,
  //         library: false,
  //         dfm: false,
  //         isOnsite: true, // Indicates it's an ONSITE enquiry
  //       };
  //     }
  //     setScopeConfig(fetchedScopeConfig);
  //   } catch (err) {
  //     console.error("Error fetching scope config:", err);
  //     setEnquiryType("");
  //     setScopeConfig({ layout: false, analysis: false, va: false, npi: false, library: false, dfm: false, isOnsite: false });
  //   }
  // };
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

    const scopeRes = await axios.get(
      `${baseUrl}/api/Sales/JobScopesConfig/${enqNo}`
    );

    let config = scopeRes.data;
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
     if (!po) { setValue("pbalanceamt", total); }// only set in add mode not in edit mode
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
    if (open) {
      const fetchEnquiries = async () => {
        try {
          const res = await axios.get(`${baseUrl}/api/Sales/AllEnquiries?status=Realised`);
          const data = Array.isArray(res.data) ? res.data : [];
          setEnquiryOptions(data.map((item: any) => ({
            value: item.enquiryno, // Keep the value as enquiryno
            label: item.enquiryno // Only display the enquiryno in the label
          })));
        } catch (error) {
          console.error("Error fetching realised enquiries:", error);
        }
      };
      fetchEnquiries();
    }
  }, [open]);

  const onEnquiryChange = async (e: any) => {
    const enqNo = e.target.value;
    setValue("penquiryno", enqNo, { shouldValidate: true });
    setValue("pquoteno", "");
    setQuoteOptions([]);
    if (enqNo) {
      await fetchScopeConfig(enqNo); // Await this to ensure scopeConfig and enquiryType are set
      const res = await axios.get(`${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enqNo}`);
      const data = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      setQuoteOptions(data.map((q: any) => ({ value: q.quoteNo, label: q.quoteNo })));
    //  setValue("pquoteno", po.pquoteno);
    if (po?.pquoteno) {setValue("pquoteno", po.pquoteno);
}
    } else {
      setEnquiryType("");
      setEnquiryCategory("");
      setScopeConfig({ layout: false, analysis: false, va: false, npi: false, library: false, dfm: false, isOnsite: false }); // Reset all scopes
    }
  };

  // Consolidated initialization for metadata and form values
  useEffect(() => {
    if (!open) return;

    const initialize = async () => {
      if (po) {
        try {
          setScopeLoaded(false);
          // 1. Fetch metadata FIRST to ensure config and dropdown options are ready
          const enqNo = po.penquiryno;
          const [enqRes, scopeRes, quotesRes] = await Promise.all([
            axios.get(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enqNo}`),
            axios.get(`${baseUrl}/api/Sales/JobScopesConfig/${enqNo}`),
            axios.get(`${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enqNo}`)
          ]);

          const enqData = Array.isArray(enqRes.data) ? enqRes.data[0] : enqRes.data;
          const currentEnqType = String(enqData?.enquirytype || "").toUpperCase();
          setEnquiryType(currentEnqType);
          setEnquiryCategory(enqData?.type || enqData?.enquiryType || "");
          let config = scopeRes.data;
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

          // 2. Reset with mapped data (handling ONSITE mapping)
          // reset({
          //   ...po,
          //   pcurrency_id: Number(po.pcurrency_id || 1),
          //   pconvrate: Number(po.pconvrate || 0),
          //   podate: po.podate ? po.podate.substring(0, 10) : "",
          //   // For ONSITE, backend data is in onsiteQty/onsiteRateperhr, UI uses layQty/layRateperhr fields
          //   layQty: currentEnqType === "ONSITE" ? Number(po.onsiteQty || 0) : Number(po.layQty || 0),
          //   layRateperhr: currentEnqType === "ONSITE" ? Number(po.onsiteRateperhr || 0) : Number(po.layRateperhr || 0),
          //   analyQty: Number(po.analyQty || 0),
          //   analyRateperhr: Number(po.analyRateperhr || 0),
          //   vaQty: Number(po.vaQty || 0),
          //   vaRateperhr: Number(po.vaRateperhr || 0),
          //   npiQty: Number(po.npiQty || 0),
          //   npiRateperhr: Number(po.npiRateperhr || 0),
          //   dfmQty: Number(po.dfmQty || 0),
          //   dfmRateperhr: Number(po.dfmRateperhr || 0),
          //   libQty: Number(po.libQty || 0),
          //   libRateperhr: Number(po.libRateperhr || 0),
          //   ppoamount: Number(po.ppoamount || 0),
          //   pbalanceamt: Number(po.pbalanceamt || 0),
          // });
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
          ppoamount: 0, pbalanceamt: 0, pcurrency_id: 1, pconvrate: 0,
          ppaymentterm: "", podate: new Date().toISOString().split("T")[0], pcomments: ""
        });
        setScopeLoaded(true);
      }
    };
    initialize();
  }, [open, po, reset]);

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

  // Validation Logic: Check for duplicate PO Number within the same Enquiry
  const watchedPoNumber = watch("pponumber");
  const watchedEnquiryNo = watch("penquiryno");

  const isDuplicate = !!watchedPoNumber?.trim() && !!watchedEnquiryNo && existingPos.some(item =>
    item.pponumber?.trim().toLowerCase() === watchedPoNumber.trim().toLowerCase() &&
    item.penquiryno === watchedEnquiryNo &&
    String(item.id) !== String(po?.id) // Exclude the current PO if editing
  );

  useEffect(() => {
    // Clear API duplicate flag when user edits the PO number or enquiry selection
    setApiSameEnquiryDuplicate(false);
  }, [watchedPoNumber, watchedEnquiryNo]);


  const onSubmit = async (data: PurchaseOrderData) => {
    // 1. Client-side validation for required selection fields
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

    // New requirement: Check if PO Number exists for a different customer (only in add mode)
if (!po) {
  try {
    const checkResponse = await axios.get(
      `${baseUrl}/api/Sales/CheckSamePOExistsForDifferentCustomer/${encodeURIComponent(data.pponumber)}/${encodeURIComponent(data.penquiryno)}`
    );

    const result = checkResponse.data?.exists;

    if (result?.isDuplicateForDifferentCustomer) {
      toast.error(result.message);
      return; // Stop save
    }
  } catch (error: any) {
    console.error("Duplicate PO check failed", error);
    toast.error("Unable to validate PO Number");
    return;
  }
}

    // Client-side duplicate check (only in add mode, as edit mode handles PO selection differently)
    if (!po && isDuplicate) {
      toast.error("PO Number already exists for this enquiry");
      return;
    }

    // Validate that at least one scope has a value (Total Amount > 0)
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
        // For ONSITE, map layout fields to onsite fields
        finalPayload.onsiteQty = data.layQty;
        finalPayload.onsiteRateperhr = data.layRateperhr;

        finalPayload.onsite = String(Number(data.layQty || 0) * Number(data.layRateperhr || 0));

        // Set all other scope quantities and rates to 0 for ONSITE
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
        // For OFFSHORE, ensure onsite fields are 0
        finalPayload.onsiteQty = "0";
        finalPayload.onsiteRateperhr = "0";
        finalPayload.onsite = "0";
      }

      // Ensure fields are strings in the payload to satisfy strict backend JSON parsing
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
        finalPayload.pcreatedby = po.pcreatedby; // Preserve createdby from original PO
      } else {
        url = `${baseUrl}/api/Sales/AddPO/${sessionUserId}`;
        finalPayload.pcreatedby = sessionUserId; // Set created by user for new PO
      }

      // Ensure numeric fields are numbers in the payload
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
     // finalPayload.pconvrate = Number(data.pconvrate || 0);
     finalPayload.pconvrate = String(data.pconvrate || 0);
     // finalPayload.pcurrency_id = Number(data.pcurrency_id || 1);
     finalPayload.pcurrency_id = String(data.pcurrency_id || 1);

      console.log("Submitting Payload:", finalPayload);
      if (po) {
        await axios.put(url, finalPayload);
      } else {
        await axios.post(url, finalPayload);
      }

      toast.success(po ? "PO Updated" : "PO Created");
      onSave();
    } catch (err: any) { // Catch the error as 'any' to access response data
      console.error("Save error:", err);
      console.error(err.response?.data?.message || JSON.stringify(err.response?.data));
     // toast.error( err.response?.data?.message || JSON.stringify(err.response?.data) || "Error saving Purchase Order"
      toast.error( err.response?.data?.message || "Error saving Purchase Order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* <DialogTitle sx={{ bgcolor: "#f5f5f5", fontWeight: "bold", p: 1 }}> */}
      <DialogTitle
  sx={{
    background:
      "linear-gradient(90deg,#1b4f91,#1976d2)",
    color: "#fff",
    fontWeight: 700,
    py: 2
  }}
>
        {po ? `Edit PO: ${po.pponumber}` : "Add New Purchase Order"}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
  <Typography
    variant="h6"
    sx={{
      color: "#1b4f91",
      fontWeight: 700,
      borderBottom: "2px solid #1976d2",
      pb: 1,
      mb: 1
    }}
  >
    Purchase Order Details
  </Typography>
              {(enquiryType || enquiryCategory) && (
                <Typography variant="body2" sx={{ fontWeight: 500, color: "orange", mb: 1 }}>
                   {enquiryType || "-"} | {enquiryCategory || "-"}
                </Typography>
              )}
</Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SelectControl
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
                label="Currency"
                value={watch("pcurrency_id")}
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
                error={!!errors.pconvrate}
                helperText={errors.pconvrate?.message}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SelectControl
                label="Payment Terms"
                value={watch("ppaymentterm")}
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
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField {...register("pcomments")} label="Comments" fullWidth size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={12}>
  <Grid container spacing={2}>
    <Grid size={{ xs: 12, md: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          borderRadius: 1.5,
          background:
            "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
          color: "white",
          textAlign: 'center'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Total PO Amount
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {Number(watch("ppoamount") || 0).toLocaleString()}
        </Typography>
      </Paper>
    </Grid>

    <Grid size={{ xs: 12, md: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          borderRadius: 1.5,
          background:
            "linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)",
          color: "white",
          textAlign: 'center'
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Balance Amount
        </Typography>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {Number(watch("pbalanceamt") || 0).toLocaleString()}
        </Typography>
      </Paper>
    </Grid>
 
  </Grid>
</Grid>
{/* <Grid size={12}>
  <Divider sx={{ my: 2 }} />

  <Typography
    variant="h6"
    sx={{
      color: "#1b4f91",
      fontWeight: 700
    }}
  >
    Scope Breakdown
  </Typography>
</Grid> */}
            <Grid size={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>Scope & Breakdown</Typography>
             <Box   sx={{  borderRadius: 3, p: 3,  backgroundColor: "#fafafa", border: "1px solid #e0e0e0", boxShadow: 1  }}>
                <Grid container spacing={2} alignItems="center">
                  {/* Layout */}
                  <Grid size={4}><Typography variant="body2">Layout</Typography></Grid>
                  <Grid size={4}><TextField {...register("layQty", { valueAsNumber: true })} disabled={!scopeConfig.layout} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("layRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.layout} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>

                  {/* Analysis */}
                  <Grid size={4}><Typography variant="body2">Analysis</Typography></Grid>
                  <Grid size={4}><TextField {...register("analyQty", { valueAsNumber: true })} disabled={!scopeConfig.analysis} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("analyRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.analysis} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>

                  {/* VA */}
                  <Grid size={4}><Typography variant="body2">VA</Typography></Grid>
                  <Grid size={4}><TextField {...register("vaQty", { valueAsNumber: true })} disabled={!scopeConfig.va} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("vaRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.va} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>

                  {/* NPI */}
                  <Grid size={4}><Typography variant="body2">NPI</Typography></Grid>
                  <Grid size={4}><TextField {...register("npiQty", { valueAsNumber: true })} disabled={!scopeConfig.npi} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("npiRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.npi} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>

                  {/* DFM */}
                  <Grid size={4}><Typography variant="body2">DFM</Typography></Grid>
                  <Grid size={4}><TextField {...register("dfmQty", { valueAsNumber: true })} disabled={!scopeConfig.dfm} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("dfmRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.dfm} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>

                  {/* Library */}
                  <Grid size={4}><Typography variant="body2">Library</Typography></Grid>
                  <Grid size={4}><TextField {...register("libQty", { valueAsNumber: true })} disabled={!scopeConfig.library} type="number" inputProps={{ step: "any" }} label="Qty" fullWidth size="small" /></Grid>
                  <Grid size={4}><TextField {...register("libRateperhr", { valueAsNumber: true })} disabled={!scopeConfig.library} type="number" inputProps={{ step: "any" }} label="Rate" fullWidth size="small" /></Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
          }}
        >

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={onClose} color="inherit">
              Cancel
            </Button>

<Button
  type="submit"
  variant="contained"
  size="large"
  disabled={saving || isDuplicate}
  sx={{
    minWidth: 140,
    borderRadius: 2,
    fontWeight: 700,
    textTransform: "none"
  }}
>
              {po ? "Update" : "Save"}
            </Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PurchaseOrder;