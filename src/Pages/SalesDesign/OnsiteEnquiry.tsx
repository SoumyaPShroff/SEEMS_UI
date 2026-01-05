import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, TextField, FormControlLabel, RadioGroup, Radio, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SelectControl from "../../components/ReusablePageControls/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

interface EnquiryForm {
  enquirytype: string;
  customerId: string;
  locationId: string;
  contactName: string;
  state: string;
  email11: string;
  tm: string;
  //toolLicense: number;
  //logistics: number;
  //onsiteDurationType: number;
  //hourlyRateType: number;
  toolLicense: string;
  logistics: string;
  onsiteDurationType: string;
  hourlyRateType: string;
  hourlyReate: string;
  // expFrom: number;
  // expTo: number;
  expFrom: string;
  expTo: string;
  salesresponsibilityid: string;
  completeresponsibilityid: string;
  remarks: string;
  uploadedfilename?: string;
  noOfResources: string;
  type: string;
  onsiteDuration: string;
  profReqLastDate: string;
  taskId: string;
  tentStartDate: string;
  SI?: string;
  PI?: string;
  status: string;
  createdBy: string;
  referenceBy: string;
  //toolId: number;
  toolId: string;
  tool: string;
  quotation_request_lastdate?: string;
}

interface HOPCManager {
  hopc1id: number;
  hopc1name: string;
  emailID?: string;
}

interface SalesManager {
  id: number;
  name: string;
  emailID?: string;
}


function isHOPCManager(obj: any): obj is HOPCManager {
  return obj && "hopc1id" in obj;
}

const OnsiteEnquiry: React.FC = () => {
  const navigate = useNavigate();
  const { enquiryNo } = useParams();
  const isEditMode = Boolean(enquiryNo);
  const [file, setFile] = useState<File | null>(null);
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const loginUser = sessionStorage.getItem("SessionUserName") || "guest";

  const [form, setForm] = useState<EnquiryForm>({
    enquirytype: "ONSITE",
    customerId: "",
    locationId: "",
    contactName: "",
    state: "",
    email11: "",
    tm: "",
    toolLicense: "",
    logistics: "",
    onsiteDurationType: "",
    onsiteDuration: "",
    hourlyRateType: "",
    hourlyReate: "",
    expFrom: "",
    expTo: "",
    profReqLastDate: "",
    quotation_request_lastdate: "",
    salesresponsibilityid: "",
    completeresponsibilityid: "",
    referenceBy: "",
    remarks: "",
    taskId: "",
    noOfResources: "",
    type: "Export",
    tentStartDate: "",
    status: 'Open',
    uploadedfilename: "",
    SI: "",
    PI: "",
    createdBy: loginUser,
    toolId: "",
    tool: "",
  });


  const [lookups, setLookups] = useState<any>({
    customers: [],
    Locations: [],
    Contacts: [],
    States: [],
    SalesManagers: [],
    StageTools: [],
    HOPCTasks: [],
    HOPCManagers: [],
    AllActiveEmployees: [],
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
      fetch(`${baseUrl}/AllActiveEmployees`).then(r => r.json()),

    ]).then(([customers, States, SalesManagers, HOPCManagers, StageTools, HOPCTasks, Locations, Contacts, AllActiveEmployees]) => {
      setLookups({ customers, States, SalesManagers, HOPCManagers, StageTools, HOPCTasks, Locations, Contacts, AllActiveEmployees });
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
      .then(async data => {
        const e = Array.isArray(data) ? data[0] : data;

        // ✅ 1. Set CUSTOMER FIRST
        setForm(prev => ({
          ...prev,
          customerId: String(e.customer_id || ""),
        }));

        // ✅ 2. Load Locations
        await fetchCustomerLocations(String(e.customer_id));


        // ✅ 3. Set LOCATION
        setForm(prev => ({
          ...prev,
          locationId: String(e.location_id || ""),
        }));

        // ✅ 4. Load Contacts
        await fetchCustomerContacts(
          String(e.customer_id),
          String(e.location_id)
        );

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


  /* ---------------- AUTO EMAIL FILL ---------------- */

  useEffect(() => {
    if (!form.contactName) return;
    const c = lookups.Contacts.find((x: any) => String(x.contact_id) === String(form.contactName));
    if (c) {
      setForm(prev => ({ ...prev, email11: c.email11 || "" }));
    }
  }, [form.contactName, lookups.Contacts]);

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

    // ✅ CONTACT CHANGE
    if (name === "contactName") {
      setForm((prev) => ({
        ...prev,
        contactName: value,
      }));
      return;
    }

    // ✅ ✅ TASK → SI / PI AUTO MAPPING (YOUR MAIN REQUIREMENT)
    if (name === "taskId") {
      let SI = "";
      let PI = "";

      if (Number(value) === 182) {
        SI = "YES";
      } else if (Number(value) === 183) {
        PI = "YES";
      }

      setForm((prev) => ({
        ...prev,
        taskId: value,
        SI,
        PI,
      }));
      return;
    }

    // ✅ DEFAULT CHANGE
    setForm((prev) => ({ ...prev, [name]: value }));
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

  /* ---------------- DATE VALIDATION ---------------- */

  // const isValidDate = () => {
  //   const selected = new Date(form.profReqLastDate);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   return selected >= today;
  // };

  // const getUserEmail = (
  //   u: Employee | Manager | SalesManager
  // ): string | null => {
  //   const e = u as any;
  //   return (
  //     e.emailID ??
  //     e.EmailID ??
  //     e.emailId ??
  //     e.EmailId ??
  //     e.email ??
  //     e.Email ??
  //     null
  //   );
  // };
  const getUserEmail = (
    u: HOPCManager | SalesManager
  ): string | null => {
    const e = u as any;
    return (
      e.emailID ??
      null
    );
  };


  // Main function
  const buildEmailRecipientList = () => {
    const respIds = [
      form.salesresponsibilityid,
      form.completeresponsibilityid,
    ].filter(Boolean);

    const allUsers: (SalesManager | HOPCManager)[] = [
      ...lookups.SalesManagers,
      ...lookups.HOPCManagers,
    ];

    const emails = respIds
      .map((id) => {
        const user = allUsers.find((u) => {
          if (isHOPCManager(u)) return String(u.hopc1id) === String(id);
          return String((u as any).id) === String(id);
        });

        if (!user) return null;

        return getUserEmail(user);
      })
      .filter((e): e is string => Boolean(e));

    return [...new Set(emails)];
  };


  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async () => {
    if (!form.customerId || !form.salesresponsibilityid || !form.completeresponsibilityid || !form.noOfResources || !form.expFrom || !form.expTo || !form.profReqLastDate || !form.tentStartDate || !form.hourlyReate) {
      toast.error("Required fields missing");
      return;
    }
    const fd = new FormData();

    // ✅ MAP FRONTEND → API DTO EXACTLY
    fd.append("customer_id", form.customerId);
    fd.append("location_id", form.locationId);
    fd.append("contact_id", form.contactName);
    fd.append("statename", form.state);

    fd.append("tm", form.tm);
    fd.append("toolId", String(form.toolId));
    fd.append("tool", form.tool);
    fd.append("taskId", form.taskId);

    fd.append("expFrom", String(form.expFrom));
    fd.append("expTo", String(form.expTo));
    fd.append("noOfResources", form.noOfResources);

    fd.append("tentStartDate", form.tentStartDate);
    fd.append("onsiteDurationType", form.onsiteDurationType);
    fd.append("onsiteDuration", form.onsiteDuration);
    fd.append("hourlyRateType", String(form.hourlyRateType));
    fd.append("hourlyReate", form.hourlyReate);
    fd.append("profReqLastDate", form.profReqLastDate);
    fd.append("quotation_request_lastdate", form.profReqLastDate);

    fd.append("salesresponsibilityid", form.salesresponsibilityid);
    fd.append("completeresponsibilityid", form.completeresponsibilityid);
    fd.append("type", form.type);
    fd.append("enquirytype", "ONSITE");
    fd.append("si", form.SI || "");
    fd.append("pi", form.PI || "");
    fd.append("toolLicense", form.toolLicense);
    fd.append("createdBy", loginUser);
    fd.append("logistics", form.logistics);
    fd.append("remarks", form.remarks);
    fd.append("referenceBy", form.referenceBy);

    // email trigger lists
    const toList = buildEmailRecipientList();
    fd.append("ToMailList", JSON.stringify(toList));  // send array as JSON

    // Optional CC list e.g. referenceBy or createdBy
    // 1️⃣ Collect Login IDs (not emails)
    const otherResp: string[] = [];

    if (loginId) {
      otherResp.push(loginId);
    }

    // 2️⃣ Remove empty, whitespace and duplicates
    const uniqueOtherResp = [...new Set(otherResp.map(id => id.trim()).filter(Boolean))];

    // 3️⃣ Call API with comma-separated LoginIDs
    const { data: emailList } = await axios.get(`${baseUrl}/EmailId/${uniqueOtherResp.join(",")}`);

    // 4️⃣ Normalize result (API may return single string or array)
    const ccList = Array.isArray(emailList) ? emailList : [emailList];

    // 5️⃣ Append to formData
    fd.append("CCMailList", JSON.stringify(ccList));

    // ✅ FILE
    if (file) {
      fd.append("file", file);
      fd.append("uploadedfilename", file.name);
    }
    // ✅ NOW LOG SAFELY
    console.log("✅ FINAL FORMDATA PAYLOAD ↓↓↓");
    for (let pair of fd.entries()) {
      console.log(pair[0], ":", pair[1]);
    }

    const url = isEditMode ? `${baseUrl}/api/Sales/EditEnquiryData` : `${baseUrl}/api/Sales/AddEnquiryData`;

    if (isEditMode) {
      fd.append("enquiryno", enquiryNo as string);
    }

    try {
      const res = await fetch(url, { method: isEditMode ? "PUT" : "POST", body: fd, });
      if (!res.ok) {
        const err = await res.text();
        console.error("SAVE ERROR:", err);
        toast.error("❌ Failed to Add enquiry");
        return;
      }

      toast.success(isEditMode ? "✅ Onsite Enquiry Updated" : "✅ Onsite Enquiry Added");
      navigate("/Home/ViewAllEnquiries");

    } catch (error) {
      console.error("NETWORK ERROR:", error);
      toast.error("❌ Server not reachable");
    }

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

  const handleHourlyRateChange = (e: any) => {
    const { name, value } = e.target;

    // Allow only numbers with up to 2 decimals
    const regex = /^\d*(\.\d{0,2})?$/;

    if (regex.test(value)) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <Box sx={{ maxWidth: 1100, margin: "0 auto", mt: 9 }}>
      <Card sx={{ width: "100%", m: "auto", mt: 3, p: 4, borderRadius: 3, boxShadow: "0px 4px 20px #6594b3ff" }}>
        <CardContent>
          <Typography variant="h5" textAlign="center" mb={3} color="#1565c0" fontWeight="700">
            {isEditMode ? "Edit ONSITE Enquiry" : "Add ONSITE Enquiry"}
          </Typography>

          <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap={2}>
            {/* Radio Groups */}
            <Box gridColumn="span 3">
              <Typography>Tool License</Typography>
              <RadioGroup row sx={{
                justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", height: "40px",
              }}
                name="toolLicense"
                value={form.toolLicense}
                onChange={handleChange}
              >
                <FormControlLabel value="1" control={<Radio />} label="With" />
                <FormControlLabel value="2" control={<Radio />} label="Without" />
              </RadioGroup>
            </Box>

            <Box gridColumn="span 4">
              <Typography>Logistics</Typography>
              <RadioGroup row sx={{ justifyContent: "space-evenly", height: "40px", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }} name="logistics" value={form.logistics} onChange={handleChange}>
                <FormControlLabel value="1" control={<Radio />} label="Customer" />
                <FormControlLabel value="2" control={<Radio />} label="Sienna ECAD" />
              </RadioGroup>
            </Box>

            <Box gridColumn="span 4">
              <Typography>Type</Typography>
              <RadioGroup
                row
                sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", height: "40px", }}
                value={form.type}
              >
                <FormControlLabel value="Export" control={<Radio />} label="Export" />
                <FormControlLabel value="Domestic" control={<Radio />} label="Domestic" />
              </RadioGroup>
            </Box>

            {/* Customer / Location / State / Contact */}
            <Box gridColumn="span 3">
              <SelectControl name="customerId" label="Customer" value={form.customerId}
                options={lookups.customers.map((c: any) => ({ value: String(c.itemno).trim(), label: c.customer, }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="locationId" label="Location" value={form.locationId}
                options={lookups.Locations.map((l: any) => ({ value: l.location_id.toString(), label: l.location }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="state" label="State" value={form.state}
                options={lookups.States.map((s: any) => ({ value: s.state, label: s.state }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="contactName" label="Contact Name" value={form.contactName}
                options={lookups.Contacts.map((c: any) => ({ value: c.contact_id.toString(), label: c.contactName }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <TextField label="Email Address" value={form.email11} disabled fullWidth size="small" />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl
                name="toolId"
                label="Tool Name"
                value={form.toolId || ""}
                onChange={(e) => {
                  handleChange(e); // keeps toolId updated
                  // get selected text
                  const selectedOption = lookups.StageTools.find(
                    (t: any) => t.idno.toString() === e.target.value
                  );
                  // update form.tool with label
                  setForm((prev) => ({
                    ...prev,
                    tool: selectedOption?.tools || ""
                  }));
                }}

                options={lookups.StageTools.map((t: any) => ({
                  value: t.idno.toString(),
                  label: t.tools,
                }))}
                required
                height={40}
              />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl
                name="taskId"
                label="Task"
                value={form.taskId || ""}
                onChange={handleChange}
                options={lookups.HOPCTasks.map((t: any) => ({
                  value: t.itemnumber.toString(),
                  label: t.tasktype,
                }))}
                required
                height={40}
              />
            </Box>

            {/* Experience */}
            <Box gridColumn="span 2">
              <TextField label="Experience From" name="expFrom" value={form.expFrom} onChange={handleNumericChange} required size="small" />
            </Box>

            <Box gridColumn="span 1">
              <TextField label="To" name="expTo" value={form.expTo} onChange={handleNumericChange} required size="small" />
            </Box>

            <Box gridColumn="span 2">
              <TextField label="No of Resources" type="number" name="noOfResources" value={form.noOfResources}
                onChange={handleChange} required size="small" />
            </Box>

            {/* Profile req date Date */}
            <Box gridColumn="span 2">
              <TextField type="date" label="Profile Request Last Date"
                name="profReqLastDate"
                value={form.profReqLastDate}
                onChange={handleChange} InputLabelProps={{ shrink: true }}
                size="small"
                required
              />
            </Box>

            <Box gridColumn="span 2">
              <TextField type="date" label="Tentative Start Date"
                name="tentStartDate"
                value={form.tentStartDate || ""}
                onChange={(e) => {
                  const value = e.target.value; // always yyyy-mm-dd from <input type="date">
                  setForm((p) => ({ ...p, tentStartDate: value }));
                }} InputLabelProps={{ shrink: true }}
                size="small"
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
                height={40}
              />
            </Box>

            <Box gridColumn="span 5" display="flex" gap={2} alignItems="flex-end">
              <Box flex={1}>
                <Typography>Onsite Duration</Typography>
                <RadioGroup row sx={{ justifyContent: "space-evenly", border: "1px solid #ccc", borderRadius: "8px", padding: "6px", }} name="onsiteDurationType" value={form.onsiteDurationType} onChange={handleChange}>
                  <FormControlLabel value="1" control={<Radio />} label="Days" />
                  <FormControlLabel value="2" control={<Radio />} label="Months" />
                </RadioGroup>
              </Box>
              <Box width={110}>
                <TextField type="number" size="small" onChange={handleTwoDigitNumber} name="onsiteDuration"
                  label={form.onsiteDurationType === "1" ? "In Days" : "In Months"}
                  value={form.onsiteDuration}
                  required />
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
                <TextField size="small" label="Hourly Rate" name="hourlyReate" onChange={handleHourlyRateChange} value={form.hourlyReate} InputLabelProps={{ shrink: true }} required />
              </Box>
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="salesresponsibilityid" label="Sales Responsibility"
                value={form.salesresponsibilityid}
                options={lookups.SalesManagers.map((e: any) => ({ value: e.id, label: e.name }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="completeresponsibilityid" label="Complete Responsibility"
                value={form.completeresponsibilityid}
                // options={allCompleteResp}
                options={lookups.HOPCManagers.map((e: any) => ({ value: e.hopc1id, label: e.hopc1name }))}
                onChange={handleChange} required height={40} />
            </Box>

            <Box gridColumn="span 3">
              <SelectControl name="referenceBy" label="Reference By"
                value={form.referenceBy}
                options={lookups.AllActiveEmployees.map((e: any) => ({
                  value: e.name,
                  label: e.name,
                }))}
                onChange={handleChange} height={40} />
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
            <Box gridColumn="span 2" textAlign="center" mt={3}>
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