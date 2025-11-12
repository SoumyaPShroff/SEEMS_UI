import React, { useEffect, useState } from "react";
import {
    Grid, FormGroup, TextField, MenuItem, FormControl, InputLabel, Button, Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup,
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
    const handleCheckboxChange = (section: string, item: string, checked: boolean) => {
        setForm((prev) => {
            const items = new Set(prev[section] || []);
            if (checked) items.add(item);
            else items.delete(item);
            return { ...prev, [section]: Array.from(items) };
        });
    };

    return (
        <Card
            sx={{
                width: "95%",
                maxWidth: 1250,
                m: "auto",
                mt: 3,
                p: 4,
                boxShadow: 6,
                borderRadius: 3,
                maxHeight: "90vh",
                overflowY: "auto",
            }}
        >
            <CardContent>
                {/* --- Header --- */}
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

                {/* --- Main Form Grid --- */}
                <Grid
                    container
                    spacing={2}
                    alignItems="center"
                    sx={{
                        "& .MuiFormControl-root, & .MuiTextField-root": {
                            width: "100%",
                        },
                        "& .MuiOutlinedInput-root": {
                            height: 40,
                        },
                    }}
                >
                    {/* Row 1 */}
                    <Grid item xs={12} md={3}>
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
                            width="200px"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Location"
                            name="location"
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
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
                            width="200px"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Contact Name"
                            name="contactName"
                            onChange={handleChange}
                            size="small"
                            width="200px"
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Email Address"
                            name="emailAddress"
                            onChange={handleChange}
                            size="small"
                            width="200px"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Address"
                            name="address"
                            onChange={handleChange}
                            multiline
                            rows={2}
                            fullWidth
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            label="Board Ref"
                            name="boardRef"
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="inputReceivedThru"
                            label="Input Received Thru"
                            value={form.inputReceivedThru || ""}
                            onChange={handleChange}
                            options={[
                                { value: "Email", label: "Email" },
                                { value: "FTP", label: "FTP" },
                                { value: "Other", label: "Other" },
                            ]}
                            height={40}
                            required
                            width="140px"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                px: 1,
                                py: 0.5,
                            }}
                        >
                            <RadioGroup
                                row
                                name="currency"
                                value={form.currency}
                                onChange={handleChange}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-around",
                                    alignItems: "center",
                                    height: 30,
                                }}
                            >
                                <FormControlLabel value="INR" control={<Radio />} label="INR" />
                                <FormControlLabel value="USD" control={<Radio />} label="USD" />
                                <FormControlLabel value="EURO" control={<Radio />} label="EURO" />
                            </RadioGroup>
                        </Box>
                    </Grid>

                    {/* Row 3 */}
                    <Grid item xs={12} md={3}>
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                px: 1,
                                py: 0.5,
                            }}
                        >
                            <RadioGroup
                                row
                                name="type"
                                value={form.type}
                                onChange={handleChange}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-around",
                                    alignItems: "center",
                                    height: 30,
                                }}
                            >
                                <FormControlLabel value="Export" control={<Radio />} label="Export" />
                                <FormControlLabel
                                    value="Domestic"
                                    control={<Radio />}
                                    label="Domestic"
                                />
                            </RadioGroup>
                        </Box>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="billingType"
                            label="Billing Type"
                            value={form.billingType || ""}
                            onChange={handleChange}
                            options={[
                                { value: "Fixed-Cost", label: "Fixed-Cost" },
                                { value: "Time and Material", label: "Time and Material" },
                            ]}
                            height={40}
                            required
                            width="200px"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <TextField
                            label="PCB Tool"
                            name="pcbTool"
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    {/* --- Scope Sections --- */}
                    {["Layout", "Analysis", "VA", "NPI"].map((section) => (
                        <Grid
                            item
                            xs={12}
                            key={section}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                flexWrap: "wrap",
                                mb: 3, // space between sections
                            }}
                        >
                            {/* Left side: Checkboxes */}
                            <Box sx={{ flex: "1 1 78%", minWidth: { xs: "100%", sm: "75%" } }}>
                                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{section}</Typography>

                                <FormGroup
                                    row
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1.5,
                                    }}
                                >
                                    {(section === "Layout"
                                        ? [
                                            "Design",
                                            "Library",
                                            "QA/CAM",
                                            "DFA",
                                            "DFM",
                                            "Fabrication",
                                            "Testing",
                                            "Others",
                                        ]
                                        : section === "Analysis"
                                            ? [
                                                "SI",
                                                "PI",
                                                "EMI Net Level",
                                                "EMI System Level",
                                                "Thermal Board Level",
                                                "Thermal System Level",
                                                "Others",
                                            ]
                                            : section === "VA"
                                                ? [
                                                    "Fabrication",
                                                    "Assembly",
                                                    "Hardware",
                                                    "Software",
                                                    "FPGA",
                                                    "Testing",
                                                    "Others",
                                                    "Design Outsourced",
                                                ]
                                                : [
                                                    "BOM Procurement",
                                                    "NPI-Fabrication",
                                                    "NPI-Assembly",
                                                    "Job Work",
                                                    "NPI-Testing",
                                                ]
                                    ).map((item) => (
                                        <FormControlLabel
                                            key={item}
                                            control={
                                                <Checkbox
                                                    checked={form[section.toLowerCase()]?.includes(item)}
                                                    onChange={(e) =>
                                                        handleCheckboxChange(
                                                            section.toLowerCase(),
                                                            item,
                                                            e.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            label={item}
                                            sx={{
                                                minWidth: { xs: "45%", sm: "30%", md: "20%" },
                                            }}
                                        />
                                    ))}
                                </FormGroup>
                            </Box>

                            {/* Right side: Responsibility dropdown */}
                            <Box
                                sx={{
                                    flex: "0 0 20%",
                                    minWidth: 200,
                                    mt: { xs: 2, sm: 0 },
                                    textAlign: { xs: "left", sm: "right" },
                                }}
                            >
                                <SelectControl
                                    name={`${section.toLowerCase()}Resp`}
                                    label="Responsibility"
                                    value={form[`${section.toLowerCase()}Resp`] || ""}
                                    onChange={handleChange}
                                    options={lookups.AllActiveEmployees.map((e) => ({
                                        value: e.iDno,
                                        label: e.name,
                                    }))}
                                    fullWidth
                                    height={42}
                                />
                            </Box>
                        </Grid>
                    ))}
                    {/* --- Quotation & Tender --- */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            type="date"
                            label="Quotation Request Last Date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            name="quotationDate"
                            onChange={handleChange}
                            size="small"
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
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

                    {/* --- Responsibilities --- */}
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="completeResp"
                            label="Complete Responsibility"
                            value={form.completeResp}
                            onChange={handleChange}
                            options={lookups.AnalysisManagers.map((m) => ({
                                value: m.hopC1ID,
                                label: m.hopC1NAME,
                            }))}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="salesResp"
                            label="Sales Responsibility"
                            value={form.salesResp}
                            onChange={handleChange}
                            options={lookups.AllActiveEmployees.map((e) => ({
                                value: e.iDno,
                                label: e.name,
                            }))}
                            fullWidth
                        />
                    </Grid>

                    {/* --- Reference + Remarks --- */}
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="referenceBy"
                            label="Reference By"
                            value={form.referenceBy}
                            onChange={handleChange}
                            options={lookups.AllActiveEmployees.map((e) => ({
                                value: e.iDno,
                                label: e.name,
                            }))}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={9}>
                        <TextField
                            label="Remarks"
                            fullWidth
                            multiline
                            rows={2}
                            name="remarks"
                            onChange={handleChange}
                            size="small"
                        />
                    </Grid>

                    {/* --- File Upload --- */}
                    <Grid item xs={12} md={9}>
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

                    {/* --- Submit Button --- */}
                    <Grid item xs={12} md={3} textAlign="center" sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                            sx={{ px: 6, height: 45 }}
                        >
                            {loading ? "Saving..." : "ADD"}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
export default OffshoreEnquiry;
