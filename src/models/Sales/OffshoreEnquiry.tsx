import React, { useEffect, useState, useRef } from "react";
import type { ChangeEvent } from "react";
import {
   FormGroup, Button, Card, CardContent, Typography, Box, FormControlLabel, Checkbox,
   TextField,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import Label from "../../components/resusablecontrols/Label";
import TextControl from "../../components/resusablecontrols/TextControl";
import CompactRadioGroup from "../../components/resusablecontrols/CompactRadioGroup";
import { baseUrl } from "../../const/BaseUrl";
import { ToastContainer, toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { RiBox3Line } from "react-icons/ri";
import { FaBoxOpen } from "react-icons/fa";

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
   const standardInputStyle: React.CSSProperties = {
      width: "100%",
       height: 34,
      border: "1px solid #cfd8e3",
      borderRadius: 6,
      padding: "0 10px",
      fontSize: 13,
       boxSizing: "border-box",
      backgroundColor: "#fff",
      marginTop: 2,
   };

   // fields backend requires, but UI does not collect
   const dtoBlankDefaults = {
      layoutbyid: "", npibyid: "", analysisbyid: "", npiNewbyid: "",
      pi: "NO", si: "NO", dfa: "NO", dfm: "NO", fpg: "NO", asmb: "NO", pcba: "NO", qacam: "NO",
      design: "NO", library: "NO", layout_fab: "NO", layout_testing: "NO", layout_others: "NO",
      emi_net_level: "NO", emi_system_level: "NO", thermal_board_level: "NO", thermal_system_level: "NO",
      hardware: "NO", VA_Assembly: "NO", DesignOutSource: "NO", npi_fab: "NO", npi_testing: "NO", npi_others: "NO", vaMech: "NO",
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
         sx={{ maxWidth: 850, width: "100%", mx: "auto", mt: isEditMode ? 18 : 0.9, px: { xs: 2, md: 0 },
          //  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontFamily: "Arial",
         }}
      >
         <Card
            sx={{
               width: "100%",
               m: "auto",
               mt: 1.25,
               borderRadius: 3,
               border: "1px solid #d8e5ff",
               boxShadow: "0 10px 24px rgba(45, 82, 150, 0.12)",
               background:
                  "linear-gradient(180deg, #f9fbff 0%, #f3f7ff 100%)",
               "& .MuiTypography-root, & .MuiInputBase-input, & .MuiFormControlLabel-label, & .MuiInputLabel-root": {
               //   fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
             fontFamily: "Arial",
            },
            }}
         >
            <CardContent sx={{ p: { xs: 1.75, md: 2.5 } }}>
               <Typography
                  variant="h5"
                  sx={{ textAlign: "center", mb: 2, fontWeight: 700, color: "#0f4ea6", letterSpacing: "0.01em", fontSize: { xs: "1.05rem", md: "1.22rem" } }}>
                  {isEditMode ? "Edit OFFSHORE Enquiry" : "Add OFFSHORE Enquiry"}
               </Typography>

               {/* --- Main Form Grid --- */}
               <Box
                  sx={{
                     display: "grid",
                     gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(12, 1fr)" },
                     gap: 1.5,
                     alignItems: "start",
                  }}
               >
                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Card sx={{ borderRadius: 2, border: "1px solid #d5e1f8", boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)", background: "#ffffff" }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                           <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>CUSTOMER DETAILS</Typography>
                           {/* <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(12, 1fr)" }, gap: 1.5 }}> */}
                           <Box
                              sx={{
                                 display: "grid",
                                 gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                                 columnGap: 1.5,
                                 rowGap: 2,
                                 alignItems: "start",
                              }}
                           >
                              <Box>
                                 <SelectControl
                                    name="customerId"
                                    label="Customer"
                                    value={form.customerId}
                                    options={lookups.customers.map((c) => ({ value: String(c.itemno).trim(), label: c.customer }))}
                                    onChange={handleChange}
                                    required
                                 />
                              </Box>
                              <Box>
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
                              <Box>
                                 <SelectControl
                                    name="state"
                                    label="State"
                                    value={form.state}
                                    options={lookups.States.map(s => ({ value: s.state, label: s.state }))}
                                    onChange={handleChange}
                                    required
                                 />
                              </Box>
                              <Box>
                                 <SelectControl
                                    name="contactName"
                                    label="Contact Name"
                                    value={form.contactName}
                                    options={lookups.Contacts.map((c) => ({ value: c.contact_id.toString(), label: c.contactName }))}
                                    onChange={handleChange}
                                    required
                                    disabled={!form.locationId}
                                 />
                              </Box>
                              <Box>
                                 <Label text="Email Address" />
                                 <TextControl name="emailAddress" value={form.email11 || ""} onChange={() => { }} disabled={true} style={standardInputStyle} />
                              </Box>
                              <Box>
                                 <Label text="Address" />
                                 <TextControl
                                    name="address"
                                    value={form.address}
                                    multiline
                                    rows={2}
                                    fullWidth
                                    disabled={true}
                                    style={{ ...standardInputStyle, padding: "8px", height: "60px"  }}
                                 />
                              </Box>
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>

                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Card sx={{ borderRadius: 2, border: "1px solid #d5e1f8", boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)", background: "#ffffff" }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                           <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>ENQUIRY DETAILS</Typography>
                           <Box
                              sx={{
                                 display: "grid",
                                 gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "370px 370px"
                                 },
                                 columnGap: 3,
                                 rowGap: 1.8,
                                 alignItems: "start",
                              }}
                           >
                              {/* ROW 1 */}
                              <Box>
                                 <Label text="Board Ref" />
                                 <TextControl
                                    name="jobnames"
                                    value={form.jobnames || ""}
                                    onChange={handleChange}
                                    style={standardInputStyle}
                                 />
                              </Box>
                              <Box  >
                                 <SelectControl
                                    name="tool"
                                    label="PCB Tool"
                                    value={form.tool || ""}
                                    onChange={handleChange}
                                    options={lookups.PCBTools.map((tool: string) => ({
                                       value: tool,
                                       label: tool,
                                    }))}
                                    // height={40}
                                    required
                                 />
                              </Box>
                              {/* ROW 2 */}

                              <Box sx={{ mt: 0.3 }}>
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
                                    height={34}
                                 />
                              </Box>
                              <Box >
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
                                 // fullWidth
                                 />
                              </Box>
                              {/* ROW 3 */}
                              <Box >
                                 <Label text="Currency" />
                                 <CompactRadioGroup
                                    name="currency"
                                    value={String(form.currency)}
                                    onChange={handleChange}
                                    height={34}
                                    options={[
                                       { value: "1", label: "INR" },
                                       { value: "2", label: "USD" },
                                       { value: "3", label: "EURO" },
                                    ]}
                                 />
                              </Box>
                              <Box>
                                 <Label text="Type" />
                                 <CompactRadioGroup
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    height={34}
                                    options={[
                                       { value: "Export", label: "Export" },
                                       { value: "Domestic", label: "Domestic" },
                                    ]}
                                 />

                              </Box>
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>

                  {/* ✅ Scope Details Single Card */}
                  <Box sx={{ gridColumn: "1 / -1", mt: 2 }}>
                     <Card
                        sx={{
                           borderRadius: 2,
                           border: "1px solid #d5e1f8",
                           boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
                           background: "#ffffff",
                        }}
                     >
                        <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                           <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", letterSpacing: "0.03em", mb: 1.1 }}>
                              SCOPE DETAILS
                           </Typography>
                           <Box
                              sx={{
                                 display: "grid",
                                 gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" },
                                 gap: 1.5,
                              }}
                           >
                              {scopeConfig.map((cfg) => {
                                 const lowerField = cfg.field;
                                 const respField = cfg.responsibilityField;

                                 return (
                                    <Box
                                       key={cfg.section}
                                       sx={{
                                          border: "1px solid #e4ebfb",
                                          borderRadius: 2,
                                          p: 1.1,
                                          background: "#fbfdff",
                                          display: "flex",
                                          flexDirection: "column",
                                          minHeight: "100%",
                                       }}
                                    >
                                       <Typography sx={{ fontWeight: 700, mb: 0.45, color: "#214b95", fontSize: "0.88rem" }}>
                                          {cfg.section}
                                       </Typography>

                                       <FormGroup sx={{ rowGap: 0.25, flex: 1 }}>
                                          {(
                                             !isEditMode && cfg.field === "layout"
                                                ? cfg.checkboxes.filter(cb => !layoutHideForAdd.includes(cb))
                                                : cfg.checkboxes
                                          ).map((item) => (
                                             <FormControlLabel
                                                key={item}
                                                sx={{
                                                   mr: 0,
                                                   my: 0.1,
                                                   minHeight: 22,
                                                   alignItems: "center",
                                                   "& .MuiFormControlLabel-label": {
                                                      lineHeight: 1.25,
                                                      mt: "0px",
                                                   },
                                                }}
                                                control={
                                                   <Checkbox
                                                      size="small"
                                                      checked={form[lowerField]?.includes(item)}
                                                      sx={{ py: 0, px: 0.35 }}
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
                                                slotProps={{ typography: { fontSize: "0.78rem" } }}
                                             />
                                          ))}
                                       </FormGroup>

                                       {form[lowerField]?.length > 0 && (
                                          <Box sx={{ mt: 1, minHeight: 35 }}>
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
                                                required
                                                height={30}
                                                fullWidth
                                                fontSize="0.8rem"
                                             />
                                          </Box>
                                       )}
                                    </Box>
                                 );
                              })}
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Card sx={{ borderRadius: 2, border: "1px solid #d5e1f8", boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)", background: "#ffffff" }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                           <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>SUBMISSION DETAILS</Typography>
                           <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "370px 370px" }, columnGap: 3, rowGap: 1.8, alignItems: "start", }}>
                              <Box>
                                 <FormControlLabel
                                    sx={{ m: 0 }}
                                    control={
                                       <Checkbox
                                          size="small"
                                          checked={form.govt_tender === "YES"}
                                          onChange={(e) =>
                                             setForm((p) => ({ ...p, govt_tender: e.target.checked ? "YES" : "NO" }))
                                          }
                                       />
                                    }
                                    label="Govt Tender?"
                                 />
                              </Box>
                              <Box sx={{ width: 150 }}>
                                 <Label text="Quotation Request Last Date" />
                                 <TextField
                                    type="date"
                                    name="quotation_request_lastdate"
                                    value={form.quotation_request_lastdate || ""}
                                    onChange={(e) => {
                                       const value = e.target.value;
                                       setForm((p) => ({ ...p, quotation_request_lastdate: value }));
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{
                                       "& .MuiInputBase-root": {
                                          height: 22,
                                          fontSize: "0.9rem",
                                       },
                                    }}
                                 />
                              </Box>

                              <Box >
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
                                    width="100%"
                                 />
                              </Box>
                              <Box>
                                 <Label text="Remarks" />
                                 <TextControl
                                    fullWidth
                                    multiline
                                    rows={2}
                                    name="remarks"
                                    value={form.remarks}
                                    onChange={handleChange}
                                    style={{ ...standardInputStyle, padding: "8px", height: "60px"  }}
                                 />
                              </Box>
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>

                  <Box sx={{ gridColumn: "1 / -1" }}>
                     <Card sx={{ borderRadius: 2, border: "1px solid #d5e1f8", boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)", background: "#ffffff" }}>
                        <CardContent sx={{ p: { xs: 1.5, md: 1.8 } }}>
                           <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#214b95", mb: 1.1 }}>ASSIGNMENT & UPLOAD</Typography>
                           <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "370px 370px" }, columnGap: 3, rowGap: 1.8, alignItems: "start", }}>
                              <Box>
                                 <SelectControl
                                    name="completeresponsibilityid"
                                    label="Complete Responsibility"
                                    value={form.completeresponsibilityid}
                                    onChange={handleChange}
                                    options={getCompleteRespOptions()}
                                    fullWidth
                                    width="100%"
                                    required
                                 />
                              </Box>
                              <Box >
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
                                    width="100%"
                                    required
                                 />
                              </Box>
                              <Box>
                                 <Box
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
                                    }}
                                    onClick={() => document.getElementById("fileInput")?.click()}
                                 >
                                    <CloudUploadIcon sx={{ fontSize: 28, color: "#2196f3", alignSelf: "center" }} />
                                    <Typography variant="caption" sx={{ mt: 0.6 }}>
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
                                    sx={{ mt: 0.8, display: "block", textAlign: "center" }}
                                 >
                                    If you have multiple files, please zip and upload.
                                 </Typography>
                              </Box>

                              <Box>
                                 <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={!isResponsibilitySelected || loading}
                                    sx={{ px: 5, height: 38, borderRadius: 1.5, fontSize: "0.82rem" }}
                                 >
                                    {isEditMode ? "EDIT" : "ADD"}
                                 </Button>
                              </Box>
                           </Box>
                        </CardContent>
                     </Card>
                  </Box>
               </Box>
            </CardContent>
            <ToastContainer position="top-right" autoClose={2500} theme="colored" />
         </Card>
      </Box>
   );
};
export default OffshoreEnquiry;
