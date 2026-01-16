//import React  from "react";
import React, { useEffect, useState } from "react";
import { Box, Button, TextField, IconButton, Typography, Card, MenuItem } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { useNavigate, useParams } from "react-router-dom";
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
    const navigate = useNavigate();
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

    // Load descriptions from backend
    useEffect(() => {
        if (!enquiryNo) return;

        const headerUrl = `${baseUrl}/api/Sales/EnqCustLocContData?penquiryNo=${enquiryNo}`;

        axios.get(headerUrl)
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

        axios.get(descUrl)
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
                const { data } = await axios.get(url);

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
                const { data } = await axios.get(url);

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
                    locationId: "",
                    boardRef: "",
                }]);

            } catch (err) {
                console.error("Failed to load quotation", err);
            }
        };

        fetchQuotation();
    }, [enquiryNo, selectedQuoteNo, descriptions]);


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

    const addNewItem = () => {
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
                locationId: "",
            },
        ]);
    };
    const startNewQuote = () => {
        setSelectedQuoteNo(null);   // important
       // setBoardRef("");
        setBoardRef(enquiryBoardRef); // reset to enquiry boardRef
        setTerms(
            enquiryType === "OFFSHORE"
                ? OFF_TERMS_AND_CONDITIONS
                : ON_TERMS_AND_CONDITIONS
        );

        setItems([{
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
        }]);
    };

    const deleteItem = (index: number) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };
    const totalAmount = items.reduce(
        (sum, item) => sum + (Number(item.amount) || 0),
        0
    );

    const totalTaxAmount = items.reduce(
        (sum, item) => sum + (Number(item.taxAmount) || 0),
        0
    );

    const grandTotal = items.reduce(
        (sum, item) => sum + (Number(item.incTaxAmount) || 0),
        0
    );

    const handleSaveQuotation = async () => {
        try {
            const payload = {
                enquiryno: enquiryNo ?? "",
                board_ref: boardRef,
                //   quoteNo: quoteNo ?? "", // backend will generate if empty 
                quoteNo: selectedQuoteNo ?? "",   // empty = new quote
                createdBy: loginId,
                versionNo: "1",
                tandc: terms,

                items: items.map((item, index) => {
                    const desc = descriptions.find(d => d.idNo === item.descriptionId);

                    const currencyId =
                        item.currency === "INR" ? "1" :
                            item.currency === "USD" ? "2" : "3";

                    return {
                        slNo: index + 1,
                        layout: desc?.layout ?? "",
                        quantity: item.qty.toString(),
                        unit_rate: item.rate.toString(),
                        currency_id: currencyId,
                        durationtype: item.duration,
                        location_id: locationId,
                        updatedbyid: loginId,
                    };
                })
            };

            await axios.post(
                `${baseUrl}/api/Sales/AddQuotation`,
                payload,
                { headers: { "Content-Type": "application/json" } }
            );

            toast.success("Quotation saved successfully");
            //  navigate(-1);  //previous page
            // reload quotes
            const { data } = await axios.get(
                `${baseUrl}/api/Sales/QuotationDetailsByEnqQuote/${enquiryNo}`
            );
            setQuotes(data);
            setSelectedQuoteNo(data[data.length - 1].quoteNo); // select newest

        } catch (err) {
            console.error(err);
            toast.error("Failed to save quotation");
        }
    };

    return (

        <Box sx={{ maxWidth: 1400, mt: 20, ml: 15 }}>
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
                        <Box sx={{ minWidth: 300 }}>
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
                                // fullWidth
                                value={item.currency}
                                onChange={(e) => handleItemChange(index, "currency", e.target.value)}
                                options={currencyOptions.map((cur) => ({
                                    value: cur,
                                    label: cur,
                                }))}
                                size="small"
                                sx={{ minWidth: 70 }}
                            />
                            <TextField
                                label="Qty"
                                type="number"
                                fullWidth
                                value={item.qty}
                                onChange={(e) => handleItemChange(index, "qty", Number(e.target.value))}
                                size="small"
                            />
                            <TextField
                                label="Duration"
                                select
                                value={item.duration}
                                onChange={(e) =>
                                    handleItemChange(index, "duration", e.target.value)
                                }
                                size="small"
                                sx={{ minWidth: 120 }}
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
                                // fullWidth
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, "rate", Number(e.target.value))}
                                size="small"
                                sx={{ minWidth: 100 }}

                            />

                            <TextField
                                label="Amount"
                                // fullWidth
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
                                sx={{ minWidth: 150 }}
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