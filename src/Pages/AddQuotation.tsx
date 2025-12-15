import React, { useEffect, useState } from "react";
import { Box, Button, TextField, IconButton, Typography, Card, MenuItem } from "@mui/material";
import { Add, Delete, TerminalSharp } from "@mui/icons-material";
import SelectControl from "../components/ReusablePageControls/SelectControl";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../const/BaseUrl";
import { OFF_TERMS_AND_CONDITIONS } from '../const/QuoteOffTermsConditions';
import { ON_TERMS_AND_CONDITIONS } from '../const/QuoteOnTermsConditions';
import { color } from "framer-motion";


interface DescriptionItem {
    id: number;
    name: string;
}

interface QuotationItem {
    descriptionId: number;
    currency: "INR" | "USD" | "EURO";
    qty: number;
    rate: number;

    tax_INR: number;
    tax_USD: number;
    tax_EURO: number;

    taxRate: number;
    taxName: string;
    amount: number;
    taxAmount: number;
    incTaxAmount: number;
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
    // return null;
    const navigate = useNavigate();
    const { enquiryNo } = useParams();
    const isEditMode = Boolean(enquiryNo);
    // Header fields
    const [customer, setCustomer] = useState("");
    const [contactName, setContactName] = useState("");
    const [location, setLocation] = useState("");
    const [address, setAddress] = useState("");
    const [enquiryType, setEnquiryType] = useState("");
    // Description master list from backend
    const [descriptions, setDescriptions] = useState<DescriptionItem[]>([]);

    const [items, setItems] = useState<QuotationItem[]>([
        {
            descriptionId: 0,
            qty: 1,
            rate: 0,
            duration: "",
            currency: "",
            taxName: "",
            taxRate: 0,
            amount: 0,
            taxAmount: 0,
            incTaxAmount: 0,
            //   location: "",
        },
    ]);
    const Layout: number[] = descriptions.map(d => d.idNo);
    const taxName: string[] = descriptions.map(d => d.taxname);

    const tax_INR: number[] = descriptions.map(d => d.tax_INR);
    const tax_USD: number[] = descriptions.map(d => d.tax_USD);
    const tax_EURO: number[] = descriptions.map(d => d.tax_EURO);

    const [terms, setTerms] = useState(OFF_TERMS_AND_CONDITIONS);

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
        if (!isEditMode) return;
    
        fetch(`${baseUrl}/api/Sales/QuoteDetailsByQuoteNo/${QuoteNo}`)
          .then(r => r.json())
          .then(async data => {
            const e = Array.isArray(data) ? data[0] : data;
     
            // ✅ 5. Set REST OF FIELDS
            setForm(prev => ({
              ...prev,
              contactName: String(e.contact_id || ""),
              state: e.statename || "",
              email11: e.email11 || "",
              tm: e.tm || "",
              toolLicense: String(e.toolLicense),
              logistics: String(e.logistics),
              onsiteDurationType: String(e.onsiteDurationType),
              onsiteDuration: String(e.onsiteDuration),
              hourlyRateType: String(e.hourlyRateType),
              hourlyReate: e.hourlyReate || "",
              expFrom: e.expFrom || "",
              expTo: e.expTo || "",
              profReqLastDate: e.profReqLastDate?.substring(0, 10) || "",
              salesresponsibilityid: e.salesresponsibilityid || "",
              completeresponsibilityid: e.completeresponsibilityid || "",
              referenceBy: e.referenceBy || "",
              remarks: e.remarks || "",
              uploadedfilename: e.uploadedfilename,
              toolId: String(e.toolId || ""),
              taskId: String(e.taskId || ""),
              noOfResources: e.noOfResources || "",
              type: e.type,
              tentStartDate: e.tentStartDate?.substring(0, 10) || "",
              SI: e.si || "",
              PI: e.pi || "",
            }));
          });
      }, [isEditMode, enquiryNo]);
    

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
                //   location: "",
            },
        ]);
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
      quotationHeader: {
        enquiryNo: enquiryNo,
        customerId: form.customerId,
        locationId: form.locationId,
        currency: form.hourlyRateType,
        totalAmount: totalAmount,
        createdBy: loginUser,
      },

      quotationItems: lineItems.map((item: any, index: number) => ({
        lineNo: index + 1,
        description: item.description,
        qty: item.qty,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })),
    };

    await axios.post(`${baseUrl}/api/sales/AddQuotation`, payload);

    toast.success("Quotation saved successfully");
  } catch (err) {
    console.error(err);
    toast.error("Failed to save quotation");
  }
};

    return (
        <Box sx={{ maxWidth: 1300, mt: 20, ml: 10 }}>
            <Card sx={{ width: "100%", m: "auto", mt: 3, p: 4, borderRadius: 3, boxShadow: "0px 4px 20px #6594b3ff" }}>
                <Typography variant="h4" sx={{ mb: 2, textAlign: "center", color: "#1565c0" }}>
                    Add Quotation
                </Typography>

                {/* Header Labels */}
                <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
                    <Typography><strong>Enquiry No:</strong> {enquiryNo}</Typography>
                    <Typography><strong>Customer:</strong> {customer}</Typography>
                    <Typography><strong>Contact Name:</strong> {contactName}</Typography>
                    <Typography><strong>Location:</strong> {location}</Typography>
                    <Typography><strong>Address:</strong> {address}</Typography>
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
                        <Box sx={{ minWidth: 170 }}>
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
                                sx={{ minWidth: 60 }}
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
                                sx={{ minWidth: 80 }}
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
                {enquiryType === 'ONSITE' ? (
                    <Box sx={{ mt: 2, p: 2, display: "flex", flexDirection: "row", gap: 2, }}>
                        <TextField
                            label="Validity"
                            // value={item.validity}
                            size="small"
                            sx={{ minWidth: 80 }}
                            InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Invoice raised day"
                            //  value={item.taxRate}
                            size="small"
                            sx={{ minWidth: 80 }}
                            InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Payment"
                            //  value={item.taxAmount.toFixed(2)}
                            size="small"
                            InputProps={{ readOnly: true }}
                        />

                        <TextField
                            label="Minimum Commitment of days"
                            //  value={item.incTaxAmount.toFixed(2)}
                            size="small"
                            InputProps={{ readOnly: true }}
                            sx={{ minWidth: 250 }}
                        />
                        {/* </Box> */}
                    </Box>
                )
                    : null}
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
                        {isEditMode ? "UPDATE" : "ADD"}
                    </Button>
                </Box>
            </Card>
        </Box>
    );
};

export default AddQuotation;