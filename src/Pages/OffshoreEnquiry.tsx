import React, { useEffect, useState } from "react";
import {
    Grid, FormGroup, TextField, FormControl, InputLabel, Button, Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup,
    FormControlLabel, Checkbox, RadioGroup, Radio,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { baseUrl } from "../const/BaseUrl";
import SelectControl from "../components/ReusablePageControls/SelectControl";

interface Customer {
    itemno: string;
    customer: string;
}

interface Employee {
    iDno: string;
    name: string;
}

interface Manager {
    HOPC1ID: string;
    HOPC1NAME: string;
}

interface Location {
    location_id: string;
    location: string;
    address?: string;
}

interface Contact {
    contact_id: string;
    contactName: string;
    email11?: string;
    location_id?: string;
    customer_id?: string;
}

interface State {
    id: string;
    name: string;
}


interface LookupData {
    customers: Customer[];
    AllActiveEmployees: Employee[];
    AnalysisManagers: Manager[];
    SalesManagers: Manager[];
    designMngrs: Manager[];
    salesnpiusers: Employee[];
    States: State[];
    PCBTools: string[];
    Locations: Location[];
    Contacts: Contact[];
}

interface EnquiryForm {
    enquiryMode: string;
    customerId: string;
    boardRef: string;
    contactName: string;
    email11: string;
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
    layout: string[];
    analysis: string[];
    va: string[];
    npi: string[];
    layoutResp: string;
    analysisResp: string;
    vaResp: string;
    npiResp: string;
    locationId: string;
}


const OffshoreEnquiry: React.FC = () => {
    const [form, setForm] = useState<EnquiryForm>({
        enquiryMode: "OFFSHORE",
        customerId: "",
        boardRef: "",
        contactName: "",
        email11: "",
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
        layout: [],
        analysis: [],
        va: [],
        npi: [],
        layoutResp: "",
        analysisResp: "",
        vaResp: "",
        npiResp: "",
        locationId: "",
    });

    const [lookups, setLookups] = useState<LookupData>({
        customers: [],
        AllActiveEmployees: [],
        AnalysisManagers: [],
        SalesManagers: [],
        designMngrs: [],
        salesnpiusers: [],
        States: [],
        PCBTools: [],
        Locations: [],
        Contacts: [],
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // 🔹 Fetch dropdown data
    useEffect(() => {
        const fetchLookups = async () => {
            try {
                const [custRes, empRes, analysisRes, salesisRes, designRes, npiRes, PCBToolsRes, LocationsRes, ContactsRes] = await Promise.all([
                    fetch(`${baseUrl}/api/Sales/customers`),
                    fetch(`${baseUrl}/AllActiveEmployees`),
                    fetch(`${baseUrl}/AnalysisManagers`),
                    fetch(`${baseUrl}/SalesManagers`),
                    fetch(`${baseUrl}/DesignManagers`),
                    fetch(`${baseUrl}/SalesNpiUsers`),
                    fetch(`${baseUrl}/PCBTools`),
                    fetch(`${baseUrl}/api/Sales/customerlocations`),
                    fetch(`${baseUrl}/api/Sales/customercontacts`),
                ]);
                const [customers, AllActiveEmployees, AnalysisManagers, SalesManagers, designMngrs, salesnpiusers, PCBTools, Locations, Contacts,] =
                    await Promise.all([
                        custRes.json(),
                        empRes.json(),
                        analysisRes.json(),
                        salesisRes.json(),
                        designRes.json(),
                        npiRes.json(),
                        PCBToolsRes.json(),
                        LocationsRes.json(),
                        ContactsRes.json(),
                    ]);
                setLookups({
                    customers,
                    AllActiveEmployees,
                    AnalysisManagers,
                    SalesManagers,
                    designMngrs,
                    salesnpiusers,
                    States: [
                        { id: "KA", name: "Karnataka" },
                        { id: "TN", name: "Tamil Nadu" },
                        { id: "MH", name: "Maharashtra" },
                    ],
                    PCBTools,
                    Locations,
                    Contacts,
                });
            } catch (err) {
                console.error("Error fetching lookups:", err);
            }
        };
        fetchLookups();
    }, []);

    const fetchCustomerLocations = async (customerId: string): Promise<void> => {
        try {
            const res = await fetch(`${baseUrl}/api/Sales/customerlocations?customerId=${customerId}`);
            if (!res.ok) throw new Error("Failed to load customer locations");
            const data: Location[] = await res.json();
            setLookups((prev) => ({ ...prev, Locations: data, Contacts: [] }));
        } catch (err) {
            console.error("Error fetching customer locations:", err);
            setLookups((prev) => ({ ...prev, Locations: [], Contacts: [] }));
        }
    };

    const fetchCustomerContacts = async (customer_id: string, locationId: string): Promise<void> => {
        try {
            const res = await fetch(`${baseUrl}/api/Sales/customercontacts?customer_id=${customer_id}&location_id=${locationId}`);

            if (!res.ok) throw new Error("Failed to load customer contacts");
            const data: Contact[] = await res.json();
            setLookups((prev) => ({ ...prev, Contacts: data }));
        } catch (err) {
            console.error("Error fetching customer contacts:", err);
            setLookups((prev) => ({ ...prev, Contacts: [] }));
        }
    };

    const getCompleteRespOptions = () => {
        // Collect all selected responsibility IDs
        const selectedIds = [form.layoutResp, form.analysisResp, form.vaResp, form.npiResp].filter(
            (id) => id && id.trim() !== ""
        );

        if (selectedIds.length === 0) return [];

        // Find employee details from all lookup sources
        const allEmployees = [...lookups.designMngrs, ...lookups.AnalysisManagers, ...lookups.salesnpiusers];

        const uniqueOptions = Array.from(
            new Map(
                selectedIds
                    .map((id) => {
                        const emp = allEmployees.find(
                            (e: any) => e.hopC1ID === id || e.iDno === id
                        );
                        return emp
                            ? {
                                value: emp.hopC1ID || emp.iDno,
                                label: emp.hopC1NAME || emp.name,
                            }
                            : null;
                    })
                    .filter(Boolean)
            ).values()
        );

        return uniqueOptions;
    };

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target as HTMLInputElement;
        // Prepare an updated form object (no state reset yet)
        let updatedForm = { ...form, [name]: value };

        if (name === "customerId") {
            updatedForm = {
                ...updatedForm,
                locationId: "",
                contactName: "",
                address: "",
                emailAddress: "",
                state: form.state,// 👇 Preserve state
            };
            setForm(updatedForm);
            await fetchCustomerLocations(value);
            return; // stop here, don’t run other logic
        }

        // 🔹 Location changed
        if (name === "locationId") {
            const selectedLoc = lookups.Locations.find((l) => l.location_id === value);
            updatedForm = {
                ...form, // 👈 rebuild from *latest* form every time
                locationId: value,
                contactName: "",
                address: selectedLoc?.address ?? "",
                emailAddress: "",
                state: form.state, // 👈 explicitly preserve state
            };
            setForm(updatedForm);

            await fetchCustomerContacts(form.customerId, value);
            return;
        }

        if (name === "contactName") {
            const contact = lookups.Contacts.find((c) => c.contact_id === value);
            if (contact) {
                updatedForm = {
                    ...updatedForm,
                    contactName: value,
                    address: contact.address ?? form.address,
                    emailAddress: contact.email11 ?? form.emailAddress,
                    state: form.state,
                };
            }
            setForm(updatedForm);
            return;
        }
        setForm(updatedForm);
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

            const updated = { ...prev, [section]: Array.from(items) };

            // 🔹 Clear responsibility if no checkboxes remain
            if (items.size === 0) updated[`${section}Resp`] = "";

            return updated;
        });
    };

    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: 1250,
                m: "auto",
                mt: 3,
                p: 4,
                boxShadow: 6,
                borderRadius: 3,
                maxHeight: "200vh",
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
                        <SelectControl
                            name="locationId"
                            label="Location"
                            value={form.locationId}
                            options={lookups.Locations.map((l) => ({
                                value: l.location_id,
                                label: l.location,
                            }))}
                            onChange={handleChange}
                            required
                            disabled={!form.customerId}
                            width="200px"
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
                        <SelectControl
                            name="contactName"
                            label="Contact Name"
                            value={form.contactName}
                            options={lookups.Contacts.map((c) => ({
                                value: c.contact_id,
                                label: c.contactName,
                            }))}
                            onChange={handleChange}
                            required
                            width="200px"
                            disabled={!form.location}
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} md={12}>
                        <TextField
                            name="emailAddress"
                            label="Email Address"
                            value={form.emailAddress}
                            onChange={handleChange}
                             fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} md={12}>
                        <TextField
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            multiline
                            rows={2}
                             fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <TextField
                            label="Board Ref"
                            name="boardRef"
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={12}>
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
                            width="200px"
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
                                    alignItems: "center",
                                    height: 50,
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "4px",
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
                                    alignItems: "center",
                                    height: 50,
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "4px",
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
                        <SelectControl
                            name="PCB Tool"
                            label="PCB Tool"
                            value={form.PCBTool || ""}
                            onChange={handleChange}
                            options={lookups.PCBTools.map((tool: string, index: number) => ({
                                value: tool,
                                label: tool,
                            }))}
                            height={40}
                            required
                            width="200px"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 3,
                                mb: 1,
                            }}
                        >
                            <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    mx: 55,
                                    color: "#666",
                                    fontSize: 20,
                                    fontWeight: 600,
                                }}
                            >
                                SCOPE DETAILS
                            </Typography>
                            <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                        </Box>
                    </Grid>
                    {/* --- Scope Sections --- */}
                    {["Layout", "Analysis", "VA", "NPI"].map((section) => {
                        const lower = section.toLowerCase();

                        // Select responsibility list based on section
                        let responsibilityOptions = lookups.AllActiveEmployees;
                        if (section === "Layout") responsibilityOptions = lookups.designMngrs;
                        else if (section === "Analysis") responsibilityOptions = lookups.AnalysisManagers;
                        else if (section === "VA") responsibilityOptions = lookups.salesnpiusers;
                        else if (section === "NPI") responsibilityOptions = lookups.salesnpiusers;

                        // Checkbox lists per section
                        const checkboxItems =
                            section === "Layout"
                                ? ["Design", "Library", "QA/CAM", "DFA", "DFM", "Fabrication", "Testing", "Others"]
                                : section === "Analysis"
                                    ? ["SI", "PI", "EMI Net Level", "EMI System Level", "Thermal Board Level", "Thermal System Level", "Others"]
                                    : section === "VA"
                                        ? ["Fabrication", "Assembly", "Hardware", "Software", "FPGA", "Testing", "Others", "Design Outsourced"]
                                        : ["BOM Procurement", "NPI-Fabrication", "NPI-Assembly", "Job Work", "NPI-Testing"];


                        return (
                            <Grid item xs={12} key={section}>
                                <Grid
                                    container
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        borderBottom: "1px dashed #ddd",
                                        pb: 1,
                                        mb: 1,
                                    }}
                                >
                                    {/* --- Left side: checkboxes --- */}
                                    <Grid item xs={10}>
                                        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{section}</Typography>
                                        <FormGroup row>
                                            {checkboxItems.map((item, index) => (
                                                <FormControlLabel
                                                    key={`${section}-${item}-${index}`}
                                                    control={
                                                        <Checkbox
                                                            checked={form[lower]?.includes(item)}
                                                            onChange={(e) => handleCheckboxChange(lower, item, e.target.checked)}
                                                        />
                                                    }
                                                    label={item}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Grid>

                                    {/* --- Right side: responsibility dropdown --- */}
                                    <Grid
                                        item
                                        xs={2}
                                        sx={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            alignItems: "center",
                                        }}
                                    >
                                        {form[lower].length > 0 ? (
                                            <SelectControl
                                                name={`${lower}Resp`}
                                                label={`${section} Responsibility`}
                                                value={form[`${lower}Resp`] || ""}
                                                onChange={(e) => {
                                                    const selectedValue = e.target.value;
                                                    setForm((prev) => {
                                                        const updated = { ...prev, [`${lower}Resp`]: selectedValue };

                                                        // Update completeResp based on all responsibilities
                                                        const completeOptions = getCompleteRespOptions();
                                                        if (!completeOptions.find((o) => o.value === updated.completeResp)) {
                                                            updated.completeResp = ""; // clear if current value is no longer valid
                                                        }

                                                        return updated;
                                                    });
                                                }}

                                                options={responsibilityOptions.map((opt: any) => {
                                                    if (section === "Layout" || section === "Analysis") {
                                                        return { value: opt.hopC1ID, label: opt.hopC1NAME }; // 🔹 fix capitalization
                                                    } else {
                                                        return { value: opt.iDno, label: opt.name };
                                                    }
                                                })}
                                                height={40}
                                                width="220px"
                                            />
                                        ) : null}

                                    </Grid>
                                </Grid>
                            </Grid>
                        );
                    })}
                    <Grid item xs={12}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mt: 3,
                                mb: 1,
                            }}
                        >
                            <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                            <Typography
                                variant="subtitle2"
                            >
                                -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                            </Typography>
                            <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                        </Box>
                    </Grid>

                    {/* --- Quotation & Tender --- */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            type="date"
                            label="Quotation Request Last Date"
                            name="quotationDate"
                            value={form.quotationDate || ""}
                            onChange={(e) => {
                                const value = e.target.value; // always yyyy-mm-dd from <input type="date">
                                setForm((p) => ({ ...p, quotationDate: value }));
                            }}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            required
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
                            options={getCompleteRespOptions()}
                            fullWidth
                            width="220px"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="salesResp"
                            label="Sales Responsibility"
                            value={form.salesResp}
                            onChange={handleChange}
                            options={lookups.SalesManagers.map((e) => ({
                                value: e.hopC1ID,
                                label: e.hopC1NAME,
                            }))}
                            fullWidth
                            width="200px"
                            required
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
                            width="200px"
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
