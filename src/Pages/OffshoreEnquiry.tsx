import React, { useEffect, useState } from "react";
import {
    Grid, FormGroup, TextField, FormControl, InputLabel, Button, Card, CardContent, Typography, Box, ToggleButton, ToggleButtonGroup,
    FormControlLabel, Checkbox, RadioGroup, Radio,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { baseUrl } from "../const/BaseUrl";
import SelectControl from "../components/ReusablePageControls/SelectControl";
import { RiTextSpacing } from "react-icons/ri";
import { Email } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

interface Customer { itemno: string; customer: string; }

interface Employee { iDno: string; name: string; }

interface Manager { HOPC1ID: string; HOPC1NAME: string; }

interface Location { location_id: string; location: string; address?: string; }

interface Contact { contact_id: string; contactName: string; email11?: string; location_id?: string; customer_id?: string; }

interface State { id: string; statename: string; }

interface LookupData {
    customers: Customer[];
    AllActiveEmployees: Employee[];
    AnalysisManagers: Manager[];
    SalesManagers: Manager[];
    designMngrs: Manager[];
    salesnpiusers: Employee[];
    tool: string[];
    Locations: Location[];
    Contacts: Contact[];
    States: State[];
}

interface EnquiryForm {
    enquirytype: string;
    customerId: string;
    jobnames: string;
    contactName: string;
    location: string;
    inputreceivedthru: string;
    billingType: string;
    currency: number;
    type: string;
    tool: string;
    quotation_request_lastdate: string;
    govt_tender: string;
    completeresponsibilityid: string;
    salesresponsibilityid: string;
    referenceBy: string;
    remarks: string;
    layout: string[];
    analysis: string[];
    va: string[];
    npi: string[];
    layoutbyid: string;
    analysisbyid: string;
    npibyid: string;    //referring va only but tbale field is npibyid
    NPINewbyid: string;
    locationId: string;
    createdBy: string;
    status: string;
    statename: string;
}

const OffshoreEnquiry: React.FC = () => {
    const loginUser = sessionStorage.getItem("SessionUserName") || "guest";
    const navigate = useNavigate();
    const [form, setForm] = useState<EnquiryForm>({
        enquirytype: "OFFSHORE",
        customerId: "",
        jobnames: "",
        contactName: "",
        location: "",
        inputreceivedthru: "",
        billingType: "",
        currency: 1,
        type: "Export",
        tool: "",
        quotation_request_lastdate: "",
        govt_tender: "NO",
        completeresponsibilityid: "NA",
        salesresponsibilityid: "",
        referenceBy: "",
        remarks: "",
        layout: [],
        analysis: [],
        va: [],
        npi: [],
        layoutbyid: "NA",
        analysisbyid: "NA",
        npibyid: "NA",
        NPINewbyid: "NA",
        locationId: "",
        createdBy: loginUser,
        status: "Open",
        uploadedfilename: "test",
    });

    const [lookups, setLookups] = useState<LookupData>({
        customers: [],
        AllActiveEmployees: [],
        AnalysisManagers: [],
        SalesManagers: [],
        designMngrs: [],
        salesnpiusers: [],
        PCBTools: [],
        Locations: [],
        Contacts: [],
        States: [],
    });

    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState("");
    const [email11, setEmail11] = useState("");

    // fields backend requires, but UI does not collect
    const dtoBlankDefaults = {
        layoutbyid: "", npibyid: "", analysisbyid: "", NPINewbyid: "",
        pi: "NO", si: "NO", dfa: "NO", dfm: "NO", fpg: "NO", asmb: "NO", pcba: "NO", qacam: "NO",
        design: "NO", library: "NO", layout_fab: "NO", layout_testing: "NO", layout_others: "NO",
        emi_net_level: "NO", emi_system_level: "NO", thermal_board_level: "NO", thermal_system_level: "NO",
        hardware: "NO", VA_Assembly: "NO", DesignOutSource: "NO", npi_fab: "NO", npi_testing: "NO", npi_others: "NO",
        NPINew_Fab: "NO", NPINew_Testing: "NO", NPINew_Assbly: "NO", NPINew_BOMProc: "NO",
        npinew_jobwork: "NO", tool: "", software: "NO", analysis_others: "NO", status: "Open", quotation_request_lastdate: new Date().toISOString(),
        createdOn: new Date().toISOString(), enquiryno: "AUTO", uploadedfilename: file ? file.name : "test", statename: "-",
    };

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
                    PCBTools,
                    Locations,
                    Contacts,
                    States: [
                        { id: "Karnataka", statename: "Karnataka" },
                        { id: "Tamil Nadu", statename: "Tamil Nadu" },
                        { id: "Maharashtra", statename: "Maharashtra" },
                    ],
                });
            } catch (err) {
                console.error("Error fetching lookups:", err);
            }
        };
        fetchLookups();
    }, []);

    useEffect(() => {
        const combined = [
            form.layoutbyid,
            form.analysisbyid,
            form.npibyid,
            form.NPINewbyid,
        ]
            .filter(Boolean)
            .join(", ");

        setForm((prev) => ({ ...prev, completeResp: combined }));
    }, [form.layoutbyid, form.analysisbyid, form.npibyid, form.NPINewbyid]);

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

    const getResponsibilityOptions = (section: string) => {
        switch (section) {
            case "Layout": return lookups.designMngrs;
            case "Analysis": return lookups.AnalysisManagers;
            case "VA": return lookups.designMngrs;  // filling same data for npi and VA added new
            case "NPI": return lookups.salesnpiusers;
            default: return lookups.AllActiveEmployees;
        }
    };

    const getCompleteRespOptions = () => {
        const selectedIds = [
            form.layoutbyid,
            form.analysisbyid,
            form.npibyid,
            form.NPINewbyid,
        ].filter((id) => id && id.trim() !== "");

        if (selectedIds.length === 0) return [];

        const allEmployees: any[] = [
            ...(lookups.designMngrs || []),
            ...(lookups.AnalysisManagers || []),
            ...(lookups.salesnpiusers || []),
            ...(lookups.AllActiveEmployees || []),
        ];

        const options = selectedIds
            .map((id) => {
                const emp =
                    allEmployees.find(
                        (e) => e.hopC1ID === id || e.iDno === id
                    ) || null;

                if (!emp) {
                    console.warn("No matching employee found for ID:", id);
                    return null;
                }

                return {
                    value: emp.hopC1ID || emp.iDno || id,
                    label: emp.hopC1NAME || emp.name || `Unknown (${id})`,
                };
            })
            .filter((opt) => opt && opt.label && opt.value);

        // Remove duplicates
        const unique = Array.from(
            new Map(options.map((opt) => [opt.value, opt])).values()
        );

        return unique;
    };

    const scopeDefaults = {
        pi: "",
        si: "",
        dfa: "",
        dfm: "",
        fpga: "",
        asmb: "",
        pcba: "",
        qacam: "",
        design: "",
        library: "",
        analysisbyid: "",
        hardware: "",
        layout_fab: "",
        layout_testing: "",
        layout_others: "",
        emi_net_level: "",
        emi_system_level: "",
        thermal_board_level: "",
        thermal_system_level: "",
        npi_fab: "",
        npi_testing: "",
        npi_others: "",
        DesignOutSource: "",
        NPINew_Fab: "",
        NPINew_Testing: "",
        NPINew_Assbly: "",
        NPINew_BOMProc: "",
        NPINewbyid: "",
        npinew_jobwork: "",
        VA_Assembly: "",
    };

    const handleChange = async (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
    ) => {
        const { name, value } = e.target as HTMLInputElement;
        // Prepare an updated form object (no state reset yet)
        let updatedForm = { ...form, [name]: value };

        if (name === "currency") {
            // Convert string "1" | "2" | "3" to number 1 | 2 | 3
            setForm((p) => ({ ...p, currency: Number(value) }));
            return;
        }

        if (name === "customerId") {
            updatedForm = {
                ...updatedForm,
                locationId: "",
                contactName: "",
                statename: form.statename,
            };
            setForm(updatedForm);
            await fetchCustomerLocations(value);
            return; // stop here, don’t run other logic
        }

        // 🔹 Location changed
        if (name === "locationId") {
            const selectedLoc = lookups.Locations.find((l) => l.location_id === value);
            updatedForm = {
                ...form,
                locationId: value,
                contactName: "",
                address: selectedLoc?.address ?? "",
                statename: form.statename,
            };
            setForm(updatedForm);
            setAddress(selectedLoc?.address ?? "");
            setEmail11("");
            await fetchCustomerContacts(form.customerId, value);
            return;
        }

        if (name === "contactName") {
            const contact = lookups.Contacts.find((c) => c.contact_id === value);
            if (contact) {
                updatedForm = {
                    ...updatedForm,
                    contactName: value,
                    address: contact.address && contact.address.trim() !== "" ? contact.address : form.address,
                    statename: form.statename,
                };
                setAddress(contact.address && contact.address.trim() !== "" ? contact.address : form.address);
                setEmail11(contact.email11 ?? "");
            }
            setForm(updatedForm);
            return;
        }

        // Auto-update Complete Responsibility when any scope responsibility changes
        const responsibilityFields = ["layoutbyid", "analysisbyid", "npibyid", "NPINewbyid"];

        if (responsibilityFields.includes(name)) {
            // Collect all selected responsibilities (excluding empty ones)
            const selectedNames = responsibilityFields
                .map((key) => {
                    const id = name === key ? value : form[key as keyof EnquiryForm];
                    if (!id) return null;

                    // Find matching employee name across lookups
                    const allEmps = [
                        ...lookups.designMngrs,
                        ...lookups.AnalysisManagers,
                        ...lookups.salesnpiusers,
                    ];
                    const emp = allEmps.find(
                        (e: any) => e.hopC1ID === id || e.iDno === id
                    );
                    return emp ? emp.hopC1NAME || emp.name : null;
                })
                .filter(Boolean);

            updatedForm = {
                ...updatedForm,
                completeResp: selectedNames.join(", "),
            };
        }
        setForm(updatedForm);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) setFile(e.target.files[0]);
    };

    const convertCheck = (value: boolean): string => (value ? "YES" : "NO");

    const handleCheckboxChange = (section: string, item: string, checked: boolean) => {
        setForm((prev) => {
            // Create a new Set to manage selected items
            const items = new Set(prev[section] || []);
            if (checked) items.add(item);
            else items.delete(item);

            // Build updated form
            const updated = { ...prev, [section]: Array.from(items) };

            // 🔹 If no checkboxes remain in this section, clear the corresponding responsibility
            if (items.size === 0) {
                switch (section) {
                    case "layout":
                        updated.layoutbyid = "";
                        break;
                    case "analysis":
                        updated.analysisbyid = "";
                        break;
                    case "va":
                        updated.npibyid = "";          // in table we refer npibyid as va by id
                        break;
                    case "npi":
                        updated.NPINewbyid = "";
                        break;
                    default:
                        break;
                }
            }

            return updated;
        });
    };
    // Helper to concatenate selected items across all scopes
    const generateAppendReq = (): string => {
        const selectedItems: string[] = [];
        // Add selected items from each scope
        if (form.layout.length) selectedItems.push(...form.layout);
        if (form.analysis.length) selectedItems.push(...form.analysis);
        if (form.va.length) selectedItems.push(...form.va);
        if (form.npi.length) selectedItems.push(...form.npi);

        return selectedItems.join(", "); // "Design, SI, Software"
    };

    // --- Scope configuration ---
    const scopeConfig = [
        {
            section: "Layout",
            field: "layout",
            responsibilityField: "layoutbyid",
            checkboxes: ["Design", "Library", "QA/CAM", "DFA", "DFM", "Fabrication", "Testing", "Others"],
            responsibilityOptions: lookups.designMngrs,
            isManager: true, // use hopC1ID/hopC1NAME
        },
        {
            section: "Analysis",
            field: "analysis",
            responsibilityField: "analysisbyid",
            checkboxes: ["SI", "PI", "EMI Net Level", "EMI System Level", "Thermal Board Level", "Thermal System Level", "Others"],
            responsibilityOptions: lookups.AnalysisManagers,
            isManager: true,
        },
        {
            section: "VA",
            field: "va",
            responsibilityField: "npibyid",
            checkboxes: ["Fabrication", "Assembly", "Hardware", "Software", "FPGA", "Testing", "Others", "Design Outsourced"],
            responsibilityOptions: lookups.designMngrs,     //use designmanagers for VA responsibility
            isManager: true,
        },
        {
            section: "NPI",
            field: "npi",
            responsibilityField: "NPINewbyid",
            checkboxes: ["BOM Procurement", "NPI-Fabrication", "NPI-Assembly", "Job Work", "NPI-Testing"],
            responsibilityOptions: lookups.salesnpiusers,
            isManager: false,
        },
    ];

    // 🔹 Check if at least one responsibility field is selected
    const isResponsibilitySelected = ["layoutbyid", "analysisbyid", "npibyid", "NPINewbyid"].some(
        (field) => form[field as keyof EnquiryForm]
    );

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // 1️⃣ Basic required field validation
            if (!form.customerId) {
                toast.error("Customer is required");
                setLoading(false);
                return;
            }
            if (!form.locationId) {
                toast.error("Location is required");
                setLoading(false);
                return;
            }
            if (!form.contactName) {
                toast.error("Contact is required");
                setLoading(false);
                return;
            }
            if (!form.salesresponsibilityid) {
                toast.error("Sales Responsibility is required");
                setLoading(false);
                return;
            }

            // 2️⃣ Validate that for each selected scope, a responsibility is chosen
            if (form.layout.length > 0 && !form.layoutbyid) {
                toast.error("Please select Layout Responsibility");
                setLoading(false);
                return;
            }
            if (form.analysis.length > 0 && !form.analysisbyid) {
                toast.error("Please select Analysis Responsibility");
                setLoading(false);
                return;
            }
            // if (form.va.length > 0 && !form.vabyid) {
            if (form.va.length > 0 && !form.npibyid) {
                toast.error("Please select VA Responsibility");
                setLoading(false);
                return;
            }
            if (form.npi.length > 0 && !form.NPINewbyid) {
                toast.error("Please select NPI Responsibility");
                setLoading(false);
                return;
            }

            // 3️⃣ Merge defaults with current form
            const postPayload: any = { ...dtoBlankDefaults, ...form };

            // 4️⃣ Map scope arrays to individual YES/NO fields
            // Layout
            const layoutMap: any = {
                Design: "design",
                Library: "library",
                "QA/CAM": "qacam",
                DFA: "dfa",
                DFM: "dfm",
                Fabrication: "asmb",
                Testing: "layout_testing",
                Others: "layout_others",
            };
            Object.entries(layoutMap).forEach(([label, field]) => {
                postPayload[field] = form.layout.includes(label) ? "YES" : "NO";
            });

            // Analysis
            const analysisMap: any = {
                SI: "si",
                PI: "pi",
                "EMI Net Level": "emi_net_level",
                "EMI System Level": "emi_system_level",
                "Thermal Board Level": "thermal_board_level",
                "Thermal System Level": "thermal_system_level",
                Others: "analysis_others",
            };
            Object.entries(analysisMap).forEach(([label, field]) => {
                postPayload[field] = form.analysis.includes(label) ? "YES" : "NO";
            });

            // VA
            const vaMap: any = {
                Fabrication: "VA_Assembly",
                Assembly: "VA_Assembly",
                "Design Outsourced": "DesignOutSource",
                Others: "npi_others",
                Hardware: "hardware",
                Software: "software",
                FPGA: "fpg",
                Testing: "hardware_testing",
            };
            Object.entries(vaMap).forEach(([label, field]) => {
                postPayload[field] = form.va.includes(label) ? "YES" : "NO";
            });

            // NPI
            const npiMap: any = {
                "BOM Procurement": "NPINew_BOMProc",
                "NPI-Fabrication": "NPINew_Fab",
                "NPI-Assembly": "NPINew_Assbly",
                "NPI-Testing": "NPINew_Testing",
                "Job Work": "npinew_jobwork",
            };
            Object.entries(npiMap).forEach(([label, field]) => {
                postPayload[field] = form.npi.includes(label) ? "YES" : "NO";
            });

            // 5️⃣ Convert boolean fields to YES/NO (if any remaining)
            Object.keys(postPayload).forEach((key) => {
                if (typeof postPayload[key] === "boolean") {
                    postPayload[key] = postPayload[key] ? "YES" : "NO";
                }
            });
            // Helper to concatenate selected items across all scopes
            const generateAppendReq = (): string => {
                const selectedItems: string[] = [];

                // Add selected items from each scope
                if (form.layout.length) selectedItems.push(...form.layout);
                if (form.analysis.length) selectedItems.push(...form.analysis);
                if (form.va.length) selectedItems.push(...form.va);
                if (form.npi.length) selectedItems.push(...form.npi);

                return selectedItems.join(", "); // "Design, SI, Software"
            };
            postPayload.appendreq = generateAppendReq() || "NA";

            // 6️⃣ Map frontend names to backend-required names for FormData
            const formData = new FormData();
            formData.append("customer_id", postPayload.customerId);
            formData.append("contact_id", postPayload.contactName); // contactName holds the ID
            formData.append("location_id", postPayload.locationId);
            formData.append("type", postPayload.type);
            formData.append("currency_id", postPayload.currency);
            formData.append("inputreceivedthru", postPayload.inputreceivedthru);
            formData.append("salesresponsibilityid", postPayload.salesresponsibilityid);
            formData.append("completeresponsibilityid", postPayload.completeresponsibilityid);
            formData.append("govt_tender", postPayload.govt_tender);
            formData.append("quotation_request_lastdate", postPayload.quotation_request_lastdate);
            formData.append("createdBy", postPayload.createdBy);
            formData.append("ReferenceBy", postPayload.referenceBy || ""); // send name if needed
            formData.append("appendreq", postPayload.appendreq);

            // 7️⃣ Append the rest
            Object.entries(postPayload).forEach(([key, value]) => {
                if (![
                    "customerId",
                    "contactName",
                    "locationId",
                    "type",
                    "currency",
                    "inputreceivedthru",
                    "salesresponsibilityid",
                    "completeresponsibilityid",
                    "govt_tender",
                    "quotation_request_lastdate",
                    "createdBy",
                ].includes(key)) {
                    if (Array.isArray(value)) {
                        value.forEach((v) => formData.append(key, v));
                    } else {
                        formData.append(key, value ?? "");
                    }
                }
            });

            // 8️⃣ Append file if selected
            if (file) formData.append("file", file);

            // 9️⃣ POST to backend
            const res = await fetch(`${baseUrl}/api/Sales/AddEnquiryData`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                toast.success(
                    <div>
                        Enquiry added successfully
                        <Button
                            style={{ marginLeft: "10px", color: "#fff", textDecoration: "underline" }}
                            onClick={() => navigate("/Home/ViewAllEnquiries")}
                        >
                            Return to ViewAllEnquiries
                        </Button>
                    </div>
                );
            } else {
                const err = await res.text();
                toast.error("❌ Failed to save enquiry: " + err);
            }
        } catch (err) {
            console.error(err);
            toast.error("❌ Unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };


    return (
        <Card
            sx={{
                width: "110%",
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
                >
                    {/* Row 1 */}
                    <Grid item xs={6} md={3}>
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

                    <Grid item xs={6} md={3}>
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
                    <Grid item xs={6}>
                        <SelectControl
                            name="statename"
                            label="State"
                            value={form.statename}
                            onChange={handleChange}
                            options={lookups.States.map((s) => ({
                                value: s.id,
                                label: s.statename,
                            }))}
                            required
                            width="200px"
                        />
                    </Grid>
                    <Grid item xs={6}>
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
                            // disabled={!form.location}
                            disabled={!form.locationId}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            name="emailAddress"
                            label="Email Address"
                            value={email11}
                            onChange={handleChange}
                            fullWidth
                            disabled={true}
                            InputLabelProps={{ shrink: true }} // To keep label above even if empty and avoid overlapping pf placeholder or label with value
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <TextField
                            label="Address"
                            name="address"
                            value={address}
                            onChange={handleChange}
                            multiline
                            rows={2}
                            fullWidth
                            disabled={true}
                        />
                    </Grid>
                    {/* Row 2 */}
                    <Grid item xs={12} md={2}>
                        <TextField
                            label="Board Ref"
                            name="jobnames"
                            value={form.jobnames}
                            onChange={handleChange}
                            size="small"
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="inputreceivedthru"
                            label="Input Received Thru"
                            value={form.inputreceivedthru || ""}
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
                                <FormControlLabel value="1" control={<Radio />} label="INR" />
                                <FormControlLabel value="2" control={<Radio />} label="USD" />
                                <FormControlLabel value="3" control={<Radio />} label="EURO" />
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
                            name="tool"
                            label="PCB Tool"
                            value={form.tool || ""}
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
                    {scopeConfig.map((cfg) => {
                        const lowerField = cfg.field;
                        const respField = cfg.responsibilityField;

                        return (
                            <Grid item xs={12} key={cfg.section}>
                                <Grid container alignItems="center" justifyContent="space-between" sx={{ borderBottom: "1px dashed #ddd", pb: 1, mb: 1 }}>
                                    {/* Checkbox section */}
                                    <Grid item xs={10}>
                                        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{cfg.section}</Typography>
                                        <FormGroup row>
                                            {cfg.checkboxes.map((item) => (
                                                <FormControlLabel
                                                    key={item}
                                                    control={
                                                        <Checkbox
                                                            checked={form[lowerField]?.includes(item)}
                                                            onChange={(e) => handleCheckboxChange(lowerField, item, e.target.checked)}
                                                        />
                                                    }
                                                    label={item}
                                                />
                                            ))}
                                        </FormGroup>
                                    </Grid>

                                    {/* Responsibility SelectControl: render only if at least one checkbox selected */}
                                    <Grid item xs={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        {form[lowerField]?.length > 0 && (
                                            <SelectControl
                                                name={respField}
                                                label={`${cfg.section} Responsibility`}
                                                value={form[respField] || ""}
                                                onChange={handleChange}
                                                options={cfg.responsibilityOptions.map((opt: any) =>
                                                    cfg.isManager
                                                        ? { value: opt.hopC1ID, label: opt.hopC1NAME }
                                                        : { value: opt.iDno, label: opt.name }
                                                )}
                                                fullWidth={false}
                                                width="220px"
                                                required
                                            />
                                        )}
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
                                ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
                            </Typography>
                            <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                        </Box>
                    </Grid>
                    {/* --- Quotation & Tender --- */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            type="date"
                            label="Quotation Request Last Date"
                            name="quotation_request_lastdate"
                            value={form.quotation_request_lastdate || ""}
                            onChange={(e) => {
                                const value = e.target.value; // always yyyy-mm-dd from <input type="date">
                                setForm((p) => ({ ...p, quotation_request_lastdate: value }));
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
                                    // checked={form.govtTender}
                                    checked={form.govt_tender === "YES"}
                                    onChange={(e) =>
                                        setForm((p) => ({ ...p, govt_tender: e.target.checked ? "YES" : "NO" }))
                                    }
                                />
                            }
                            label="Govt Tender?"
                        />
                    </Grid>

                    {/* --- Responsibilities --- */}
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="completeresponsibilityid"
                            label="Complete Responsibility"
                            value={form.completeresponsibilityid}
                            onChange={handleChange}
                            options={getCompleteRespOptions()}
                            fullWidth
                            width="220px"
                            required
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <SelectControl
                            name="salesresponsibilityid"
                            label="Sales Responsibility"
                            value={form.salesresponsibilityid}
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
                                value: e.name,
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
                            disabled={!isResponsibilitySelected || loading} // if none of the responsibility fields are selected
                            sx={{ px: 6, height: 45 }}
                        >
                            {loading ? "Saving..." : "ADD"}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
            <ToastContainer position="top-right" autoClose={2500} theme="colored" />
        </Card>

    );
};
export default OffshoreEnquiry;
