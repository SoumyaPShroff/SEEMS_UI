import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, TextField, Button } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import Label from "../../components/resusablecontrols/Label";
import TextControl from "../../components/resusablecontrols/TextControl";
import CompactRadioGroup from "../../components/resusablecontrols/CompactRadioGroup";
import { baseUrl } from "../../const/BaseUrl";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { standardInputStyle } from "./styles/standardInputStyle";
import { width } from "@mui/system";

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
  hourlyRateType: string;
  hourlyReate: string;
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
  toolId: string;
  tool: string;
  quotation_request_lastdate?: string;

  //added
  jobnames: string;               // ✅ ADD THIS
  inputreceivedthru: string;
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

// const standardInputStyle: React.CSSProperties = {
//   width: "100%",
//   height: 34,
//   border: "1px solid #cfd8e3",
//   borderRadius: 6,
//   padding: "0 10px",
//   fontSize: 13,
//   boxSizing: "border-box",
//   backgroundColor: "#fff",
//   marginTop: 2,
// };
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

    //added
    jobnames: "",
    inputreceivedthru: "",
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
          tool: e.tool || "",
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
    //fd.append("toolId", String(form.toolId));
    fd.append("toolId", String(Number(form.toolId)));
    fd.append("tool", form.tool);
    //fd.append("taskId", form.taskId);
    fd.append("taskId", String(Number(form.taskId)));

    // fd.append("expFrom", String(form.expFrom));
    // fd.append("expTo", String(form.expTo));
    // fd.append("noOfResources", form.noOfResources);
    fd.append("expFrom", String(Number(form.expFrom)));
    fd.append("expTo", String(Number(form.expTo)));
    fd.append("noOfResources", String(Number(form.noOfResources)));

    //fd.append("tentStartDate", form.tentStartDate);
    fd.append("tentStartDate", new Date(form.tentStartDate).toISOString());
    // fd.append("onsiteDurationType", form.onsiteDurationType);
    // fd.append("onsiteDuration", form.onsiteDuration);
    // fd.append("hourlyRateType", String(form.hourlyRateType));
    // fd.append("hourlyReate", form.hourlyReate);
    fd.append("logistics", String(Number(form.logistics)));
    fd.append("onsiteDurationType", String(Number(form.onsiteDurationType)));
    fd.append("hourlyRateType", String(Number(form.hourlyRateType)));
    fd.append("hourlyReate", String(Number(form.hourlyReate)));
    fd.append("onsiteDuration", String(Number(form.onsiteDuration)));
    // fd.append("profReqLastDate", form.profReqLastDate);
    fd.append("profReqLastDate", new Date(form.profReqLastDate).toISOString());
    // fd.append("quotation_request_lastdate", form.profReqLastDate);
    fd.append(
      "quotation_request_lastdate",
      new Date(form.profReqLastDate).toISOString()
    );
    fd.append("salesresponsibilityid", form.salesresponsibilityid);
    fd.append("completeresponsibilityid", form.completeresponsibilityid);
    fd.append("type", form.type);
    fd.append("enquirytype", "ONSITE");
    fd.append("si", form.SI || "");
    fd.append("pi", form.PI || "");

    // fd.append("toolLicense", form.toolLicense);
    fd.append("toolLicense", String(Number(form.toolLicense)));
    fd.append("createdBy", loginUser);
    fd.append("createdOn", new Date().toISOString());
    //fd.append("logistics", form.logistics);
    fd.append("remarks", form.remarks);
    fd.append("referenceBy", form.referenceBy);

    // email trigger lists
    // const toList = buildEmailRecipientList();
    //fd.append("ToMailList", JSON.stringify(toList));  // send array as JSON
    const toList = buildEmailRecipientList();
    fd.append("ToMailList", JSON.stringify(toList.length ? toList : ["noreply@system"]));

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
      toast.success(
        <div>
          {isEditMode ? "Onsite Enquiry Updated" : "Onsite Enquiry Added"}
          <Button
            style={{ marginLeft: "10px", color: "#273992", textDecoration: "underline" }}
            onClick={() => navigate("/Home/ViewAllEnquiries")}
          >
            Return to ViewAllEnquiries
          </Button>
        </div>,
        { autoClose: false }   // 🔥 toast stays until user closes or clicks button
      );

    } catch (error) {
      console.error("NETWORK ERROR:", error);
      toast.error("❌ Failed to save enquiry");
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
    <Box
      sx={{
        maxWidth: 850,
        width: "100%",
        mx: "auto",
        mt: isEditMode ? 18 : 0.9,
        px: { xs: 2, md: 0 },
        fontFamily: "Arial",
      }}
    >
      <Card
        sx={{
          width: "100%",
          m: "auto",
          mt: 1.25,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          "& .MuiTypography-root, & .MuiInputBase-input, & .MuiFormControlLabel-label, & .MuiInputLabel-root": {
            fontFamily: "Arial",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.5 } }}>
          <Typography
            variant="h5"
            sx={{ textAlign: "center", mb: 2, fontWeight: 700, color: "#0f4ea6", letterSpacing: "0.01em", fontSize: { xs: "1.05rem", md: "1.22rem" } }}
          >
            {isEditMode ? "Edit ONSITE Enquiry" : "Add ONSITE Enquiry"}
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(12, 1fr)" }, gap: 1.5, alignItems: "start" }}>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Card sx={{ borderRadius: 2, border: "1px solid #cfe0fa", boxShadow: "0 8px 16px rgba(33, 75, 149, 0.1)", background: "linear-gradient(160deg, #ffffff 0%, #f3f8ff 100%)" }}>
                <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>CUSTOMER DETAILS</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, columnGap: 1.5, rowGap: 2, alignItems: "start" }}>
                    <Box>
                      <SelectControl
                        name="customerId"
                        label="Customer"
                        value={form.customerId}
                        options={lookups.customers.map((c: any) => ({ value: String(c.itemno).trim(), label: c.customer }))}
                        onChange={handleChange}
                        required
                      //  height={34}
                      />
                    </Box>
                    <Box>
                      <SelectControl
                        name="locationId"
                        label="Location"
                        value={form.locationId}
                        options={lookups.Locations.map((l: any) => ({ value: l.location_id.toString(), label: l.location }))}
                        onChange={handleChange}
                        required
                      // height={34}
                      />
                    </Box>
                    <Box>
                      <SelectControl
                        name="state"
                        label="State"
                        value={form.state}
                        options={lookups.States.map((s: any) => ({ value: s.state, label: s.state }))}
                        onChange={handleChange}
                        required
                      //   height={34}
                      />
                    </Box>
                    <Box>
                      <SelectControl
                        name="contactName"
                        label="Contact Name"
                        value={form.contactName}
                        options={lookups.Contacts.map((c: any) => ({ value: c.contact_id.toString(), label: c.contactName }))}
                        onChange={handleChange}
                        required
                      />
                    </Box>
                    <Box>
                      <Label text="Email Address" bold />
                      <TextControl name="emailAddress" value={form.email11 || ""} onChange={() => { }} disabled={true} style={standardInputStyle} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Card sx={{ borderRadius: 2, border: "1px solid #cfe0fa", boxShadow: "0 8px 16px rgba(33, 75, 149, 0.1)", background: "linear-gradient(160deg, #ffffff 0%, #edf5ff 100%)" }}>
                <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>ENQUIRY DETAILS</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, columnGap: 1.5, rowGap: 1.5, alignItems: "start" }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, columnGap: 1.5, rowGap: 1.8 }}>
                      <Box sx={{ width: "100%" }}>
                        <TextField
                          label="Board Ref"
                          name="jobnames"
                          value={form.jobnames || ""}
                          onChange={handleChange}
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <SelectControl
                          name="toolId"
                          label="Tool Name"
                          value={form.toolId || ""}
                          onChange={(e) => {
                            handleChange(e);
                            const selectedOption = lookups.StageTools.find(
                              (t: any) => t.idno.toString() === e.target.value
                            );
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
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
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
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
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
                      <Box sx={{ width: "100%" }}>
                        <TextField
                          label="Experience From"
                          name="expFrom"
                          value={form.expFrom}
                          onChange={handleNumericChange}
                          required
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <TextField
                          label="To"
                          name="expTo"
                          value={form.expTo}
                          onChange={handleNumericChange}
                          required
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <TextField
                          label="No of Resources"
                          type="number"
                          name="noOfResources"
                          value={form.noOfResources}
                          onChange={handleChange}
                          required
                          size="small"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <TextField type="date" label="Profile Request Last Date"
                          name="profReqLastDate"
                          value={form.profReqLastDate}
                          onChange={handleChange} InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                          required
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <TextField type="date" label="Tentative Start Date"
                          name="tentStartDate"
                          value={form.tentStartDate || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            setForm((p) => ({ ...p, tentStartDate: value }));
                          }} InputLabelProps={{ shrink: true }}
                          size="small"
                          fullWidth
                          sx={{ "& .MuiInputLabel-root": { fontWeight: 700 } }}
                          required />
                      </Box>
                      <Box sx={{ width: "100%" }}>
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
                          required
                        />
                      </Box>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr", rowGap: 1.2, justifyItems: "start" }}>
                      <Box sx={{ width: "100%", mt: -3 }}>
                        <Label text="Tool License" bold />
                        <CompactRadioGroup
                          name="toolLicense"
                          value={form.toolLicense}
                          onChange={handleChange}
                          options={[{ value: "1", label: "With" }, { value: "2", label: "Without" }]}
                          sx={{ "& .MuiRadioGroup-root": { justifyContent: "flex-start", gap: 5 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Label text="Logistics" bold />
                        <CompactRadioGroup
                          name="logistics"
                          value={form.logistics}
                          onChange={handleChange}
                          options={[{ value: "1", label: "Customer" }, { value: "2", label: "Sienna ECAD" }]}
                          sx={{ "& .MuiRadioGroup-root": { justifyContent: "flex-start", gap: 1.5 } }}
                        />
                      </Box>
                      <Box sx={{ width: "100%" }}>
                        <Label text="Type" bold />
                        <CompactRadioGroup
                          name="type"
                          value={form.type}
                          onChange={handleChange}
                          options={[{ value: "Export", label: "Export" }, { value: "Domestic", label: "Domestic" }]}
                          sx={{ "& .MuiRadioGroup-root": { justifyContent: "flex-start", gap: 3.6 } }}
                        />
                      </Box>
                      {/* fr means fractional unit of the available space, so 1fr takes up all available space, and 2fr would take up twice as much as 1fr. 
                       This allows the first column to be wider than the second, giving more room for the radio buttons and labels,
                        while still allowing the second column to adjust based on the content
                         (like the TextField for onsite duration).*/}
                      <Box sx={{ display: "grid", gridTemplateColumns: "200px 1fr", columnGap: 1, alignItems: "start", justifyContent: "start" }}>
                        <Box >
                          <Label text="Onsite Duration" bold />
                          <CompactRadioGroup
                            name="onsiteDurationType"
                            value={form.onsiteDurationType}
                            onChange={handleChange}
                            options={[{ value: "1", label: "Days" }, { value: "2", label: "Months" }]}
                            sx={{ "& .MuiRadioGroup-root": { justifyContent: "flex-start", gap: 4.5 } }}
                          />
                        </Box>
                        <TextField type="number" sx={{ mt: 3, width: 110, "& .MuiOutlinedInput-root": { height: 30, borderRadius: "8px" } }} onChange={handleTwoDigitNumber} name="onsiteDuration"
                          label={form.onsiteDurationType === "1" ? "In Days" : "In Months"}
                          value={form.onsiteDuration}
                          required
                          InputLabelProps={{ shrink: true }} />
                      </Box>
                      <Box sx={{ display: "grid", gridTemplateColumns: "200px 1fr", columnGap: 1, alignItems: "start", justifyContent: "start" }}>
                        <Box >
                          <Label text="Currency" bold />
                          <CompactRadioGroup
                            name="hourlyRateType"
                            value={form.hourlyRateType}
                            onChange={handleChange}
                            options={[{ value: "1", label: "INR" }, { value: "2", label: "USD" }, { value: "3", label: "EURO" }]}
                          />
                        </Box>
                        <TextField size="small" sx={{ mt: 3, width: 100, "& .MuiOutlinedInput-root": { height: 30, borderRadius: "8px", width: 110 } }} label="Hourly Rate" name="hourlyReate" onChange={handleHourlyRateChange} value={form.hourlyReate} InputLabelProps={{ shrink: true }} required />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ gridColumn: "1 / -1" }}>
              <Card sx={{ borderRadius: 2, border: "1px solid #cfe0fa", boxShadow: "0 8px 16px rgba(33, 75, 149, 0.1)", background: "linear-gradient(160deg, #ffffff 0%, #f1f8ff 100%)" }}>
                <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>ASSIGNMENT & UPLOAD</Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, columnGap: 1.5, rowGap: 1.8, alignItems: "start" }}>
                    <Box>
                      <SelectControl name="salesresponsibilityid" label="Sales Responsibility"
                        value={form.salesresponsibilityid}
                        options={lookups.SalesManagers.map((e: any) => ({ value: e.id, label: e.name }))}
                        onChange={handleChange} />
                    </Box>
                    <Box>
                      <SelectControl name="completeresponsibilityid" label="Complete Responsibility"
                        value={form.completeresponsibilityid}
                        options={lookups.HOPCManagers.map((e: any) => ({ value: e.hopc1id, label: e.hopc1name }))}
                        onChange={handleChange} />
                    </Box>
                    <Box>
                      <SelectControl name="referenceBy" label="Reference By"
                        value={form.referenceBy}
                        options={lookups.AllActiveEmployees.map((e: any) => ({
                          value: e.name,
                          label: e.name,
                        }))}
                        onChange={handleChange} />
                    </Box>
                    <Box>
                      <Label text="Remarks" bold />
                      <TextControl
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={2}
                        style={{ ...standardInputStyle, padding: "8px", height: "60px" }}

                      />

                    </Box>
                    <Box>
                      <Box onClick={() => document.getElementById("fileInput")?.click()}
                        sx={{
                          border: "2px dashed #9ebcf0",
                          borderRadius: 2,
                          p: 1.8,
                          textAlign: "center",
                          bgcolor: "#f5f9ff",
                          cursor: "pointer",
                          minHeight: 96,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}>
                        <CloudUploadIcon sx={{ fontSize: 28, color: "#2196f3", alignSelf: "center" }} />
                        <Typography variant="caption" sx={{ mt: 0.6 }}>{file
                          ? file.name
                          : isEditMode && form.uploadedfilename
                            ? form.uploadedfilename
                            : "Click or Drag a file to upload"}</Typography>
                        <input hidden id="fileInput" type="file" onChange={handleFileChange} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                      <Button variant="contained" onClick={handleSubmit} sx={{ px: 5, height: 38, borderRadius: 1.5, fontSize: "0.82rem" }}>
                        {isEditMode ? "UPDATE" : "ADD"}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </CardContent>
        <ToastContainer />
      </Card>
    </Box>
  );
};
export default OnsiteEnquiry;
