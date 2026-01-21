//import React  from "react";
import React, { useEffect, useState } from "react";
import { Box, Button, TextField, IconButton, Typography, Card, MenuItem } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { useParams } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";
import { OFF_TERMS_AND_CONDITIONS } from "./const/QuoteOffTermsConditions";
import { ON_TERMS_AND_CONDITIONS } from './const/QuoteOnTermsConditions';
import { toast } from "react-toastify";

interface DescriptionItem {
    idNo: number;
    layout: string;
    taxname: string;
    tax_INR: number;
    tax_USD: number;
    tax_EURO: number;
}

interface QuotationItem {
    slNo?: number;
    descriptionId: number;
    currency: "INR" | "USD" | "EURO";
    qty: number;
    rate: number;
    duration: string;
    taxName: string;
    taxRate: number;
    amount: number;
    taxAmount: number;
    incTaxAmount: number;
    locationId: string;
    boardRef: string;
}

interface EnquiryHeaderResponse {
  customer: string;
  contactName: string;
  location: string;
  address: string;
  enquirytype: string;
  locationid: string;
  boardref: string;
}

interface QuotationApiResponse {
  board_ref: string;
  tandc: string;
  items: any[];
}

const emptyItem = (locationId = "", boardRef = ""): QuotationItem => ({
    descriptionId: 0,
    qty: 1,
    rate: 0,
    duration: "",
    currency: "INR",
    taxName: "",
    taxRate: 0,
    amount: 0,
    taxAmount: 0,
    incTaxAmount: 0,
    locationId,
    boardRef,
});

const durationOptions = [
    "Month",
    "Week",
    "Day",
    "Hour",
    "Number",
    "Time",
    "Set"
];

const currencyOptions = [
    "INR",
    "USD",
    "EURO"
];

const AddQuotation: React.FC = () => {
    console.log("🔥 AddQuotation component mounted");
    // return null;
    //const navigate = useNavigate();
    const { enquiryNo, quoteNo } = useParams();
    // Header fields
    const [customer, setCustomer] = useState("");
    const [contactName, setContactName] = useState("");
    const [location, setLocation] = useState("");
    const [address, setAddress] = useState("");
    const [enquiryType, setEnquiryType] = useState("");
    const [locationId, setLocationId] = useState("");
    const [boardRef, setBoardRef] = useState("");
    const [enquiryBoardRef, setEnquiryBoardRef] = useState(""); // new: store original enquiry boardRef , again reset to enqu boardref when new quote cicked
    // Description master list from backend
    const [descriptions, setDescriptions] = useState<DescriptionItem[]>([]);
    const [items, setItems] = useState<QuotationItem[]>([
        {
            descriptionId: 0,
            qty: 1,
            rate: 0,
            duration: "",
            currency: "INR",
            taxName: "",
            taxRate: 0,
            amount: 0,
            taxAmount: 0,
            incTaxAmount: 0,
            locationId: "",
            boardRef: "",
        },
    ]);
    const loginId = sessionStorage.getItem("SessionUserID") || "guest";
    const [terms, setTerms] = useState(OFF_TERMS_AND_CONDITIONS);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [selectedQuoteNo, setSelectedQuoteNo] = useState<string | null>(quoteNo ?? null);
    const isEditMode = Boolean(selectedQuoteNo);
    const [deletedSlNos, setDeletedSlNos] = useState<number[]>([]);
    const [currentVersion, setCurrentVersion] = useState<number>(1);

    useEffect(() => {
        axios.get<DescriptionItem[]>(`${baseUrl}/api/Sales/QuoteBoardDescriptions`)
            .then(r => setDescriptions(r.data));
    }, []);

    // Load descriptions from backend
    useEffect(() => {
        if (!enquiryNo) return;

        const headerUrl = `${baseUrl}/api/Sales/EnqCustLocContData?penquiryNo=${enquiryNo}`;

       // axios.get(headerUrl)
       axios.get<EnquiryHeaderResponse>(headerUrl)
            .then(res => {
                const data = res.data;
                setCustomer(data.customer);
                setContactName(data.contactName);
                setLocation(data.location);
                setAddress(data.address);
                setEnquiryType(data.enquirytype);
                setLocationId(data.locationid);
                setBoardRef(data.boardref);  //for current quote
                setEnquiryBoardRef(data.boardref); // store original enquiry boardRef
            })
            .catch(err => {
                console.error("Failed to load enquiry header data", err);
            });

        const descUrl = `${baseUrl}/api/Sales/QuoteBoardDescriptions`;

      //  axios.get(descUrl)
      axios.get<DescriptionItem[]>(descUrl)
            .then(res => {
                setDescriptions(res.data);
            })
            .catch(err => {
                console.error("Failed to load descriptions", err);
            });

    }, [enquiryNo]);

    useEffect(() => {
        if (enquiryType === 'OFFSHORE') {
            setTerms(OFF_TERMS_AND_CONDITIONS);
        } else if (enquiryType === 'ONSITE') {
            setTerms(ON_TERMS_AND_CONDITIONS);
        }
    }, [enquiryType]);


    useEffect(() => {
        if (!enquiryNo) return;

        const loadQuotes = async () => {
            try {
                const url = `${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enquiryNo}`;
              //  const { data } = await axios.get(url);
                const { data } = await axios.get<QuotationApiResponse>(url);
                const list = Array.isArray(data) ? data : [data];
                setQuotes(list);

                // auto select first quote if none selected
                if (!selectedQuoteNo && list.length > 0) {
                    setSelectedQuoteNo(list[0].quoteNo);
                }
            } catch (err) {
                console.error("Failed to load quotes", err);
            }
        };

        loadQuotes();
    }, [enquiryNo]);

    useEffect(() => {
        // Only run if we have enquiryNo, selectedQuoteNo, and descriptions loaded
        if (!enquiryNo || !selectedQuoteNo || descriptions.length === 0) return;

        const fetchQuotation = async () => {
            try {
                const url = `${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enquiryNo}?quoteNo=${selectedQuoteNo}`;
               // const { data } = await axios.get(url);
                const { data } = await axios.get<QuotationApiResponse>(url);
                
                if (!data) return;

                // Set board ref and terms
                setBoardRef(data.board_ref ?? "");
                setTerms(data.tandc ?? (enquiryType === "OFFSHORE" ? OFF_TERMS_AND_CONDITIONS : ON_TERMS_AND_CONDITIONS));

                // Map API items to QuotationItem
                const mappedItems: QuotationItem[] = (data.items || []).map((apiItem: any) => {
                    const desc = descriptions.find(d => d.layout === apiItem.layout);

                    const descriptionId = desc?.idNo ?? 0;

                    const currency =
                        apiItem.currency_id === 1 ? "INR" :
                            apiItem.currency_id === 2 ? "USD" : "EURO";

                    let taxRate = 0;
                    if (currency === "INR") taxRate = desc?.tax_INR ?? 0;
                    if (currency === "USD") taxRate = desc?.tax_USD ?? 0;
                    if (currency === "EURO") taxRate = desc?.tax_EURO ?? 0;

                    const qty = Number(apiItem.quantity || 0);
                    const rate = Number(apiItem.unit_rate || 0);

                    const amount = qty * rate;
                    const taxAmount = (amount * taxRate) / 100;
                    const incTaxAmount = amount + taxAmount;

                    return {
                        slNo: apiItem.slNo,
                        descriptionId,
                        qty,
                        rate,
                        duration: apiItem.durationtype || "",
                        currency,
                        taxName: desc?.taxname ?? "",
                        taxRate,
                        amount,
                        taxAmount,
                        incTaxAmount,
                        locationId: locationId,
                        boardRef: boardRef,
                    };
                });

                // Set items, default to one empty row if none
                setItems(mappedItems.length ? mappedItems : [{
                    descriptionId: 0,
                    qty: 1,
                    rate: 0,
                    duration: "",
                    currency: "INR",
                    taxName: "",
                    taxRate: 0,
                    amount: 0,
                    taxAmount: 0,
                    incTaxAmount: 0,
                    locationId: locationId,
                    boardRef: boardRef,
                }]);

            } catch (err) {
                console.error("Failed to load quotation", err);
            }
        };

        fetchQuotation();
    }, [enquiryNo, selectedQuoteNo, descriptions]);

    const startNewQuote = () => {
        setSelectedQuoteNo(null);
        setBoardRef(enquiryBoardRef); // reset to enquiry board ref
        setItems([emptyItem(locationId, enquiryBoardRef)]);
        setDeletedSlNos([]);
    };

    // -------------------------
    // Row change
    // -------------------------
    const handleItemChange = <K extends keyof QuotationItem>(
        index: number,
        field: K,
        value: QuotationItem[K]
    ) => {
        setItems(prevItems =>
            prevItems.map((item, i) => {
                if (i !== index) return item; // ✅ other rows untouched

                // 1️⃣ Update changed field
                const updated = { ...item, [field]: value };

                // 2️⃣ Find description (tax master)
                const desc = descriptions.find(
                    d => String(d.idNo) === String(updated.descriptionId)
                );

                // 3️⃣ Tax Name
                const taxName = desc?.taxname ?? "";

                // 4️⃣ Tax Rate based on currency
                let taxRate = 0;
                if (updated.currency === "INR") taxRate = Number(desc?.tax_INR ?? 0);
                if (updated.currency === "USD") taxRate = Number(desc?.tax_USD ?? 0);
                if (updated.currency === "EURO") taxRate = Number(desc?.tax_EURO ?? 0);

                // 5️⃣ Row-level calculations
                const qty = Number(updated.qty) || 0;
                const rate = Number(updated.rate) || 0;

                const amount = qty * rate;
                const taxAmount = (amount * taxRate) / 100;
                const incTaxAmount = amount + taxAmount;

                // 6️⃣ Return updated row
                return {
                    ...updated,
                    taxName,
                    taxRate,
                    amount,
                    taxAmount,
                    incTaxAmount,
                };
            })
        );
    };

    // -------------------------
    // Add row
    // -------------------------
    const addNewItem = () => {
        const defaultLocationId = items.length > 0 ? items[0].locationId : locationId;
        setItems([
            ...items,
            {
                descriptionId: 0,
                qty: 1,
                rate: 0,
                duration: "Month",
                currency: "INR",
                taxName: "GST",
                taxRate: 18,
                amount: 0,
                taxAmount: 0,
                incTaxAmount: 0,
                locationId: defaultLocationId,
                boardRef: boardRef,
            },
        ]);
    };

    // -------------------------
    // Delete row
    // -------------------------
    const deleteItem = (index: number) => {
        const row = items[index];

        if (row.slNo) {
            setDeletedSlNos(prev => [...prev, row.slNo!]);
        }

        setItems(prev => prev.filter((_, i) => i !== index));
    };

    // const totalAmount = items.reduce(
    //     (sum, item) => sum + (Number(item.amount) || 0),
    //     0
    // );

    // const totalTaxAmount = items.reduce(
    //     (sum, item) => sum + (Number(item.taxAmount) || 0),
    //     0
    // );

    const grandTotal = items.reduce(
        (sum, item) => sum + (Number(item.incTaxAmount) || 0),
        0
    );

    const handleSaveQuotation = async () => {
        try {
            const payload = {
                enquiryno: enquiryNo,
                quoteNo: selectedQuoteNo ?? "",   // "" => ADD, value => EDIT
                board_ref: boardRef,
                createdBy: loginId,
                versionNo: 1,
                tandc: terms,

                items: items.map(i => {
                    const desc = descriptions.find(d => d.idNo === i.descriptionId);
                    if (!desc) {
                        toast.error("Please select Description for all line items");
                        return;
                    }
                    return {
                        slNo: i.slNo ?? 0, // 🔴 IMPORTANT: 0 for new rows
                        // layout: desc?.layout ?? "", //dont send empty string to backend
                        layout: desc.layout,
                        quantity: i.qty,
                        unit_rate: i.rate,
                        currency_id:
                            i.currency === "INR" ? 1 :
                                i.currency === "USD" ? 2 : 3,
                        durationtype: i.duration,
                        location_id: i.locationId,
                        updatedbyid: loginId,
                    };
                }),

                deletedSlNos
            };

            const url = selectedQuoteNo ? `${baseUrl}/api/Sales/EditQuotation` : `${baseUrl}/api/Sales/AddQuotation`;

            await axios.post(url, payload);

            toast.success(selectedQuoteNo ? "Quotation edited" : "Quotation added");
            setDeletedSlNos([]);

        } catch (err) {
            console.error(err);
            toast.error("Failed to save quotation");
        }
    };

    useEffect(() => {
        if (!selectedQuoteNo || quotes.length === 0) return;

        const q = quotes.find(q => q.quoteNo === selectedQuoteNo);
        if (q?.versionNo) {
            setCurrentVersion(q.versionNo);
        }
    }, [selectedQuoteNo, quotes]);

    const handleSaveNewVersion = async () => {
        try {
            const newVersion = currentVersion + 1;

            const payload = {
                enquiryno: enquiryNo,
                quoteNo: selectedQuoteNo,       // SAME quote
                board_ref: boardRef,
                createdBy: loginId,
                versionNo: newVersion,          // 🔴 ONLY CHANGE
                tandc: terms,

                items: items.map(i => {
                    const desc = descriptions.find(d => d.idNo === i.descriptionId);
                    if (!desc) {
                        toast.error("Please select Description for all line items");
                        return;
                    }

                    return {
                        slNo: 0,                     // 🔴 force new rows
                        layout: desc.layout,
                        quantity: i.qty,
                        unit_rate: i.rate,
                        currency_id:
                            i.currency === "INR" ? 1 :
                                i.currency === "USD" ? 2 : 3,
                        durationtype: i.duration,
                        location_id: i.locationId,
                        updatedbyid: loginId,
                    };
                }),

                deletedSlNos: []               // 🔴 ignore deletes for new version
            };

            await axios.post(`${baseUrl}/api/Sales/AddQuotation`, payload);

            toast.success(`Saved as Version ${newVersion}`);
            setCurrentVersion(newVersion);
            setDeletedSlNos([]);

        } catch (err) {
            console.error(err);
            toast.error("Failed to save new version");
        }
    };

    // -------------------------
    // UI
    // -------------------------
    return (

        <Box sx={{ maxWidth: 1300, mt: 20, ml: 15 }}>
            <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
                {/* Quote selector */}
                <TextField select label="Select Quote" value={selectedQuoteNo ?? ""}
                    onChange={(e) => setSelectedQuoteNo(e.target.value)}
                    size="small" sx={{ minWidth: 200 }}  >
                    {quotes.map(q => (
                        <MenuItem key={q.quoteNo} value={q.quoteNo}>
                            Quote #{q.quoteNo}
                        </MenuItem>
                    ))}
                </TextField>

                {/* New Quote button */}
                <Button variant="outlined" onClick={() => startNewQuote()} >+ New Quote </Button>
            </Box>
            <Card sx={{ width: "100%", m: "auto", mt: 3, p: 4, borderRadius: 3, boxShadow: "0px 4px 20px #6594b3ff" }}>
                <Typography variant="h4" sx={{ mb: 2, textAlign: "center", color: "#1565c0" }}>
                    Add Quotation
                </Typography>

                {/* Header Labels */}
                <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography><strong>Enquiry No:</strong> {enquiryNo}</Typography>
                    <Typography><strong>Customer:</strong> {customer}    </Typography>
                    <Typography><strong>Contact Name:</strong> {contactName}</Typography>
                    <Typography><strong>Location:</strong> {location}</Typography>
                    <Typography><strong>Address:</strong> {address}</Typography>

                </Box>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        label="Board Ref"
                        value={boardRef}
                        onChange={(e) => setBoardRef(e.target.value)}
                        size="small"
                    />
                </Box>
                {/* <Typography variant="h6">Items</Typography> */}

                {items.map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            mt: 2, p: 2, border: "1px solid #ccc", borderRadius: "6px", display: "flex", flexDirection: "row",
                            gap: 2, alignItems: "center", whiteSpace: "nowrap",
                        }}>
                        {/* Description - SelectControl */}
                        <Box sx={{ minWidth: 260 }}>
                            <SelectControl
                                name="description"
                                label="Description"
                                value={item.descriptionId}
                                onChange={(e: any) =>
                                    handleItemChange(index, "descriptionId", Number(e.target.value))
                                }
                                options={descriptions.map((d) => ({
                                    value: d.idNo,
                                    label: d.layout,
                                }))}
                                required
                            />
                        </Box>
                        {/* First Row */}
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <SelectControl
                                name="currency"
                                label="Currency"
                                value={item.currency}
                                onChange={(e) => handleItemChange(index, "currency", e.target.value)}
                                options={currencyOptions.map((cur) => ({
                                    value: cur,
                                    label: cur,
                                }))}
                                sx={{
                                    "& input": { title: "" },
                                    "& .MuiSelect-select": { title: "" },
                                     minWidth: 100
                                }}
                            />
                            <TextField
                                label="Qty"
                                type="number"
                                fullWidth
                                value={item.qty}
                                onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: 40 }}
                            />
                            <TextField
                                label="Duration"
                                select
                                value={item.duration}
                                onChange={(e) =>
                                    handleItemChange(index, "duration", e.target.value)
                                }
                                size="small"
                                sx={{ minWidth: 110 }}
                            >
                                {durationOptions.map((option) => (
                                    <MenuItem key={option} value={option}>
                                        {option}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Unit Rate(Rs)"
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, "rate", Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: 100 }}

                            />
                            <TextField
                                label="Amount"
                                value={item.amount}
                                size="small"
                                InputProps={{ readOnly: true }}
                                sx={{ minWidth: 120 }}
                            />

                            {/* Second Row */}
                            <TextField
                                label="Tax Name"
                                value={item.taxName}
                                size="small"
                                sx={{ minWidth: 80 }}
                                InputProps={{ readOnly: true }}
                            />

                            <TextField
                                label="Tax Rate (%)"
                                type="number"
                                value={item.taxRate}
                                size="small"
                                sx={{ minWidth: 100 }}
                                InputProps={{ readOnly: true }}
                            />

                            <TextField
                                label="Tax Amount"
                                value={item.taxAmount.toFixed(2)}
                                size="small"
                                InputProps={{ readOnly: true }}
                                sx={{ minWidth: 100 }}
                            />

                            <TextField
                                label="Amount Including Tax"
                                value={item.incTaxAmount.toFixed(2)}
                                size="small"
                                InputProps={{ readOnly: true }}
                                sx={{ minWidth: 160 }}
                            />
                            {/* </Box> */}
                        </Box>
                        {/* Third Row */}
                        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                            <IconButton color="error" onClick={() => deleteItem(index)}>
                                <Delete />
                            </IconButton>
                        </Box>
                    </Box>
                ))}

                <Button variant="outlined" startIcon={<Add />} sx={{ mt: 2 }} onClick={addNewItem}>Add New Line Item</Button>
                {/* {enquiryType === 'ONSITE' ? (
                    <Box sx={{ mt: 2, p: 2, display: "flex", flexDirection: "row", gap: 2, }}>
                        <TextField
                            label="Validity"
                            // value={item.validity}
                            size="small"
                            sx={{ minWidth: 80 }}
                          //  InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Invoice raised day"
                            //  value={item.taxRate}
                            size="small"
                            sx={{ minWidth: 80 }}
                          //  InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Payment"
                            //  value={item.taxAmount.toFixed(2)}
                            size="small"
                          //  InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Minimum Commitment of days"
                            //  value={item.incTaxAmount.toFixed(2)}
                            size="small"
                           // InputProps={{ readOnly: true }}
                            sx={{ minWidth: 250 }}
                        />
                        {/* </Box> */}
                {/* </Box>*/}
                {/* ) */}
                {/*     : null} */}
                {/* Total */}
                <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Typography variant="h6">Grand Total: ₹ {grandTotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ mt: 10, textAlign: "left" }}>

                    <TextField
                        label="Terms and Conditions"
                        value={terms}
                        onChange={(e) => setTerms(e.target.value)}
                        multiline
                        rows={12}
                        fullWidth
                        contentEditable={true}
                    />
                </Box>
                {/* Save */}
                <Box sx={{ mt: 3, textAlign: "left" }}>
                    {isEditMode && (
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleSaveNewVersion}
                        >
                            SAVE TO NEW VERSION
                        </Button>
                    )}
                </Box>
                <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Button variant="contained" color="primary" onClick={handleSaveQuotation}>
                        {isEditMode ? "EDIT" : "ADD"}
                    </Button>

                </Box>
            </Card>
        </Box>
    );
};

export default AddQuotation;