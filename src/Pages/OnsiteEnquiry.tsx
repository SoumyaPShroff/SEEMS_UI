import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, FormGroup, Typography, TextField, FormControlLabel, RadioGroup, Radio, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SelectControl from "../components/ReusablePageControls/SelectControl";
import { baseUrl } from "../const/BaseUrl";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

interface EnquiryForm {
  enquirytype: string;
  customerId: string;
  locationId: string;
  contactName: string;
  state: string;
  email11: string;
  tm: string;
  toolLicense: string;
  logistics: string;
  onsiteDurationType: string;
  hourlyRateType: number;
  hourlyReate: string;
  expFrom: number;
  expTo: number;
  quotation_request_lastdate: string;
  salesresponsibilityid: string;
  completeresponsibilityid: string;
  referenceBy: string;
  remarks: string;
  uploadedfilename?: string;
  tool: string;
  noOfResources: string;
  type: string;
  onsiteDuration: string;
  profReqLastDate: string;
  taskId: string;
}


const OnsiteEnquiry: React.FC = () => {
  const navigate = useNavigate();
  const { enquiryNo } = useParams();
  const isEditMode = Boolean(enquiryNo);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState<EnquiryForm>({
    enquirytype: "ONSITE",
    customerId: "",
    locationId: "",
    contactName: "",
    state: "",
    email11: "",
    tm: "",
    toolLicense: "With",
    logistics: "Customer",
    onsiteDurationType: "Days",
    onsiteDuration: "",
    hourlyRateType: 1,
    hourlyReate: "",
    expFrom: "",
    expTo: "",
    profReqLastDate: "",
    quotation_request_lastdate: "",
    salesresponsibilityid: "",
    completeresponsibilityid: "",
    referenceBy: "",
    remarks: "",
    tool: "",
    taskId: "",
    noOfResources: "",
    type: "Export",
  });


  const [lookups, setLookups] = useState<any>({
    customers: [],
    Locations: [],
    Contacts: [],
    States: [],
    SalesManagers: [],
    StageTools: [],
    HOPCTasks: [],
  });

  useEffect(() => {
    Promise.all([
      fetch(`${baseUrl}/api/Sales/customers`).then(r => r.json()),
      fetch(`${baseUrl}/api/Sales/States`).then(r => r.json()),
      fetch(`${baseUrl}/SalesManagers`).then(r => r.json()),
      fetch(`${baseUrl}/HOPCManagerList`).then(r => r.json()),
      fetch(`${baseUrl}/StageTools`).then(r => r.json()),
      fetch(`${baseUrl}/HOPCTasks`).then(r => r.json()),
      fetch(`${baseUrl}/api/Sales/customerlocations`).then(r => r.json()),
      fetch(`${baseUrl}/api/Sales/customercontacts`).then(r => r.json()),
    ]).then(([customers, States, SalesManagers, HOPCManagers, StageTools, HOPCTasks, Locations, Contacts]) => {
      setLookups({ customers, States, SalesManagers, HOPCManagers, StageTools, HOPCTasks, Locations, Contacts });
    });
  }, []);

  const fetchCustomerLocations = async (customerId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/Sales/customerlocations?customerId=${customerId}`
      );
      const data = await res.json();

      setLookups((prev: any) => ({
        ...prev,
        Locations: data,
        Contacts: [], // reset contacts when customer changes
      }));
    } catch (err) {
      console.error(err);
      setLookups((prev: any) => ({ ...prev, Locations: [], Contacts: [] }));
    }
  };

  const fetchCustomerContacts = async (customerId: string, locationId: string) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/Sales/customercontacts?customer_id=${customerId}&location_id=${locationId}`
      );
      const data = await res.json();

      setLookups((prev: any) => ({
        ...prev,
        Contacts: data,
      }));
    } catch (err) {
      console.error(err);
      setLookups((prev: any) => ({ ...prev, Contacts: [] }));
    }
  };
  // ✅ When Customer changes → load Locations
  useEffect(() => {
    if (!form.customerId) return;
    fetchCustomerLocations(form.customerId);
  }, [form.customerId]);

  // ✅ When Location changes → load Contacts
  useEffect(() => {
    if (!form.customerId || !form.locationId) return;
    fetchCustomerContacts(form.customerId, form.locationId);
  }, [form.locationId]);

  // ✅ When Contact changes → auto-fill Email
  useEffect(() => {
    if (!form.contactName) return;

    const c = lookups.Contacts.find(
      (x: any) => String(x.contact_id) === String(form.contactName)
    );

    if (c) {
      setForm((prev) => ({ ...prev, email11: c.email11 || "" }));
    }
  }, [form.contactName]);

  /* ---------------- EDIT MODE LOAD ---------------- */

  useEffect(() => {
    if (!isEditMode) return;
    fetch(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enquiryNo}`)
      .then(r => r.json())
      .then(data => {
        const e = Array.isArray(data) ? data[0] : data;

        setForm(prev => ({
          ...prev,
          customerId: String(e.customer_id || ""),
          locationId: String(e.location_id || ""),
          contactName: String(e.contact_id || ""),
          state: e.statename || "",
          email11: e.email11 || "",
          tm: e.tm || "",
          toolLicense: e.toolLicense || "With",
          logistics: e.logistics || "Customer",
          onsiteDurationType: e.onsiteDurationType || "Days",
          onsiteDuration: e.onsiteDuration || "",
          hourlyRateType: Number(e.hourlyRateType || 1),
          hourlyReate: e.hourlyReate || "",
          expFrom: e.expFrom || "",
          expTo: e.expTo || "",
          profReqLastDate: e.quotation_request_lastdate?.substring(0, 10) || "",
          quotation_request_lastdate: e.quotation_request_lastdate || "",
          salesresponsibilityid: e.salesresponsibilityid || "",
          completeresponsibilityid: e.completeresponsibilityid || "",
          referenceBy: e.referenceBy || "",
          remarks: e.remarks || "",
          uploadedfilename: e.uploadedfilename,
          tool: e.tool || "",
          taskId: e.taskId || "",
          noOfResources: e.noOfResources || "",
          type: e.type || "Export",
        }));

      });
  }, [isEditMode]);

  /* ---------------- AUTO EMAIL FILL ---------------- */

  useEffect(() => {
    if (!form.contactName) return;
    const c = lookups.Contacts.find((x: any) => String(x.contact_id) === String(form.contactName));
    if (c) {
      setForm(prev => ({ ...prev, email11: c.email11 || "" }));
    }
  }, [form.contactName]);

  /* ---------------- HANDLERS ---------------- */

const handleChange = async (e: any) => {
    const { name, value } = e.target;
    // ✅ CUSTOMER CHANGE
    if (name === "customerId") {
      setForm((prev) => ({
        ...prev,
        customerId: value,
        locationId: "",
        contactName: "",
        email11: "",
      }));

      await fetchCustomerLocations(value);
      return;
    }

    // ✅ LOCATION CHANGE
    if (name === "locationId") {
      setForm((prev) => ({
        ...prev,
        locationId: value,
        contactName: "",
        email11: "",
      }));

      await fetchCustomerContacts(form.customerId, value);
      return;
    }

    // ✅ CONTACT CHANGE → EMAIL handled by useEffect
    if (name === "contactName") {
      setForm((prev) => ({
        ...prev,
        contactName: value,
      }));
      return;
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericChange = (e: any) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  /* ---------------- COMPLETE RESPONSIBILITY (SALES + DESIGN) ---------------- */

  const allCompleteResp = [
    ...lookups.SalesManagers,
  ].map((e: any) => ({
    value: e.id || e.HOPC1ID,
    label: e.name || e.HOPC1NAME
  }));

  /* ---------------- DATE VALIDATION ---------------- */

  const isValidDate = () => {
    const selected = new Date(form.profReqLastDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!form.customerId || !form.salesresponsibilityid || !form.completeresponsibilityid) {
      toast.error("Required fields missing");
      return;
    }

    const fd = new FormData();

    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));

    if (file) {
      fd.append("file", file);
      fd.append("uploadedfilename", file.name);
    }

    const url = isEditMode
      ? `${baseUrl}/api/Sales/EditEnquiryData`
      : `${baseUrl}/api/Sales/AddEnquiryData`;

    if (isEditMode) {
      fd.append("enquiryno", enquiryNo as string);
    }

    const res = await fetch(url, { method: isEditMode ? "PUT" : "POST", body: fd });

    if (res.ok) {
      toast.success(isEditMode ? "✅ Onsite Enquiry Updated" : "✅ Onsite Enquiry Added");
      navigate("/Home/ViewAllEnquiries");
    } else toast.error("❌ Failed to save");
  };

  const handleTwoDigitNumber = (e: any) => {
  const { name, value } = e.target;

  // Allow only numbers and max 2 digits
  if (/^\d{0,2}$/.test(value)) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};

  /* ---------------- UI ---------------- */

  return (
    <Box sx={{ maxWidth: 1100, margin: "0 auto", mt: 5 }}>
      <Card sx={{ width: "100%", m: "auto", mt: 3, p: 4, boxShadow: 6, borderRadius: 3, }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" mb={3} color="#1565c0" fontWeight="700">
            {isEditMode ? "Edit ONSITE Enquiry" : "Add ONSITE Enquiry"}
          </Typography>

          <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap={2}>
            {/* Radio Groups */}
            <Box gridColumn="span 4">
              <Typography>Tool License</Typography>
              <RadioGroup row sx={{
                justifyContent: "space-evenly", border: "1px solid #ccc",
                borderRadius: "8px", padding: "6px",
              }}
                name="toolLicense"
                value={form.toolLicense}
                onChange={handleChange}>
                <FormControlLabel value="With" control={<Radio />} label="With" />
                <FormControlLabel value="Without" control={<Radio />} label="Without" />
              </RadioGroup>
            </Box>

            <Box gridColumn="span 4">
              <Typography>Logistics</Typography>
              <RadioGroup row sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }} name="logistics" value={form.logistics} onChange={handleChange}>
                <FormControlLabel value="Customer" control={<Radio />} label="Customer" />
                <FormControlLabel value="ECAD" control={<Radio />} label="ECAD" />
              </RadioGroup>
            </Box>

            <Box gridColumn="span 4">
              <Typography>Type</Typography>
              <RadioGroup
                row
                sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }}
                value={form.type}
              >
                <FormControlLabel value="Export" control={<Radio />} label="Export" />
                <FormControlLabel value="Domestic" control={<Radio />} label="Domestic" />
              </RadioGroup>
            </Box>

            {/* Customer / Location / State / Contact */}
            <Box gridColumn="span 3">
              <SelectControl name="customerId" label="Customer" value={form.customerId}
                options={lookups.customers.map((c: any) => ({ value: c.itemno, label: c.customer }))}
                onChange={handleChange} required />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="locationId" label="Location" value={form.locationId}
                options={lookups.Locations.map((l: any) => ({ value: l.location_id, label: l.location }))}
                onChange={handleChange} required />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="state" label="State" value={form.state}
                options={lookups.States.map((s: any) => ({ value: s.state, label: s.state }))}
                onChange={handleChange} required />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="contactName" label="Contact Name" value={form.contactName}
                options={lookups.Contacts.map((c: any) => ({ value: c.contact_id, label: c.contactName }))}
                onChange={handleChange} required />
            </Box>

            <Box gridColumn="span 3">
              <TextField label="Email Address" value={form.email11} disabled fullWidth />
            </Box>
            <Box gridColumn="span 3">
              <SelectControl
                name="tm" label="Billing Type" value={form.tm || ""}
                onChange={handleChange}
                options={[
                  { value: "Hourly", label: "Hourly" },
                  { value: "Monthly", label: "Monthly" },
                ]}
                required
                fullWidth
              />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl
                name="Idno"
                label="Tool"
                value={form.tool || ""}
                onChange={handleChange}
                options={lookups.StageTools.map((t: any) => ({
                  value: t.idno,
                  label: t.tools,
                }))}
                required
              />
            </Box>
            <Box gridColumn="span 3">
              <SelectControl
                name="itemnumber"
                label="Task"
                value={form.taskId || ""}
                onChange={handleChange}
                options={lookups.HOPCTasks.map((t: any) => ({
                  value: t.itemnumber,
                  label: t.tasktype,
                }))}
                required
              />
            </Box>

            {/* Experience */}
            <Box gridColumn="span 2">
              <TextField label="Experience From" name="expFrom" value={form.expFrom} onChange={handleNumericChange} />

            </Box>
            <Box gridColumn="span 1">
              <TextField label="To" name="expTo" value={form.expTo} onChange={handleNumericChange} />
            </Box>

            <Box gridColumn="span 2">
              <TextField label="No of Resources" type="number" name="noOfResources" value={form.noOfResources}
                onChange={handleChange} />
            </Box>
            {/* Profile req date Date */}
            <Box gridColumn="span 2">
              <TextField type="date" label="Profile Request Last Date"
                name="profReqLastDate"
                value={form.profReqLastDate}
                onChange={handleChange} InputLabelProps={{ shrink: true }} required />
            </Box>

            <Box gridColumn="span 2">
              <TextField type="date" label="Tentative Start Date"
                name="tentStartDate"
                value={form.tentStartDate || ""}
                onChange={(e) => {
                  const value = e.target.value; // always yyyy-mm-dd from <input type="date">
                  setForm((p) => ({ ...p, tentStartDate: value }));
                }} InputLabelProps={{ shrink: true }}
                required />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl
                name="tm"
                label="Enquiry Billing Type"
                value={form.tm || ""}
                onChange={handleChange}
                options={[
                  { value: "Fixed-Cost", label: "Fixed-Cost" },
                  { value: "Time and Material", label: "Time and Material" },
                  { value: "Fixed_Monthly Billing", label: "Fixed_Monthly Billing" },
                ]}
                required
              />
            </Box>

            <Box gridColumn="span 5" display="flex" gap={2} alignItems="flex-end">
              <Box flex={1}>
                <Typography>Onsite Duration</Typography>
                <RadioGroup row sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }} name="onsiteDurationType" value={form.onsiteDurationType} onChange={handleChange}>
                  <FormControlLabel value="Days" control={<Radio />} label="Days" />
                  <FormControlLabel value="Months" control={<Radio />} label="Months" />
                </RadioGroup>
              </Box>
              <Box width={110}>
               <TextField  type="number"  size="small"  value={form.onsiteDuration}  onChange={handleTwoDigitNumber}  name="onsiteDuration"
                  label={ form.onsiteDurationType === "Months"  ? "In Months" : "In Days"  }/>
              </Box>
            </Box>
            <Box gridColumn="span 5" display="flex" gap={2} alignItems="flex-end">
              <Box flex={1}>
                <Typography>Currency</Typography>
                <RadioGroup row sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }} name="hourlyRateType" value={form.hourlyRateType} onChange={handleChange}>
                  <FormControlLabel value="1" control={<Radio />} label="INR" />
                  <FormControlLabel value="2" control={<Radio />} label="USD" />
                  <FormControlLabel value="3" control={<Radio />} label="EURO" />
                </RadioGroup>
              </Box>
              <Box width={110}>
                {/* value={form.hourlyReate}  */}
                <TextField  size="small" label="Hourly Rate" InputLabelProps={{ shrink: true }} />
              </Box>
            </Box>
            <Box gridColumn="span 3">
              <SelectControl name="salesresponsibilityid" label="Sales Responsibility"
                value={form.salesresponsibilityid}
                options={lookups.SalesManagers.map((e: any) => ({ value: e.id, label: e.name }))}
                onChange={handleChange} required />
            </Box>
            <Box gridColumn="span 3">
              <SelectControl name="completeresponsibilityid" label="Complete Responsibility"
                value={form.completeresponsibilityid}
                options={allCompleteResp}
                onChange={handleChange} required />
            </Box>

            {/* Remarks */}
            <Box gridColumn="span 4">
              <TextField label="Remarks" fullWidth size="small" name="remarks" value={form.remarks} onChange={handleChange} />
            </Box>

            {/* File Upload */}
            <Box gridColumn="span 6" textAlign="center">
              <Box onClick={() => document.getElementById("fileInput")?.click()}
                sx={{ border: "2px dashed #90caf9", p: 2, cursor: "pointer" }}>
                <CloudUploadIcon sx={{ fontSize: 40, color: "#2196f3" }} />
                <Typography>{file
                  ? file.name
                  : isEditMode && form.uploadedfilename
                    ? form.uploadedfilename
                    : "Click or Drag a file to upload"}</Typography>
                <input hidden id="fileInput" type="file" onChange={handleFileChange} />
              </Box>
            </Box>

            {/* Submit */}
            <Box gridColumn="span 3" textAlign="center" mt={3}>
              <Button variant="contained" onClick={handleSubmit}>
                {isEditMode ? "UPDATE" : "ADD"}
              </Button>
            </Box>
          </Box>
        </CardContent>
        <ToastContainer />
      </Card>
    </Box>
  );
};
export default OnsiteEnquiry;