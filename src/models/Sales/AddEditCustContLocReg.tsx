import { useEffect, useState, type ChangeEvent } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Button, Divider, Tabs, Tab, Chip,
  IconButton, Paper,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import TextControl from "../../components/resusablecontrols/TextControl";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import { Add, Delete, Business, ContactPhone, LocationOn, ReceiptLong, LocalShipping, } from "@mui/icons-material";

const customerTypes = ["DOMESTIC", "SEZ", "Export", "Govt", "MNC"];
const currencies = ["INR", "USD", "EURO"];
const contactRoles = ["Technical", "Purchase", "Finance"];
const titleTexts = ["Mr.", "Mrs.", "Ms.", "M/s"];

type Option = {
  value: string | number;
  label: string;
};

type CustomerForm = {
  salesRespId: string;
  customerType: string;
  companyName: string;
  customerAbb: string;
  gstNo: string;
  panNo: string;
  currency: string;
  industry: string;

  salesOrganization: string;
  distributionChannel: string;
  contactTitle: string;
  paymentTerms: string;
  shippingConditions: string;
  incoterms: string;
  taxclassification: string;
  sapCode: string;

  billAddress: string;
  billCity: string;
  billState: string;
  billCountry: string;
  billPincode: string;
  billPhone1: string;
  //billPhone2: string;
  billEmail: string;

  shipAddress: string;
  shipCity: string;
  shipState: string;
  shipCountry: string;
  shipPincode: string;
  shipPhone1: string;
  //shipPhone2: string;
  shipEmail: string;
};

type ContactRow = {
  contactId: string;
  locationId: string;
  role: string;
  contactTitle: string;
  name: string;
  mobile: string;
  alternateMobile: string;
  email: string;
};

type AddressFields = {
  address: string;
  city: string;           //location field backend
  state: string;
  country: string;
  pincode: string;
};

type SavedRecordResponse = {
  itemno?: string | number;
  itemNo?: string | number;
  location_id?: string | number;
  locationId?: string | number;
};

export default function AddEditCustContLocReg() {
  const [tab, setTab] = useState(0);
  const [formMode, setFormMode] = useState<"new" | "edit" | "delete">("new");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [salesRespOptions, setSalesRespOptions] = useState<Option[]>([]);
  const [industryOptions, setIndustryOptions] = useState<Option[]>([]);
  const [paymenttermsOptions, setPaymenttermsOptions] = useState<Option[]>([]);
  const [stateOptions, setStateOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [countryOptions, setCountryOptions] = useState<Option[]>([]);

  type CustomerLocation = {
    locationId: string;
    customer_id: string;
    location: string;
    locationName: string;
    locationType: string;
    address: string;
    city: string;         //location field backend
    state: string;
    country: string;
    pincode: string;
    phone1: string;
    //phone2: string;
    email: string;
    addresstype: number;
  };

  const emptyLocation: CustomerLocation = {
    locationId: "",
    customer_id: "",
    location: "",
    locationName: "",
    locationType: "BILL",
    address: "",
    city: "",    //location field backend
    state: "",
    country: "",
    pincode: "",
    phone1: "",
    //phone2: "", 
    email: "",
    addresstype: 1,
  };

  const [locations, setLocations] = useState<CustomerLocation[]>([
    { ...emptyLocation }
  ]);
  const [contacts, setContacts] = useState<ContactRow[]>([
    {
      contactId: "",
      locationId: "",
      role: "Technical",
      contactTitle: "",
      name: "",
      mobile: "",
      alternateMobile: "",
      email: "",
    },
  ]);

  const [form, setForm] = useState<CustomerForm>({
    salesRespId: "",
    customerType: "",
    companyName: "",
    customerAbb: "",
    gstNo: "",
    panNo: "",
    currency: "INR",
    industry: "",

    salesOrganization: "",
    distributionChannel: "",
    contactTitle: "",
    paymentTerms: "",
    shippingConditions: "",
    incoterms: "",
    taxclassification: "",
    sapCode: "",

    //billCustomer: "",
    billAddress: "",
    billCity: "",        //location field backend
    billState: "",
    billCountry: "",
    billPincode: "",
    billPhone1: "",
    //billPhone2: "",
    billEmail: "",

    //shipCustomer: "",
    shipAddress: "",
    shipCity: "",          //location field backend
    shipState: "",
    shipCountry: "",
    shipPincode: "",
    shipPhone1: "",
    //shipPhone2: "",
    shipEmail: "",
  });

  const pickValue = (row: Record<string, unknown> | null | undefined, keys: string[]) => {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return String(value);
      }
    }
    return "";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value } as CustomerForm));
  };

  const handleContactChange = (index: number, field: keyof ContactRow, value: string) => {
    const updated = [...contacts];
    updated[index][field] = value;
    setContacts(updated);
  };

  const addContact = () => {
    setContacts([
      ...contacts,
      {
        contactId: "",
        locationId: "",
        role: "Purchase",
        contactTitle: "",
        name: "",
        mobile: "",
        alternateMobile: "",
        email: "",
      },
    ]);
  };

  const removeContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    setContacts(updated);
  };

  const sectionCardStyle = {
    borderRadius: 4,
    border: "1px solid #d9e4f5",
    boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
    overflow: "hidden",
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 2,
    py: 1.5,
    background: "linear-gradient(90deg,#0f4ea6,#3c78d8)",
    color: "white",
  };

  const customerTypeOptions = customerTypes.map((item) => ({
    value: item,
    label: item,
  }));
  const currencyOptions = currencies.map((item) => ({
    value: item,
    label: item,
  }));

  const titleTextOptions = titleTexts.map((item) => ({
    value: item,
    label: item,
  }));

  const contactRoleOptions = contactRoles.map((item) => ({
    value: item,
    label: item,
  }));

  const salesOrganizationOptions = [
    { value: "ORG1", label: "ORG1" },
    { value: "ORG2", label: "ORG2" },
  ];

  const distributionChannelOptions = [
    { value: "ONLINE", label: "ONLINE" },
    { value: "OFFLINE", label: "OFFLINE" },
  ];

  const taxClassificationOptions = [
    { value: "GST 0%", label: "GST 0%" },
    { value: "GST 5%", label: "GST 5%" },
  ];

  const fetchIndustryOptions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/CustomerIndustry`);

      const rows = Array.isArray(res.data) ? res.data : [];

      setIndustryOptions(
        rows.map((row: any) => ({
          value: String(row.id),
          label: row.industryname,
        }))
      );
    } catch (error) {
      console.error("Failed to load industry list:", error);
      setIndustryOptions([]);
      toast.error("Unable to load industry list.");
    }
  };

  const fetchPaymenttermsOptions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/CustomerPaymentTerms`);
      const rows = Array.isArray(res.data) ? res.data : [];
      setPaymenttermsOptions(
        rows.map((row: any) => ({
          value: String(row.id),
          label: row.paymentterms,
        }))
      );
    } catch (error) {
      console.error("Failed to load payment terms list:", error);
      setPaymenttermsOptions([]);
      toast.error("Unable to load payment terms list.");
    }
  };

  const buildUniqueOptions = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).map((value) => ({
      value,
      label: value,
    }));

  const fetchLocationCodeOptions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/LocationCodes`);
      const rows = Array.isArray(res.data) ? res.data : [];

      const states = rows
        .map((row: any) => String(row?.stateName ?? "").trim())
        .filter(Boolean);
      const cities = rows
        .map((row: any) => String(row?.cityName ?? "").trim())
        .filter(Boolean);
      const countries = rows
        .map((row: any) => String(row?.countryName ?? "").trim())
        .filter(Boolean);

      setStateOptions(buildUniqueOptions(states));
      setCityOptions(buildUniqueOptions(cities));
      setCountryOptions(buildUniqueOptions(countries));
    } catch (error) {
      console.error("Failed to load location code options:", error);
      setStateOptions([]);
      setCityOptions([]);
      setCountryOptions([]);
      toast.error("Unable to load location code options.");
    }
  };

  const isDeleteMode = formMode === "delete";
  const modeLabel =
    formMode === "new" ? "New Entry" : formMode === "edit" ? "Edit Mode" : "Delete Mode";
  const primaryActionLabel =
    formMode === "new"
      ? "Submit Customer"
      : formMode === "edit"
        ? "Update Customer"
        : "Delete Customer";
  const primaryActionColor =
    formMode === "delete" ? "error" : "primary";

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await axios.get(`${baseUrl}/api/Sales/Customers`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows
        .map((row: any) => {
          const id = pickValue(row, ["itemno", "id", "customer_id", "customerId"]);
          const name = pickValue(row, ["customer", "Customer", "customerName", "CustomerName"]);
          const abbrev = pickValue(row, ["customer_abb", "Customer_abb", "customerAbb", "CustomerAbb"]);
          if (!id || !name) return null;
          return {
            value: id,
            label: abbrev ? `${name} (${abbrev})` : name,
          };
        })
        .filter(Boolean) as Array<{ value: string | number; label: string }>;
      setCustomerOptions(mapped);
    } catch (error) {
      console.error("Failed to load customers:", error);
      setCustomerOptions([]);
      toast.error("Unable to load customers for edit/delete.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const hydrateCustomer = (raw: Record<string, unknown> | null | undefined) => {
    if (!raw) return;
    //prev is the current form state - the data fetched from api, set to prev and then to form , next to controls
    setForm((prev) => ({
      ...prev,
      salesRespId: String(raw.sales_resp_id ?? raw.salesRespId ?? prev.salesRespId ?? ""),
      customerType: String(raw.customer_Type ?? raw.customerType ?? prev.customerType ?? ""),
      companyName: String(raw.customer ?? raw.companyName ?? raw.CompanyName ?? prev.companyName ?? ""),
      customerAbb: String(raw.customer_abb ?? raw.customerAbb ?? prev.customerAbb ?? ""),
      gstNo: String(raw.gst_no ?? raw.gstNo ?? prev.gstNo ?? ""),
      panNo: String(raw.panNo ?? raw.pan_no ?? prev.panNo ?? ""),
      currency: String(raw.currency ?? prev.currency ?? "INR"),
      industry: String(raw.industry ?? prev.industry ?? ""),
      salesOrganization: String(raw.salesorg ?? prev.salesOrganization ?? ""),
      distributionChannel: String(raw.distributionchannel ?? prev.distributionChannel ?? ""),
      paymentTerms: String(raw.cuspaymentterms ?? raw.paymentterms ?? prev.paymentTerms ?? ""),
      shippingConditions: String(raw.shippingconditions ?? prev.shippingConditions ?? ""),
      taxclassification: String(raw.taxclassification ?? prev.taxclassification ?? ""),
      incoterms: String(raw.incoterms ?? prev.incoterms ?? ""),
      sapCode: String(raw.sapcustcode ?? raw.sapCode ?? prev.sapCode ?? ""),
    }));
  };

  const splitAddressFields = (addressText: string) => {
    const parts = String(addressText ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      address: parts[0] ?? "",
      location: parts[1] ?? "",
      state: parts[2] ?? "",
      country: parts[3] ?? "",
      pincode: parts[4] ?? "",
      phone1: parts[5] ?? "",
      // phone2: parts[6] ?? "",
      email: parts[6] ?? "",
    };
  };

  //  const buildAddressText = (address: string, city: string, state: string, country: string, pincode: string) =>
  //     [address, city, state, country, pincode].map((part) => String(part ?? "").trim()).filter(Boolean).join("\n");

  const hydrateLocations = (rows: Record<string, unknown>[]) => {
    const normalized = rows.map((row) => {
      const address = splitAddressFields(String(row.address ?? ""));
      const rawLocationType = String(row.locationType ?? row.location_type ?? row.addresstype ?? row.addressType ?? "BILL").trim().toUpperCase();
      const locationType = rawLocationType === "SHIP" || rawLocationType === "2" ? "SHIP" : "BILL";

      const state = String(row.state ?? row.locstate ?? address.state ?? "").trim();
      const country = String(row.country ?? row.loccountry ?? address.country ?? "").trim();
      const pincode = String(row.pincode ?? row.locpincode ?? address.pincode ?? "").trim();
      const phone1 = String(row.phoneno1 ?? row.phone1 ?? row.phone ?? "").trim();
      //const phone2 = String(row.phoneno2 ?? row.phone2 ?? "").trim();
      const email = String(row.locemail ?? row.email ?? "").trim();
      const city = String(row.location ?? "").trim();  //location field backend

      return {
        locationId: String(row.location_id ?? row.locationId ?? "").trim(),
        customer_id: String(row.customer_id ?? row.customerId ?? "").trim(),
        location: String(row.location ?? row.locationName ?? "").trim(),
        locationName: String(row.location ?? row.locationName ?? "").trim(),
        locationType,
        address: address.address,
        city,
        state,
        country,
        pincode,
        phone1,
        //  phone2,
        email,
        addresstype: Number(row.addresstype ?? (locationType === "SHIP" ? 2 : 1)),
      };
    });

    setLocations(normalized.length ? normalized : [{ ...emptyLocation }]);
  };

  const hydrateContacts = (rows: Record<string, unknown>[]) => {
    const normalized = rows
      .map((row) => ({
        contactId: String(row.contact_id ?? row.contactId ?? "").trim(),
        locationId: String(row.location_id ?? row.locationId ?? "").trim(),
        role: String(row.role ?? "Technical").trim(),
        contactTitle: String(row.contactTitle ?? "").trim(),
        name: String(row.ContactName ?? row.contactName ?? row.contact_name ?? "").trim(),
        mobile: String(row.mobile1 ?? row.mobile_1 ?? row.mobileno1 ?? "").trim(),
        alternateMobile: String(row.mobile2 ?? row.mobile_2 ?? row.mobileno2 ?? "").trim(),
        email: String(row.email11 ?? row.email ?? row.email1 ?? "").trim(),
      }))
      .filter((row) => row.contactId || row.name || row.email || row.mobile);

    if (normalized.length > 0) {
      setContacts(normalized);
      return;
    }

    setContacts([
      {
        contactId: "",
        locationId: "",
        role: "Technical",
        contactTitle: "",
        name: "",
        mobile: "",
        alternateMobile: "",
        email: "",
      },
    ]);
  };

  const fetchSalesResponsibilityOptions = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/Home/SalesManagers`);
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows
        .map((row: any, index: number) => ({
          value: String(pickValue(row, ["id", "sales_resp_id", "salesRespId", "sales_resp"]) || index),
          label: pickValue(row, ["name", "sales_resp", "salesResp", "displayName"]),
        }))
        .filter((row: { value: string; label: string }) => !!row.label);
      setSalesRespOptions(mapped);
    } catch (error) {
      console.error("Failed to load sales responsibility options:", error);
      setSalesRespOptions([]);
    }
  };

  const loadCustomerForMode = async (customerId: string) => {
    if (!customerId) return;
    setLoadingRecord(true);
    try {
      const [customerRes, locationRes, contactRes] = await Promise.all([
        axios.get(
          `${baseUrl}/api/Sales/CustomerById?itemno=${encodeURIComponent(customerId)}`
        ),
        axios.get(
          `${baseUrl}/api/Sales/customerlocations?customerId=${encodeURIComponent(customerId)}`
        ),
        axios.get(
          `${baseUrl}/api/Sales/customercontacts?customerId=${encodeURIComponent(customerId)}`
        ),
      ]);

      const row = Array.isArray(customerRes.data) ? customerRes.data[0] : customerRes.data;
      if (!row) {
        toast.warning("No customer found for the selected record.");
        return;
      }
      hydrateCustomer(row);
      const locationRows = Array.isArray(locationRes.data) ? locationRes.data : locationRes.data ? [locationRes.data] : [];
      hydrateLocations(locationRows);
      const contactRows = Array.isArray(contactRes.data) ? contactRes.data : contactRes.data ? [contactRes.data] : [];
      hydrateContacts(contactRows);
    } catch (error) {
      console.error("Failed to load selected customer:", error);
      toast.error("Unable to load the selected customer.");
    } finally {
      setLoadingRecord(false);
    }
  };

  const resetForm = () => {
    setFormMode("new");
    setTab(0);
    setSelectedCustomerId("");
    setLocations([{ ...emptyLocation }]);
    setContacts([
      {
        contactId: "",
        locationId: "",
        role: "Technical",
        contactTitle: "",
        name: "",
        mobile: "",
        alternateMobile: "",
        email: "",
      },
    ]);
    setForm({
      salesRespId: "",
      customerType: "",
      companyName: "",
      customerAbb: "",
      gstNo: "",
      panNo: "",
      currency: "INR",
      industry: "",
      salesOrganization: "",
      distributionChannel: "",
      contactTitle: "",
      paymentTerms: "",
      shippingConditions: "",
      incoterms: "",
      taxclassification: "",
      sapCode: "",
      billAddress: "",
      billCity: "",
      billState: "",
      billCountry: "",
      billPincode: "",
      billPhone1: "",
      //  billPhone2: "",
      billEmail: "",
      shipCompany: "",
      shipAddress: "",
      shipCity: "",
      shipState: "",
      shipCountry: "",
      shipPincode: "",
      shipPhone1: "",
      // shipPhone2: "",
      shipEmail: "",
    });
  };

  const handleModeChange = (mode: "new" | "edit" | "delete") => {
    setFormMode(mode);
    setSelectedCustomerId("");
    setLocations([{ ...emptyLocation }]);
    setContacts([
      {
        contactId: "",
        locationId: "",
        role: "Technical",
        contactTitle: "",
        name: "",
        mobile: "",
        alternateMobile: "",
        email: "",
      },
    ]);
    setForm({
      salesRespId: "",
      customerType: "",
      companyName: "",
      customerAbb: "",
      gstNo: "",
      panNo: "",
      currency: "INR",
      industry: "",
      salesOrganization: "",
      distributionChannel: "",
      contactTitle: "",
      paymentTerms: "",
      shippingConditions: "",
      incoterms: "",
      taxclassification: "",
      sapCode: "",
      billAddress: "",
      billCity: "",
      billState: "",
      billCountry: "",
      billPincode: "",
      billPhone1: "",
      // billPhone2: "",
      billEmail: "",
      shipAddress: "",
      shipCity: "",
      shipState: "",
      shipCountry: "",
      shipPincode: "",
      shipPhone1: "",
      //  shipPhone2: "",
      shipEmail: "",
    });
    if (mode === "new") {
      setTab(0);
    }
  };

  const handleCustomerSelect = async (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const customerId = String(e?.target?.value ?? "");
    setSelectedCustomerId(customerId);
  };

  const currentCustomerId = selectedCustomerId.trim();

  const getSalesRespLabel = (salesRespId: string) =>
    salesRespOptions.find((option) => String(option.value) === String(salesRespId))?.label ?? "";

  const buildCustomerDetailsPayload = (customerId?: string) => {
    const activeLocations = locations.filter((loc) => {
      return [loc.address, loc.city, loc.state, loc.country, loc.pincode, loc.phone1, loc.email].some(
        (value) => String(value ?? "").trim() !== ""
      );
    });

    const locationPayloads = activeLocations.map((loc) => ({
      Location_Id: loc.locationId ? Number(loc.locationId) : undefined,
      Customer_Id: customerId ? Number(customerId) : 0,
      Location: loc.city,
      // Address: buildAddressText(loc.address, loc.city, loc.state, loc.country, loc.pincode),
      Address: loc.address,
      PhoneNo1: loc.phone1,
      AddressType: loc.locationType === "SHIP" ? 2 : 1,
      LocEmail: loc.email,
      LocState: loc.state,
      LocCountry: loc.country,
      LocPincode: loc.pincode,
    }));

    const contactPayloads = contacts
      .filter(isContactRowPopulated)
      .map((contact) => ({
        Contact_Id: contact.contactId ? Number(contact.contactId) : undefined,
        Location_Id: contact.locationId ? Number(contact.locationId) : (locationPayloads.length > 0 ? locationPayloads[0].Location_Id : undefined),
        Customer_Id: customerId ? Number(customerId) : 0,
        ContactTitle: contact.contactTitle,
        ContactName: contact.name.trim(),
        Email11: contact.email.trim(),
        Mobile1: contact.mobile.trim(),
        Mobile2: contact.alternateMobile.trim(),
        contactrole: contact.role,
      }));

    return {
      Customer: {
        ItemNo: customerId ? Number(customerId) : undefined,
        Customer: form.companyName.trim(),
        Customer_Abb: form.customerAbb.trim(),
        Sales_Resp: getSalesRespLabel(String(form.salesRespId ?? "")),
        Sales_Resp_Id: String(form.salesRespId ?? ""),
        Customer_Type: form.customerType,
        Gst_No: form.gstNo.trim(),
        SapCustCode: form.sapCode.trim(),
        industry: form.industry,
        currency: form.currency,
        panNo: form.panNo,
        salesorg: form.salesOrganization,
        distributionchannel: form.distributionChannel,
        cuspaymentterms: form.paymentTerms,
        taxclassification: form.taxclassification,
        shippingconditions: form.shippingConditions,
        incoterms: form.incoterms,
        AddedBy: sessionStorage.getItem("SessionUserName") || "guest",
      },
      Locations: locationPayloads,
      Contacts: contactPayloads,
    };
  };

  const validateContactRows = () => {
    const rows = contacts.filter(isContactRowPopulated);

    for (const contact of rows) {
      if (!String(contact.role ?? "").trim()) return "Role is required.";
      if (!String(contact.contactTitle ?? "").trim()) return "Contact title is required.";
      if (!String(contact.name ?? "").trim()) return "Contact name is required.";
      if (!String(contact.mobile ?? "").trim()) return "Contact mobile is required.";
      if (!String(contact.email ?? "").trim()) return "Contact email is required.";
    }
    return "";
  };

  const isContactRowPopulated = (contact: ContactRow) =>
    [contact.name, contact.mobile, contact.email].some(
      (v) => String(v ?? "").trim() !== ""
    );

  const validateForm = () => {
    if (!form.companyName.trim()) return "Customer name is required.";
    if (!form.customerAbb.trim()) return "Customer abbreviation is required.";
    //if (!form.gstNo.trim()) return "GST number is required.";
    if (form.customerType !== "Export" && !form.gstNo.trim()) {
    return "GST number is required.";
  }
    if (!form.salesRespId.trim()) return "Sales responsibility is required.";
    if (!form.customerType.trim()) return "Customer type is required.";
    if (!form.paymentTerms.trim()) return "Payment terms is required.";
    if (!form.incoterms.trim()) return "Incoterms is required.";
    //phone2 to add below if used
    const hasLocationData = locations.some((loc) =>
      [loc.address, loc.city, loc.state, loc.country, loc.pincode, loc.phone1, loc.email].some(
        (value) => String(value ?? "").trim() !== ""
      )
    );
    if (!hasLocationData) return "At least one location address is required.";
    const contactError = validateContactRows();
    if (contactError) return contactError;
    return "";
  };

  const saveCustomerRecord = async (customerId?: string): Promise<SavedRecordResponse> => {
    const payload = buildCustomerDetailsPayload(customerId);
    console.log("Saving customer record with payload:", payload);
    if (formMode === "edit" && customerId) {
      const res = await axios.put<SavedRecordResponse>(`${baseUrl}/api/Sales/EditCustomerDetails/${encodeURIComponent(customerId)}`, payload);
      return res.data;
    }
    const res = await axios.post<SavedRecordResponse>(`${baseUrl}/api/Sales/AddCustomerDetails`, payload);
    return res.data;
  };

  const handleSaveBundle = async () => {
    if (formMode === "delete") {
      toast.error("Delete service is not available yet for this combined screen.");
      return;
    }

    if (formMode !== "new" && !currentCustomerId) {
      toast.error("Please load a customer record first.");
      return;
    }

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const customerResult = await saveCustomerRecord(currentCustomerId || undefined);
      const savedCustomerIdRaw = customerResult?.itemno ?? customerResult?.itemNo ?? customerResult?.CustomerId;
      const savedCustomerId = String(savedCustomerIdRaw ?? "").trim();

      if (!savedCustomerId) {
        throw new Error("Customer save did not return an item number.");
      }

      setSelectedCustomerId(savedCustomerId);
      handleModeChange("new");
      toast.success(formMode === "new" ? "New Customer added." : "Customer edited.");
      void loadCustomers();
    } catch (error) {
      console.log("error", error);
      toast.error("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  const fieldLabelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: "#243a5a",
    mb: 0.6,
  };

  const inputStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    borderRadius: 8,
    border: "1px solid #cfd9ea",
    padding: "9px 12px",
    minHeight: 40,
    boxSizing: "border-box" as const,
    width: "100%",
    backgroundColor: "#fff",
  };

  const fieldShellStyle = {
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    alignSelf: "stretch",
  };

  const renderTextField = (
    label: string,
    name: keyof CustomerForm,
    required = false,
    multiline = false,
    rows = 1
  ) => (
    <Box sx={fieldShellStyle}>
      <Typography sx={fieldLabelStyle}>
        {label}
        {required ? <span style={{ color: "#d32f2f" }}> *</span> : null}
      </Typography>
      <TextControl
        name={name}
        value={form[name] ?? ""}
        onChange={handleChange}
        fullWidth
        multiline={multiline}
        rows={rows}
        style={inputStyle}
      />
    </Box>
  );

  useEffect(() => {
    void loadCustomers();
    void fetchSalesResponsibilityOptions();
    void fetchIndustryOptions();
    void fetchPaymenttermsOptions();
    void fetchLocationCodeOptions();
  }, []);

  useEffect(() => {
    if (formMode === "edit" || formMode === "delete") {
      void loadCustomers();
    }
  }, [formMode]);

  useEffect(() => {
    if (form.customerType === "Export") {
      setForm(prev => ({
        ...prev,
        gstNo: "",
      }));
    }
  }, [form.customerType]);

  const handleLocationChange = (
    index: number,
    field: keyof CustomerLocation,
    value: string
  ) => {
    setLocations(prev =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              ...(field === "locationType"
                ? { addresstype: value === "SHIP" ? 2 : 1 }
                : {}),
            }
          : item
      )
    );
  };
  const addLocation = () => {
    setLocations(prev => [
      ...prev,
      {
        locationId: crypto.randomUUID(),
        customer_id: "",
        location: "",
        locationName: "",
        locationType: "BILL",
        address: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
        phone1: "",
        //  phone2: "",
        email: "",
        addresstype: 1,
      }
    ]);
  };
  const getLocationHeader = (type: string) => {
    switch (type) {
      case "BILL":
        return {
          title: "Bill To Location",
          icon: <Business />,
          color: "#1565c0",
          bg: "#e8f2ff",
        };

      case "SHIP":
        return {
          title: "Ship To Location",
          icon: <LocalShipping />,
          color: "#2e7d32",
          bg: "#edf8ed",
        };

      default:
        return {
          title: "Other Location",
          icon: <LocationOn />,
          color: "#616161",
          bg: "#f5f5f5",
        };
    }
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Box
      sx={{
        p: 3,
        background: "#f4f7fb",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 5,
          background: "linear-gradient(180deg,#ffffff,#f8fbff)",
          border: "1px solid #dce6f5",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0f4ea6",
              }}
            >
              Customer Registration
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Unified customer onboarding workspace
            </Typography>
            <Chip
              label={modeLabel}
              color={formMode === "delete" ? "error" : formMode === "edit" ? "info" : "success"}
              sx={{ mt: 1.5, fontWeight: 700 }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant={formMode === "new" ? "contained" : "outlined"}
              onClick={() => handleModeChange("new")}
              sx={{ borderRadius: 3 }}
            >
              New Entry
            </Button>
            <Button
              variant={formMode === "edit" ? "contained" : "outlined"}
              onClick={() => handleModeChange("edit")}
              sx={{ borderRadius: 3 }}
            >
              Edit
            </Button>
            <Button
              variant={formMode === "delete" ? "contained" : "outlined"}
              color="error"
              onClick={() => handleModeChange("delete")}
              sx={{ borderRadius: 3 }}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {formMode !== "new" && (
          <Card
            sx={{
              mb: 3,
              borderRadius: 3,
              border: "1px solid #dce6f5",
              background: formMode === "delete" ? "#fff5f5" : "#f8fbff",
            }}
          >
            <CardContent>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography sx={fieldLabelStyle}>
                    Existing Customer Reference
                  </Typography>
                  <SelectControl
                    name="customerLookup"
                    label="Select Customer"
                    value={selectedCustomerId}
                    onChange={handleCustomerSelect}
                    options={customerOptions}
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel
                    disabled={loadingCustomers}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    color={formMode === "delete" ? "error" : "primary"}
                    sx={{ height: 40, borderRadius: 2.5 }}
                    disabled={!selectedCustomerId.trim() || loadingCustomers || loadingRecord}
                    onClick={() => void loadCustomerForMode(selectedCustomerId)}
                  >
                    {loadingRecord
                      ? "Loading..."
                      : formMode === "delete"
                        ? "Load for Delete"
                        : "Load Record"}
                  </Button>
                </Grid>
              </Grid>
              <Typography sx={{ mt: 1.2, fontSize: 12, color: "#5f6f86" }}>
                {formMode === "delete"
                  ? "Delete mode locks the form so you can confirm the target record before removal."
                  : "Use an existing customer reference to bring the record into edit mode."}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            background: "white",
            borderRadius: 3,
            border: "1px solid #dbe5f4",
            px: 1,
          }}
        >
          <Tab label="Basic Info" />
          <Tab label="Addresses" />
          <Tab label="Contacts" />
          <Tab label="Commercial & SAP" />
        </Tabs>

        {tab === 0 && (
          <Card sx={sectionCardStyle}>
            <Box sx={sectionHeaderStyle}>
              <Business />
              <Typography variant="h6" fontWeight={600}>
                Customer Basic Information
              </Typography>
            </Box>

            <CardContent>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                  alignItems: "stretch",
                }}
              >
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Customer Type
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <SelectControl
                    name="customerType"
                    label=""
                    value={form.customerType}
                    onChange={handleChange}
                    required
                    options={customerTypeOptions}
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={isDeleteMode}
                  />
                </Box>

                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Sales Responsibility
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <SelectControl
                    name="salesRespId"
                    label=""
                    value={form.salesRespId}
                    onChange={handleChange}
                    required
                    options={salesRespOptions}
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={isDeleteMode}
                  />
                </Box>

                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Company Name
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextControl
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    fullWidth
                    style={inputStyle}
                    disabled={isDeleteMode}
                  />
                </Box>
                {renderTextField("Customer Abbreviation", "customerAbb", true)}
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    GST No
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextControl
                    // label="GST No"
                    name="gstNo"
                    value={form.gstNo}
                    onChange={handleChange}
                    disabled={form.customerType === "Export"}
                  />
                </Box>
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    PAN No
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <TextControl
                    name="panNo"
                    value={form.panNo}
                    onChange={handleChange}
                  />
                </Box>
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Currency
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <SelectControl
                    name="currency"
                    label=""
                    value={form.currency}
                    onChange={handleChange}
                    required
                    options={currencyOptions}
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={isDeleteMode}
                  />
                </Box>
                <Box sx={fieldShellStyle}>
                  <Typography sx={fieldLabelStyle}>
                    Industry
                    <span style={{ color: "#d32f2f" }}> *</span>
                  </Typography>
                  <SelectControl
                    name="industry"
                    label=""
                    value={form.industry}
                    onChange={handleChange}
                    options={industryOptions}
                    required
                    width="100%"
                    height={40}
                    fontSize="0.9rem"
                    labelFontWeight={600}
                    shrinkLabel={false}
                    disabled={isDeleteMode}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
        {tab === 1 && (
          <Card sx={sectionCardStyle}>

            <Box sx={sectionHeaderStyle}>
              <LocationOn />
              <Typography variant="h6" fontWeight={600}>
                Customer Locations
              </Typography>
            </Box>

            <CardContent>
              {locations.map((loc, index) => {

                const header = getLocationHeader(loc.locationType);

                return (
                  <Box
                    key={`${loc.locationId || index}-${index}`}
                    sx={{
                      border: "1px solid #dde7f5",
                      borderRadius: 3,
                      p: 2,
                      mb: 3,
                      background: header.bg,
                      color: header.color,
                    }}
                  >

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={loc.locationType}
                        color={
                          loc.locationType === "BILL"
                            ? "primary"
                            : loc.locationType === "SHIP"
                              ? "success"
                              : "default"
                        }
                      />

                      {locations.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeLocation(index)}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Box>

                    <Grid container spacing={2}>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Location Type
                          </Typography>

                          <SelectControl
                            value={loc.locationType}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "locationType",
                                e.target.value
                              )
                            }
                            //though the value in string, while storing we store int
                            options={[
                              { value: "BILL", label: "Bill To" },
                              { value: "SHIP", label: "Ship To" },
                            ]}
                            fullWidth
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Address
                          </Typography>

                          <TextControl
                            multiline
                            rows={2}
                            value={loc.address}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "address",
                                e.target.value
                              )
                            }
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            City
                          </Typography>

                          <SelectControl
                            name={`city-${index}`}
                            label=""
                            value={loc.city}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "city",
                                e.target.value
                              )
                            }
                            options={cityOptions}
                            width="100%"
                            height={40}
                            fontSize="0.9rem"
                            labelFontWeight={600}
                            shrinkLabel={false}
                            disabled={isDeleteMode}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            State
                          </Typography>

                          <SelectControl
                            name={`state-${index}`}
                            label=""
                            value={loc.state}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "state",
                                e.target.value
                              )
                            }
                            options={stateOptions}
                            width="100%"
                            height={40}
                            fontSize="0.9rem"
                            labelFontWeight={600}
                            shrinkLabel={false}
                            disabled={isDeleteMode}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Country
                          </Typography>

                          <SelectControl
                            name={`country-${index}`}
                            label=""
                            value={loc.country}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "country",
                                e.target.value
                              )
                            }
                            options={countryOptions}
                            width="100%"
                            height={40}
                            fontSize="0.9rem"
                            labelFontWeight={600}
                            shrinkLabel={false}
                            disabled={isDeleteMode}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Pincode
                          </Typography>

                          <TextControl
                            value={loc.pincode}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "pincode",
                                e.target.value
                              )
                            }
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Phone
                          </Typography>

                          <TextControl
                            name={`phone-${index}`}
                            type="tel"
                            inputMode="tel"
                            value={loc.phone1}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "phone1",
                                e.target.value
                              )
                            }
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={fieldShellStyle}>
                          <Typography sx={fieldLabelStyle}>
                            Email
                          </Typography>

                          <TextControl
                            value={loc.email}
                            onChange={(e) =>
                              handleLocationChange(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                            fullWidth
                            style={inputStyle}
                          />
                        </Box>
                      </Grid>

                    </Grid>

                  </Box>

                );
              })}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={addLocation}
                sx={{
                  mt: 2,
                  borderRadius: 3,
                  textTransform: "none",
                  px: 3
                }}
              >
                Add Another Location
              </Button>

            </CardContent>

          </Card>
        )}
        {tab === 2 && (
          <Card sx={sectionCardStyle}>
            <Box sx={sectionHeaderStyle}>
              <ContactPhone />
              <Typography variant="h6" fontWeight={600}>
                Contact Persons
              </Typography>
            </Box>

            <CardContent>
              {contacts.map((contact, index) => (
                <Box
                  key={index}
                  sx={{
                    border: "1px solid #dde7f5",
                    borderRadius: 3,
                    p: 2,
                    mb: 2,
                    background: "#fbfdff",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                      minHeight: 32,
                    }}
                  >
                    <Typography fontWeight={600} sx={{ mt: 0.25 }}>
                      Contact #{index + 1}
                    </Typography>

                    {contacts.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => removeContact(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>
                          Role
                        </Typography>
                        <SelectControl
                          name="role"
                          label=""
                          value={contact.role}
                          onChange={(e) =>
                            handleContactChange(index, "role", e.target.value)
                          }
                          options={contactRoleOptions}
                          height={40}
                          fontSize="0.9rem"
                          labelFontWeight={600}
                          shrinkLabel={false}
                          disabled={isDeleteMode}
                          fullWidth
                        />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>Title</Typography>
                        <SelectControl
                          name="contactTitle"
                          value={contact.contactTitle}
                          onChange={(e) =>
                            handleContactChange(index, "contactTitle", e.target.value)
                          }
                          options={titleTextOptions}
                          fullWidth
                          height={40}
                          shrinkLabel={false}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>
                          Contact Name
                          <span style={{ color: "#d32f2f" }}> *</span>
                        </Typography>
                        <TextControl
                          value={contact.name}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          style={inputStyle}
                          fullWidth
                          disabled={isDeleteMode}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>Phone</Typography>
                        <TextControl
                          value={contact.mobile}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "mobile",
                              e.target.value
                            )
                          }
                          // style={{ width: 150 }, inputStyle}
                          style={inputStyle}
                          fullWidth
                          disabled={isDeleteMode}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>Alternate Phone No</Typography>
                        <TextControl
                          value={contact.alternateMobile}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "alternateMobile",
                              e.target.value
                            )
                          }
                          fullWidth
                          style={inputStyle}
                          disabled={isDeleteMode}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={fieldShellStyle}>
                        <Typography sx={fieldLabelStyle}>Email ID</Typography>
                        <TextControl
                          value={contact.email}
                          onChange={(e) =>
                            handleContactChange(
                              index,
                              "email",
                              e.target.value
                            )
                          }
                          fullWidth
                          style={inputStyle}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              ))}

              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={addContact}
                sx={{ borderRadius: 3 }}
                disabled={isDeleteMode}
              >
                Add Contact
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 3 && (
          <Card sx={sectionCardStyle}>
            <Box sx={sectionHeaderStyle}>
              <ReceiptLong />
              <Typography variant="h6" fontWeight={600}>
                Commercial & SAP Details
              </Typography>
            </Box>

            <CardContent>
              <Grid container spacing={2} alignItems="stretch">
                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    <SelectControl
                      label="Sales Organization"
                      name="salesOrganization"
                      value={form.salesOrganization}
                      onChange={handleChange}
                      options={salesOrganizationOptions}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    <SelectControl
                      label="Distribution Channel"
                      name="distributionChannel"
                      value={form.distributionChannel}
                      onChange={handleChange}
                      options={distributionChannelOptions}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    <SelectControl
                      name="paymentTerms"
                      label="Payment Terms"
                      value={form.paymentTerms}
                      onChange={handleChange}
                      required
                      options={paymenttermsOptions}
                      fullWidth
                      disabled={isDeleteMode}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    <SelectControl
                      label="Tax Classification"
                      name="taxclassification"
                      value={form.taxclassification}
                      fullWidth
                      shrinkLabel
                      onChange={handleChange}
                      options={taxClassificationOptions}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    {renderTextField(
                      "Shipping Conditions",
                      "shippingConditions"
                    )}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    {renderTextField("Incoterms", "incoterms", true)}
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Box sx={fieldShellStyle}>
                    {renderTextField("SAP Customer Code", "sapCode")}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ my: 4 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography color="text.secondary">
            {formMode === "delete"
              ? "Delete mode locks the form. Confirm the record reference before deleting."
              : formMode === "edit"
                ? "Edit mode lets you update an existing customer."
                : "New entry mode creates a fresh customer record."}
          </Typography>

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              size="large"
              sx={{ borderRadius: 3, px: 4 }}
              onClick={resetForm}
            >
              {formMode === "new" ? "Reset" : "Cancel"}
            </Button>

            <Button
              variant="contained"
              size="large"
              color={primaryActionColor}
              sx={{
                borderRadius: 3,
                px: 5,
                boxShadow:
                  formMode === "delete"
                    ? "0 8px 18px rgba(211,47,47,0.22)"
                    : "0 8px 18px rgba(15,78,166,0.25)",
              }}
              disabled={saving || loadingRecord}
              onClick={handleSaveBundle}
            >
              {primaryActionLabel}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
