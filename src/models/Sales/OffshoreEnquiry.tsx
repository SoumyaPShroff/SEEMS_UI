import React, { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { FormGroup, TextField, Button, Card, CardContent, Typography, Box, FormControlLabel, Checkbox, RadioGroup, Radio,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface Customer { itemno: string; customer: string; }

interface Employee { iDno: string; name: string; emailId?: string; }

interface Manager { HOPC1ID: string; HOPC1NAME: string; emailID?: string; }

interface Location { location_id: string; location: string; address?: string; }

interface Contact { contact_id: string; contactName: string; email11?: string; location_id?: string; customer_id?: string; address?: string; }

interface State { state: string; }

interface SalesManager { id: string; name: string; emailID?: string; }

interface NPIManager { iDno: string; name: string; emailId?: string; } 

interface LookupData {
   customers: Customer[];
   AllActiveEmployees: Employee[];
   AnalysisManagers: Manager[];
   SalesManagers: SalesManager[];
   designMngrs: Manager[];
   salesnpiusers: NPIManager[];
   tool: string[];
   Locations: Location[];
   Contacts: Contact[];
   States: State[];
   PCBTools: string[];
}

interface EnquiryForm {
   enquirytype: string;
   customerId: string;
   jobnames: string;
   contactName: string;
   location: string;
   inputreceivedthru: string;
   tm: string;
   currency: number;
   type: string;
   tool: string;
   quotation_request_lastdate: string;
   govt_tender: string;
   completeresponsibilityid: string;
   salesresponsibilityid: string;
   referenceBy: string | null;
   remarks: string | null;
   layout: string[];
   analysis: string[];
   va: string[];
   npi: string[];
   layoutbyid: string;
   analysisbyid: string;
   npibyid: string;    //referring va only but tbale field is npibyid
   npiNewbyid: string;
   locationId: string;
   createdBy: string;
   status: string;
   state: string;
   email11: string;
   address?: string;
   completeResp?: string; //edit
   uploadedfilename?: string; //edit
   [index: string]: any;
}
type Option = {
   value: string;
   label: string;
};

function isManager(obj: any): obj is Manager {
   return obj && "HOPC1ID" in obj;
}

function isEmployee(obj: any): obj is Employee {
   return obj && "iDno" in obj;
}

function isNPIManager(obj: any): obj is NPIManager {
   return obj && "iDno" in obj;
}

const OffshoreEnquiry: React.FC = () => {
   const loginUser = sessionStorage.getItem("SessionUserName") || "guest";
   const loginId = sessionStorage.getItem("SessionUserID") || "guest";
   const navigate = useNavigate();
   const { enquiryNo } = useParams();
   const isEditMode = Boolean(enquiryNo);
   const layoutHideForAdd = ["QA/CAM", "DFA", "Fabrication", "Testing"];

   const [form, setForm] = useState<EnquiryForm>({
      enquirytype: "OFFSHORE",
      customerId: "",
      jobnames: "",
      contactName: "",
      location: "",
      inputreceivedthru: "",
      tm: "",
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
      layoutbyid: "",
      analysisbyid: "",
      npibyid: "",
      npiNewbyid: "",
      locationId: "",
      createdBy: loginUser,
      status: "Open",
      uploadedfilename: "",
      email11: "",
      state: "",
      completeResp: "", //edit
   });

   const isInitialLoad = useRef(true); //edit

   const [lookups, setLookups] = useState<LookupData>({
      customers: [],
      AllActiveEmployees: [],
      AnalysisManagers: [],
      SalesManagers: [],
      designMngrs: [],
      salesnpiusers: [],
      PCBTools: [],
      tool: [],
      Locations: [],
      Contacts: [],
      States: [],
   });

   const [file, setFile] = useState<File | null>(null);
   const [loading, setLoading] = useState(false);

   // fields backend requires, but UI does not collect
   const dtoBlankDefaults = {
      layoutbyid: "", npibyid: "", analysisbyid: "", npiNewbyid: "",
      pi: "NO", si: "NO", dfa: "NO", dfm: "NO", fpg: "NO", asmb: "NO", pcba: "NO", qacam: "NO",
      design: "NO", library: "NO", layout_fab: "NO", layout_testing: "NO", layout_others: "NO",
      emi_net_level: "NO", emi_system_level: "NO", thermal_board_level: "NO", thermal_system_level: "NO",
      hardware: "NO", VA_Assembly: "NO", DesignOutSource: "NO", npi_fab: "NO", npi_testing: "NO", npi_others: "NO",vaMech: "NO",
      NPINew_Fab: "NO", NPINew_Testing: "NO", NPINew_Assbly: "NO", NPINew_BOMProc: "NO",
      npinew_jobwork: "NO", tool: "", software: "NO", analysis_others: "NO", status: "Open",
      quotation_request_lastdate: new Date().toISOString(), createdOn: new Date().toISOString(), enquiryno: "AUTO",
      remarks: "", referenceBy: "",
   };

   // 🔹 Fetch dropdown data
   useEffect(() => {
      const fetchLookups = async () => {
         try {
            const [custRes, empRes, analysisRes, salesisRes, designRes, npiRes, PCBToolsRes, LocationsRes, ContactsRes, StatesRes] = await Promise.all([
               fetch(`${baseUrl}/api/Sales/customers`),
               fetch(`${baseUrl}/AllActiveEmployees`),
               fetch(`${baseUrl}/AnalysisManagers`),
               fetch(`${baseUrl}/SalesManagers`),
               fetch(`${baseUrl}/DesignManagers`),
               fetch(`${baseUrl}/SalesNpiUsers`),
               fetch(`${baseUrl}/api/Job/PCBTools`),
               fetch(`${baseUrl}/api/Sales/customerlocations`),  
               fetch(`${baseUrl}/api/Sales/customercontacts`),  
               fetch(`${baseUrl}/api/Sales/States`),
            ]);
            const [customers, AllActiveEmployees, AnalysisManagers, SalesManagers, designMngrs, salesnpiusers, PCBTools, Locations, Contacts, States] =
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
                  StatesRes.json(),
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
               States,
               tool: [],
            });
         } catch (err) {
            console.error("Error fetching lookups:", err);
         }
      };
      fetchLookups();
   }, []);

   useEffect(() => {
      if (!isEditMode) return;
      if (lookups.customers.length === 0) return;


      if (!lookups.customers.length) return; //edit
      if (!isInitialLoad.current) return; // do not reload //edit

      const loadEnquiry = async () => {
         try {
            const res = await fetch(`${baseUrl}/api/Sales/EnquiryDetailsByEnquiryno/${enquiryNo}`);
            if (!res.ok) throw new Error("Failed to fetch enquiry");
            const data = await res.json();
            const enquiry = Array.isArray(data) ? data[0] : data;

            if (!enquiry) return;

            // Fetch dependent lookups first
            await fetchCustomerLocations(enquiry.customer_id);
            await fetchCustomerContacts(enquiry.customer_id, enquiry.location_id);

            // Find contact to get emailaddress
            const selectedContact = lookups.Contacts.find(
               (c) => c.contact_id.toString() === enquiry.contact_id.toString()
            );

            //based on location, address filled
            const selectedLoc = lookups.Locations.find(
               (l) => l.location_id.toString() === enquiry.location_id.toString()
            );

            // 🔹 THEN set your form
            setForm((prev) => ({
               ...prev,
               enquirytype: enquiry.enquirytype || "OFFSHORE",
               customerId: String(enquiry.customer_id),
               locationId: String(enquiry.location_id),
               contactName: String(enquiry.contact_id),
               jobnames: enquiry.jobnames || "",
               inputreceivedthru: enquiry.inputreceivedthru || "",
               tm: enquiry.tm || "",
               type: enquiry.type || "Export",
               currency: Number(enquiry.currency_id) || 1,
               tool: enquiry.tool || "",
               quotation_request_lastdate: enquiry.quotation_request_lastdate?.substring(0, 10),
               govt_tender: enquiry.govt_tender || "NO",
               completeresponsibilityid: enquiry.completeresponsibilityid || "",
               salesresponsibilityid: enquiry.salesresponsibilityid || "",
               remarks: enquiry.remarks || "",
               referenceBy: enquiry.referenceBy || "",
               state: enquiry.state || enquiry.statename || "",
               email11: selectedContact?.email11 || "",
               address: selectedLoc?.address || "",
               layout: getCheckedArrayFromAPI(enquiry, "layout"),
               analysis: getCheckedArrayFromAPI(enquiry, "analysis"),
               va: getCheckedArrayFromAPI(enquiry, "va"),
               npi: getCheckedArrayFromAPI(enquiry, "npi"),
               layoutbyid: enquiry.layoutbyid || "",
               analysisbyid: enquiry.analysisbyid || "",
               npibyid: enquiry.npibyid || "",
               npiNewbyid: enquiry.npiNewbyid || "",
               uploadedfilename: enquiry.uploadedfilename,
            }));

         } catch (err) {
            console.error(err);
         }
      };

      loadEnquiry();
   }, [isEditMode, lookups.customers.length]);

   useEffect(() => {
      if (!isEditMode) return;
      if (!form.customerId) return;
      fetchCustomerLocations(form.customerId);
   }, [form.customerId]);

   useEffect(() => {
      if (!isEditMode) return;
      if (!form.locationId) return;
      if (!form.customerId || !form.locationId) return;

      fetchCustomerContacts(form.customerId, form.locationId);
   }, [form.locationId]);

   useEffect(() => {
      if (!form.contactName) return;
      const selected = lookups.Contacts.find(x => x.contact_id.toString() === form.contactName);
      if (!selected) return;
      // ✔ Email comes from contact
      // ❌ Address should NEVER come from contact
      setForm(prev => ({
         ...prev,
         email11: selected.email11 ?? "",
         address: prev.address,   // KEEP LOCATION ADDRESS ALWAYS
      }));
   }, [form.contactName]);

   useEffect(() => {
      const combined = [
         form.layoutbyid,
         form.analysisbyid,
         form.npibyid,
         form.npiNewbyid,
      ]
         .filter(Boolean)
         .join(", ");

      setForm((prev) => ({ ...prev, completeResp: combined }));
   }, [form.layoutbyid, form.analysisbyid, form.npibyid, form.npiNewbyid]);

   const fetchCustomerLocations = async (customerId: string) => {
      try {
         const res = await fetch(`${baseUrl}/api/Sales/customerlocations?customerId=${customerId}`);
         const data = await res.json();
         //edit mode contact was not appearing in first load
         setLookups((prev) => ({ ...prev, Locations: data, Contacts: isEditMode ? prev.Contacts : [] }));  // 👈 keep contacts while editing
      } catch (err) {
         console.error(err);
         setLookups((prev) => ({ ...prev, Locations: [], Contacts: [] }));
      }
   };

   const fetchCustomerContacts = async (customerId: string, locationId: string) => {
      try {
         const res = await fetch(`${baseUrl}/api/Sales/customercontacts?customer_id=${customerId}&location_id=${locationId}`);
         const data = await res.json();
         setLookups((prev) => ({ ...prev, Contacts: data }));

         // 🔥 FIX: When only one contact exists, auto-select it AND fill address + email
         if (!isEditMode && data.length === 1) {
            const c = data[0];

            setForm(prev => ({
               ...prev,
               contactName: c.contact_id.toString(),
               email11: c.email11 || "",
               address: prev.address,   // keep location address ALWAYS
            }));
         }
      } catch (err) {
         console.error(err);
         setLookups((prev) => ({ ...prev, Contacts: [] }));
      }
   };

   const getCompleteRespOptions = () => {
      const selectedIds = [
         form.layoutbyid,
         form.analysisbyid,
         form.npibyid,
         form.npiNewbyid,
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
            const emp = allEmployees.find((e) => {
               if (isManager(e)) return e.HOPC1ID === id;
               return e.iDno === id;
            });

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
      const filtered = options.filter((o): o is Option => o !== null);

      const unique = Array.from(
         new Map(filtered.map(opt => [opt.value, opt])).values()
      );

      //  return unique;
      return unique as Option[]; //returns (Option|null)[] filter nulls
   };

   const getCheckedArrayFromAPI = (data: any, section: string): string[] => {
      const mapSection: any = {
         layout: {
            design: "Design",
            library: "Library",
            qacam: "QA/CAM",
            dfa: "DFA",
            dfm: "DFX",
            layout_fab: "Fabrication",
            layout_testing: "Testing",
            layout_others: "Others",
         },
         analysis: {
            si: "SI",
            pi: "PI",
            emi_net_level: "EMI Net Level",
            emi_system_level: "EMI System Level",
            thermal_board_level: "Thermal Board Level",
            thermal_system_level: "Thermal System Level",
            analysis_others: "Others",
         },
         va: {
            npi_fab: "Fabrication",
            asmb: "Assembly",
            hardware: "Hardware",
            software: "Software",
            fpg: "FPGA",
            npi_testing: "Testing",
            npi_others: "Others",
            DesignOutSource: "Design Outsourced",
            vaMech: "Mechanical",
         },
         npi: {
            // NPINew_BOMProc: "BOM Procurement",
            // NPINew_Fab: "ATS-Fabrication",
            // NPINew_Assbly: "ATS-Assembly",
            // NPINew_Testing: "ATS-Testing",
            // npinew_jobwork: "Job Work",
             npiNew_BOMProc: "BOM Procurement",
            npiNew_Fab: "ATS-Fabrication",
            npiNew_Assbly: "ATS-Assembly",
            npiNew_Testing: "ATS-Testing",
            npinew_jobwork: "Job Work",
         }
      };

      const fields = mapSection[section];
      const arr: string[] = [];

      Object.entries(fields).forEach(([apiField, label]) => {
         if (data[apiField] === "YES") arr.push(label as string);
      });

      return arr;
   };

   const handleChange = async (e: any) => {
      const { name, value } = e.target as HTMLInputElement;
      // Prepare an updated form object (no state reset yet)
      let updatedForm = { ...form, [name]: value };

      if (name === "currency") {
         // Convert string "1" | "2" | "3" to number 1 | 2 | 3
         setForm((p) => ({ ...p, currency: Number(value) }));
         return;
      }
      if (name === "customerId") {
         // If we're in edit mode and a customer is already selected
         if (isEditMode && form.customerId && form.customerId !== value) {
            const confirmChange = window.confirm(
               "Changing the customer will reset Location, Contact, and related fields. Do you want to continue?"
            );

            if (!confirmChange) {
               toast.info("Customer change cancelled");
               return;
            }
         }
         //avoid using form, use prev
         setForm(prev => ({
            ...prev,
            customerId: value,
            locationId: "",
            contactName: "",
            email11: "",
            address: "",
         }));
         await fetchCustomerLocations(value);
         return;
      }

      if (name === "locationId") {
         const loc = lookups.Locations.find(
            (l) => l.location_id.toString() === value.toString()
         );
         setForm(prev => ({
            ...prev,
            locationId: value,
            address: loc?.address || "",   // ✔ address comes from location
            contactName: "",
            email11: "",
         }));

         await fetchCustomerContacts(form.customerId, value);
         return;
      }

      if (name === "contactName") {
         const contact = lookups.Contacts.find(
            (c) => c.contact_id.toString() === value.toString()
         );
         setForm(prev => ({
            ...prev,
            contactName: value,
            email11: contact?.email11 || "",
            // DO NOT TOUCH ADDRESS HERE
            address: prev.address,   // 🔥 keep the location-based address
         }));
         return;
      }

      const responsibilityFields = ["layoutbyid", "analysisbyid", "npibyid", "npiNewbyid"];
      //auto update completeresp when any responsibility field changes
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
                  //(e: any) => e.hopC1ID === id || e.iDno === id
                  (e: any) => {
                     if (isManager(e)) return e.HOPC1ID === id;
                     if (isEmployee(e)) return e.iDno === id;
                     if (isNPIManager(e)) return e.iDno === id;
                     return false;
                  }
               );
               //  return emp ? emp.hopC1NAME || emp.name : null;
               return {
                  value: isManager(emp) ? emp.HOPC1ID : isEmployee(emp) ? emp.iDno : "",
                  label: isManager(emp) ? emp.HOPC1NAME : isEmployee(emp) ? emp.name : "Unknown"
               };
            })
            .filter(Boolean);

         updatedForm = {
            ...updatedForm,
            completeResp: selectedNames.join(", "),
         }
      };
      setForm(updatedForm);
   };


   const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) setFile(e.target.files[0]);
   };

   const handleCheckboxChange = (section: string, value: string, checked: boolean) => {
      setForm((prev) => {
         const items = new Set(prev[section] || []);

         if (checked) items.add(value);
         else items.delete(value);

         const updated = { ...prev, [section]: Array.from(items) };

         // Clear responsibility if all items are removed
         if (items.size === 0) {
            switch (section) {
               case "layout":
                  updated.layoutbyid = "";
                  break;
               case "analysis":
                  updated.analysisbyid = "";
                  break;
               case "va":
                  updated.npibyid = "";
                  break;
               case "npi":
                  updated.npiNewbyid = "";
                  break;
            }
         }
         return updated;
      });
   };

   // --- Scope configuration ---
   const scopeConfig = [
      {
         section: "Layout",
         field: "layout",
         responsibilityField: "layoutbyid",
         checkboxes: ["Design", "Library", "QA/CAM", "DFA", "DFX", "Fabrication", "Testing", "Others"],
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
         checkboxes: ["Fabrication", "Assembly", "Hardware", "Software", "FPGA", "Testing", "Others", "Design Outsourced", "Mechanical"],
         responsibilityOptions: lookups.designMngrs,     //use designmanagers for VA responsibility
         isManager: true,
      },
      {
         section: "ATS",
         field: "npi",
         responsibilityField: "npiNewbyid",
         checkboxes: ["BOM Procurement", "ATS-Fabrication", "ATS-Assembly", "Job Work", "ATS-Testing"],
         responsibilityOptions: lookups.salesnpiusers,
         isManager: false,
      },
   ];

   const isResponsibilitySelected = !!(form.layoutbyid || form.analysisbyid || form.npibyid || form.npiNewbyid);
   // Utility: normalize email safely without modifying interfaces
   const getUserEmail = (
      u: Employee | Manager | SalesManager | NPIManager
   ): string | null => {
      const e = u as any;
      return (
         e.emailID ??
         e.EmailID ??
         e.emailId ??
         e.EmailId ??
         e.email ??
         e.Email ??
         null
      );
   };

   // Main function
   const buildEmailRecipientList = () => {
      const respIds = [
         form.layoutbyid,
         form.analysisbyid,
         form.npibyid,
         form.npiNewbyid,
      ].filter(Boolean);

      const allUsers: (Employee | Manager | SalesManager | NPIManager)[] = [
         ...lookups.designMngrs,
         ...lookups.AnalysisManagers,
         ...lookups.salesnpiusers,
         ...lookups.AllActiveEmployees,
         ...lookups.SalesManagers,
         ...lookups.salesnpiusers,
      ];

      const emails = respIds
         .map((id) => {
            // Identify correct user based on ID field
            const user = allUsers.find((u) => {
               if (isManager(u)) return String(u.HOPC1ID) === String(id);
               if (isEmployee(u)) return String(u.iDno) === String(id);
               if (isNPIManager(u)) return String(u.iDno) === String(id);
               return String((u as any).id) === String(id); // SalesManager
            });

            if (!user) return null;

            return getUserEmail(user);
         })
         .filter((e): e is string => Boolean(e));

      return [...new Set(emails)];
   };

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
         if (form.npi.length > 0 && !form.npiNewbyid) {
            toast.error("Please select NPI Responsibility");
            setLoading(false);
            return;
         }

         // 3️⃣ Merge defaults with current form
         const postPayload: any = {
            ...dtoBlankDefaults, ...form,
            remarks: form.remarks?.trim() === "" ? null : form.remarks,
            referenceBy: form.referenceBy?.trim() === "" ? null : form.referenceBy,
            tm: form.tm,
         };

         // 4️⃣ Map scope arrays to individual YES/NO fields
         // Layout
         const layoutMap: Record<string, string> = {
            Design: "design",
            Library: "library",
            "QA/CAM": "qacam",
            DFA: "dfa",
            DFX: "dfm",
            Fabrication: "asmb",
            Testing: "layout_testing",
            Others: "layout_others",
         };
         Object.entries(layoutMap).forEach(([label, field]) => {
            postPayload[field] = form.layout.includes(label) ? "YES" : "NO";
         });

         // Analysis
         const analysisMap: Record<string, string> = {
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
         const vaMap: Record<string, string> = {
            Fabrication: "npi_fab",
            Assembly: "asmb",
            "Design Outsourced": "DesignOutSource",
            Others: "npi_others",
            Hardware: "hardware",
            Software: "software",
            FPGA: "fpg",
            Testing: "npi_testing",
            Mechanical: "vaMech",
         };
         Object.entries(vaMap).forEach(([label, field]) => {
            postPayload[field] = form.va.includes(label) ? "YES" : "NO";
         });

         // NPI
         const npiMap: Record<string, string> = {
            "BOM Procurement": "NPINew_BOMProc",
            "ATS-Fabrication": "NPINew_Fab",
            "ATS-Assembly": "NPINew_Assbly",
            "ATS-Testing": "NPINew_Testing",
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
         formData.append("contact_id", postPayload.contactName);
         formData.append("location_id", postPayload.locationId);
         formData.append("type", postPayload.type);
         formData.append("currency_id", postPayload.currency);
         formData.append("inputreceivedthru", postPayload.inputreceivedthru);
         formData.append("salesresponsibilityid", postPayload.salesresponsibilityid);
         formData.append("completeresponsibilityid", postPayload.completeresponsibilityid);
         formData.append("govt_tender", postPayload.govt_tender);
         formData.append("quotation_request_lastdate", postPayload.quotation_request_lastdate);
         formData.append("createdBy", postPayload.createdBy);
         formData.append("referenceBy", postPayload.referenceBy || "");
         formData.append("appendreq", postPayload.appendreq);
         formData.append("Remarks", postPayload.remarks || "");
         formData.append("statename", postPayload.state || "");
         formData.append("tm", postPayload.tm || "");

         // if (isEditMode) formData.append("enquiryno", enquiryNo);
         if (isEditMode) formData.append("enquiryno", enquiryNo ?? "");

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
                  // formData.append(key, value ?? "");
                  formData.append(key, value == null ? "" : String(value));
               }
            }
         });

         // email trigger lists
         const toList = buildEmailRecipientList();
         formData.append("ToMailList", JSON.stringify(toList));  // send array as JSON

         // Optional CC list e.g. referenceBy or createdBy
         // 1️⃣ Collect Login IDs (not emails)
         const otherResp: string[] = [];

         if (form.completeResp) {
            otherResp.push(...form.completeResp.split(","));  // split multiple IDs
         }

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
         formData.append("CCMailList", JSON.stringify(ccList));

         // FILE UPLOAD
         if (file) {
            formData.append("file", file);
            formData.append("uploadedfilename", file.name);
         } else {
            formData.append("uploadedfilename", "");
         }
         const url = isEditMode ? `${baseUrl}/api/Sales/EditEnquiryData` : `${baseUrl}/api/Sales/AddEnquiryData`;
         //for Add - use POST, edit - PUT
         const res = await fetch(url, { method: isEditMode ? "PUT" : "POST", body: formData, });

         if (res.ok) {
            toast.success(
               <div>
                  {isEditMode ? "Enquiry Updated" : "Enquiry Added"}
                  <Button
                     style={{ marginLeft: "10px", color: "#fff", textDecoration: "underline" }}
                     onClick={() => navigate("/Home/ViewAllEnquiries")}
                  >
                     Return to ViewAllEnquiries
                  </Button>
               </div>,
               { autoClose: false }   // 🔥 toast stays until user closes or clicks button
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
      <Box
         sx={{
            maxWidth: "1100px",   // prevents horizontal stretching
            margin: "0 auto",     // centers the card
            padding: "40px",
            mt:  8,
         }}
      >
         <Card
            sx={{ width: "100%", m: "auto", mt: 3, p: 4,   borderRadius: 3,  boxShadow: "0px 4px 20px #6594b3ff"}}>
            <CardContent>
               <Typography
                  variant="h5"
                  sx={{ textAlign: "center",mb: 3, fontWeight: 700, color: "#1565c0",}}>
                  {isEditMode ? "Edit OFFSHORE Enquiry" : "Add OFFSHORE Enquiry"}
               </Typography>

               {/* --- Main Form Grid --- */}
               <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(12, 1fr)", }, gap: 2, alignItems: "center", }} >
                  {/* Row 1 */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="customerId"
                        label="Customer"
                        value={form.customerId}
                        options={lookups.customers.map((c) => ({
                           value: String(c.itemno).trim(),
                           label: c.customer,
                        }))}
                        onChange={handleChange}
                        required
                     />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="locationId"
                        label="Location"
                        value={form.locationId}
                        options={lookups.Locations.map(l => ({ value: l.location_id.toString(), label: l.location }))}
                        onChange={handleChange}
                        required
                        disabled={!form.customerId}
                     />
                  </Box>

               <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="state"
                        label="State"
                        value={form.state}
                        options={lookups.States.map(s => ({ value: s.state, label: s.state }))}
                        onChange={handleChange}
                        required
                     />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="contactName"
                        label="Contact Name"
                        value={form.contactName}
                        options={lookups.Contacts.map((c) => ({
                           value: c.contact_id.toString(),
                           label: c.contactName,
                        }))}
                        onChange={handleChange}
                        required
                        disabled={!form.locationId}
                     />
                  </Box>

                 <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <TextField
                        name="emailAddress"
                        label="Email Address"
                        value={form.email11}
                        disabled={true}
                        InputLabelProps={{ shrink: true }} // To keep label above even if empty and avoid overlapping pf placeholder or label with value
                     />
                  </Box>

                <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <TextField
                        label="Address"
                        name="address"
                        value={form.address}
                        multiline
                        rows={2}
                        fullWidth
                        disabled={true}
                        InputLabelProps={{ shrink: true }}
                     />
                  </Box>

                  {/* Row 2 */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <TextField
                        label="Board Ref"
                        name="jobnames"
                        value={form.jobnames}
                        onChange={handleChange}
                        size="small"
                     />
                  </Box>

                 <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
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
                        fullWidth
                     />
                  </Box>

                 <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="tm"
                        label="Billing Type"
                        value={form.tm || ""}
                        onChange={handleChange}
                        options={[
                           { value: "Fixed-Cost", label: "Fixed-Cost" },
                           { value: "Time and Material", label: "Time and Material" },
                        ]}
                        required
                        fullWidth
                     />
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 2" } }}>
                     <SelectControl
                        name="tool"
                        label="PCB Tool"
                        value={form.tool || ""}
                        onChange={handleChange}
                        options={lookups.PCBTools.map((tool: string) => ({
                           value: tool,
                           label: tool,
                        }))}
                        height={40}
                        required
                     />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 4" } }}>
                     <RadioGroup
                        row
                        sx={{
                           justifyContent: "space-evenly",
                           border: "1px solid #ccc",
                           borderRadius: "8px",
                           padding: "6px",
                        }}
                        value={form.currency}
                     >
                        <FormControlLabel value="1"  control={<Radio />} label="INR" />
                        <FormControlLabel value="2" control={<Radio />} label="USD" />
                        <FormControlLabel value="3" control={<Radio />} label="EURO" />
                     </RadioGroup>
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <RadioGroup
                        row
                        sx={{
                           justifyContent: "space-evenly",
                           border: "1px solid #ccc",
                           borderRadius: "8px",
                           padding: "6px",
                        }}
                        value={form.type}
                     >
                        <FormControlLabel value="Export" control={<Radio />} label="Export" />
                        <FormControlLabel value="Domestic"  control={<Radio />} label="Domestic" />
                     </RadioGroup>
                  </Box>

                  {/* ✅ Scope Title */}
                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Box sx={{ display: "flex", alignItems: "center", mt: 3, mb: 1 }}>
                        <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                        <Typography sx={{ mx: 4, fontSize: 20, fontWeight: 600 }}>
                           SCOPE DETAILS
                        </Typography>
                        <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                     </Box>
                  </Box>
                  {scopeConfig.map((cfg) => {
                     const lowerField = cfg.field;
                     const respField = cfg.responsibilityField;

                     return (
                        <Box
                           key={cfg.section}
                           sx={{
                              gridColumn: "1 / -1",
                              display: "grid",
                              gridTemplateColumns: { xs: "1fr", md: "10fr 2fr" },
                              alignItems: "center",
                              borderBottom: "1px dashed #ddd",
                              pb: 1,
                              mb: 1,
                              gap: 2,
                           }}
                        >
                           {/* ✅ LEFT SIDE: SECTION + CHECKBOXES */}
                           <Box>
                              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                                 {cfg.section}
                              </Typography>

                              <FormGroup row>
                                 {/* {
                                 cfg.checkboxes.map((item) => ( */}
                                 {(
                                    !isEditMode && cfg.field === "layout"
                                       ? cfg.checkboxes.filter(cb => !layoutHideForAdd.includes(cb))
                                       : cfg.checkboxes
                                 ).map((item) => (
                                    <FormControlLabel
                                       key={item}
                                       control={
                                          <Checkbox
                                             checked={form[lowerField]?.includes(item)}
                                             onChange={(e) =>
                                                handleCheckboxChange(
                                                   lowerField,
                                                   item,
                                                   e.target.checked
                                                )
                                             }
                                          />
                                       }
                                       label={item}
                                    />
                                 ))}
                              </FormGroup>
                           </Box>

                           {/* ✅ RIGHT SIDE: RESPONSIBILITY DROPDOWN */}
                           <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                                    // options={cfg.responsibilityOptions.map((opt: any) => {
                                    //    if (isManager(opt)) {
                                    //       return { value: opt.HOPC1ID, label: opt.HOPC1NAME };
                                    //    }
                                    //    if (isEmployee(opt)) {
                                    //       return { value: opt.iDno, label: opt.name };
                                    //    }
                                    //    🔥 SalesNpiUser
                                    //    return { value: opt.Id, label: opt.Name };
                                    // })}

                                    width="220px"
                                    required
                                 />
                              )}
                           </Box>
                        </Box>
                     );
                  })}
                  {/* line divising the scope  */}
                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                        <Box sx={{ flex: 1, borderTop: "1px solid #ccc" }} />
                     </Box>
                  </Box>
                  {/* --- Quotation & Tender --- */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 2" } }}>
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
                  </Box>

                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 2" } }}>
                     <FormControlLabel
                        control={
                           <Checkbox
                              checked={form.govt_tender === "YES"}
                              onChange={(e) =>
                                 setForm((p) => ({ ...p, govt_tender: e.target.checked ? "YES" : "NO" }))
                              }
                           />
                        }
                        label="Govt Tender?"
                     />
                  </Box>

                  {/* --- Responsibilities --- */}
                  {/* <Grid item xs={12} md={3}> */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
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
                  </Box>
                  {/* <Grid item xs={12} md={3}> */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <SelectControl
                        name="salesresponsibilityid"
                        label="Sales Responsibility"
                        value={form.salesresponsibilityid}
                        onChange={handleChange}
                        options={lookups.SalesManagers.map((e) => ({
                           value: e.id,
                           label: e.name,
                        }))}
                        fullWidth
                        width="200px"
                        required
                     />
                  </Box>

                  {/* --- Reference   */}
                  {/* <Grid item xs={12} md={3}> */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
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
                  </Box>

                  {/* <Grid item xs={12} md={9}> */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
                     <TextField
                        label="Remarks"
                        fullWidth
                        multiline
                        rows={2}
                        name="remarks"
                        value={form.remarks}
                        onChange={handleChange}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                     />
                  </Box>

                  {/* --- File Upload --- */}
                  {/* <Grid item xs={12} md={9}> */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 3" } }}>
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
                           {file
                              ? file.name
                              : isEditMode && form.uploadedfilename
                                 ? form.uploadedfilename
                                 : "Click or Drag a file to upload"}
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
                  </Box>

                  {/* --- Submit Button --- */}
                  <Box sx={{ gridColumn: { xs: "span 2", md: "span 2" }, textAlign: "center", mt: 3, }} >
                     <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={!isResponsibilitySelected || loading} // if none of the responsibility fields are selected
                        sx={{ px: 6, height: 45 }}
                     >
                        {isEditMode ? "EDIT" : "ADD"}
                     </Button>
                  </Box>
               </Box>
            </CardContent>
            <ToastContainer position="top-right" autoClose={2500} theme="colored" />
         </Card>
      </Box>
   );
};
export default OffshoreEnquiry;