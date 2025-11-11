import React, { useEffect, useState } from "react";
import {
    Grid, TextField, MenuItem, FormControl, InputLabel, Button, Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup,
    FormControlLabel, Checkbox, RadioGroup, Radio,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { baseUrl } from "../const/BaseUrl";
import SelectControl from "../components/ReusablePageControls/SelectControl";

interface LookupData {
    customers: { itemno: string; customer: string }[];
    AllActiveEmployees: { iDno: string; name: string }[];
    AnalysisManagers: { HOPC1ID: string; HOPC1NAME: string }[];
    States: { id: string; name: string }[];
}

interface EnquiryForm {
    enquiryMode: string;
    customerId: string;
    boardRef: string;
    contactName: string;
    emailAddress: string;
    address: string;
    location: string;
    state: string;
    inputReceived: string;
    billingType: string;
    currency: string;
    type: string;
    pcbTool: string;
    quotationDate: string;
    govtTender: boolean;
    completeResp: string;
    salesResp: string;
    referenceBy: string;
    remarks: string;
}


const OffshoreEnquiry: React.FC = () => {
    const [form, setForm] = useState<EnquiryForm>({
        enquiryMode: "OFFSHORE",
        customerId: "",
        boardRef: "",
        contactName: "",
        emailAddress: "",
        address: "",
        location: "",
        state: "",
        inputReceived: "",
        billingType: "",
        currency: "INR",
        type: "Export",
        pcbTool: "",
        quotationDate: "",
        govtTender: false,
        completeResp: "",
        salesResp: "",
        referenceBy: "",
        remarks: "",
    });

    const [lookups, setLookups] = useState<LookupData>({
        customers: [],
        AllActiveEmployees: [],
        AnalysisManagers: [],
        States: [],
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // 🔹 Fetch dropdown data
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [custRes, empRes, analysisRes] = await Promise.all([
                    fetch(`${baseUrl}/api/Sales/customers`),
                    fetch(`${baseUrl}/AllActiveEmployees`),
                    fetch(`${baseUrl}/AnalysisManagers`),
                ]);
                const [customers, AllActiveEmployees, AnalysisManagers] =
                    await Promise.all([
                        custRes.json(),
                        empRes.json(),
                        analysisRes.json(),
                    ]);
                setLookups({
                    customers,
                    AllActiveEmployees,
                    AnalysisManagers,
                    States: [
                        { id: "KA", name: "Karnataka" },
                        { id: "TN", name: "Tamil Nadu" },
                        { id: "MH", name: "Maharashtra" },
                    ],
                });
            } catch (err) {
                console.error("Error fetching lookups:", err);
            }
        };
        fetchLookups();
    }, []);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) setFile(e.target.files[0]);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));
            if (file) formData.append("file", file);

            const res = await fetch(`${baseUrl}/api/Sales/AddEnquiryData`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) alert("✅ Enquiry Saved Successfully!");
            else alert("❌ Failed to save enquiry");
        } catch (err) {
            console.error(err);
            alert("⚠️ Error saving enquiry");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card sx={{  m: "auto", mt: 2, p: 4, boxShadow: 6, borderRadius: 3 }}>
            <Typography
                variant="h5"
                sx={{
                    textAlign: "center",
                    mb: 3,
                    fontWeight: 700,
                    color: "#1565c0",
                    textTransform: "uppercase",
                }}
            >
                Add Offshore Enquiry
            </Typography>

            <CardContent>
                <Grid 
                    container
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    {/* Row 1 */}
                    <Grid item xs={12}  md={4}>
                        <SelectControl
                            name="customerId"
                            label="Customer"
                            value={form.customerId}
                            options={lookups.customers.map((c) => ({
                                value: c.itemno,
                                label: c.customer,
                            }))}
                            onChange={handleChange}
                            required
                            height={40}
                            width="250px"
                        />
                    </Grid>

                    <Grid item xs={12}  md={4}>
                        <TextField label="Location" name="location" onChange={handleChange} fullWidth />
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                        <SelectControl
                            name="state"
                            label="State"
                            value={form.state}
                            onChange={handleChange}
                            options={lookups.States.map((s) => ({
                                value: s.id,
                                label: s.name,
                            }))}
                            required
                            height={40}
                            width="130px"
                        />
                    </Grid>

                    <Grid item xs={12}  md={4}>
                        <TextField label="Board Ref" name="boardRef" onChange={handleChange} fullWidth />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} sm={6} md={4}>
                        <TextField label="Contact Name" name="contactName" onChange={handleChange} fullWidth />
                    </Grid>

                    <Grid item xs={12} sm={6} md={4}>
                        <TextField label="Email Address" name="emailAddress" onChange={handleChange} fullWidth />
                    </Grid>


                    {/* Row 3 - Address */}
                    <Grid item xs={12}>
                        <TextField
                            label="Address"
                            name="address"
                            onChange={handleChange}
                            fullWidth
                            multiline
                            rows={2}
                        />
                    </Grid>

                    {/* Row 4 - Currency & Type */}
                    <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, fontWeight: 500 }}>Currency</Typography>
                        <RadioGroup
                            row
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="INR" control={<Radio />} label="INR" />
                            <FormControlLabel value="USD" control={<Radio />} label="USD" />
                            <FormControlLabel value="EURO" control={<Radio />} label="EURO" />
                        </RadioGroup>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Typography sx={{ mb: 0.5, fontWeight: 500 }}>Type</Typography>
                        <RadioGroup
                            row
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                        >
                            <FormControlLabel value="Export" control={<Radio />} label="Export" />
                            <FormControlLabel value="Domestic" control={<Radio />} label="Domestic" />
                        </RadioGroup>
                    </Grid>

                    {/* Divider */}
                    <Grid item xs={12}>
                        <Box sx={{ borderTop: "1px solid #ccc", mt: 3, mb: 2 }} />
                        <Typography
                            variant="h6"
                            align="center"
                            sx={{ color: "#1976d2", fontWeight: 600 }}
                        >
                            SCOPE
                        </Typography>
                    </Grid>

                    {/* Scope Rows */}
                    {["Layout", "Analysis", "VA", "NPI"].map((scope) => (
                        <React.Fragment key={scope}>
                            <Grid item xs={12} sm={6}>
                                <Typography>{scope}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <SelectControl
                                    name={`${scope}Resp`}
                                    label="Responsibility"
                                    value={form[`${scope}Resp`] || ""}
                                    onChange={handleChange}
                                    options={lookups.AllActiveEmployees.map((e) => ({
                                        value: e.iDno,
                                        label: e.name,
                                    }))}
                                    required
                                    height={40}
                                    width="130px"
                                />
                            </Grid>
                        </React.Fragment>
                    ))}

                    {/* Date and Tender */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            type="date"
                            label="Quotation Request Last Date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            name="quotationDate"
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={form.govtTender}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, govtTender: e.target.checked }))
                                    }
                                />
                            }
                            label="Govt Tender?"
                        />
                    </Grid>

                    {/* Reference & Responsibility */}
                    <Grid item xs={12} sm={6}>
                        <SelectControl
                            name="completeResp"
                            label="Complete Responsibility"
                            value={form.completeResp}
                            onChange={handleChange}
                            options={lookups.AnalysisManagers.map((m) => ({
                                value: m.hopC1ID,
                                label: m.hopC1NAME,
                            }))}
                            required
                            height={40}
                            width="150px"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <SelectControl
                            name="salesResp"
                            label="Sales Responsibility"
                            value={form.salesResp}
                            onChange={handleChange}
                            options={lookups.AllActiveEmployees.map((e) => ({
                                value: e.iDno,
                                label: e.name,
                            }))}
                            required
                            height={40}
                            width="130px"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <SelectControl
                            name="referenceBy"
                            label="Reference By"
                            value={form.referenceBy}
                            onChange={handleChange}
                            options={lookups.AllActiveEmployees.map((e) => ({
                                value: e.iDno,
                                label: e.name,
                            }))}
                            required
                            height={40}
                            width="130px"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            rows={2}
                            name="remarks"
                            onChange={handleChange}
                        />
                    </Grid>

                    {/* File Upload */}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                border: "2px dashed #90caf9",
                                borderRadius: 2,
                                p: 3,
                                textAlign: "center",
                                bgcolor: "#f8faff",
                                cursor: "pointer",
                            }}
                            onClick={() => document.getElementById("fileInput")?.click()}
                        >
                            <CloudUploadIcon sx={{ fontSize: 40, color: "#2196f3" }} />
                            <Typography variant="body1" sx={{ mt: 1 }}>
                                {file ? file.name : "Click or Drag a file to upload"}
                            </Typography>
                            <input
                                type="file"
                                id="fileInput"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                        </Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block", textAlign: "center" }}
                        >
                            If you have multiple files, please zip and upload.
                        </Typography>
                    </Grid>

                    {/* Save Button */}
                    <Grid item xs={12} textAlign="center">
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{ mt: 2, px: 6 }}
                        >
                            {loading ? "Saving..." : "Add"}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
export default OffshoreEnquiry;
