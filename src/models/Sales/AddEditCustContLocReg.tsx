import { useEffect, useState, type ChangeEvent } from "react";
import {  Box,  Grid,  Card,  CardContent,  Typography,  Button,  Divider,  Checkbox,  FormControlLabel,  Tabs,
  Tab,  Chip,  IconButton,  Paper,} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import TextControl from "../../components/resusablecontrols/TextControl";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import {  Add,  Delete,  Business,  ContactPhone,  LocationOn,  ReceiptLong,} from "@mui/icons-material";

const customerTypes = ["DOMESTIC", "SEZ", "Export", "Govt", "MNC"];
const currencies = ["INR", "USD", "EUR"];
const paymentTerms = ["Advance", "30 Days", "45 Days", "60 Days"];
const contactRoles = ["Technical", "Purchase", "Finance"];
const customerAccountGroups = [
  "Domestic",
  "Export",
  "SEZ",
  "Government",
  "Trading",
];
const titleTexts = ["Mr.", "Mrs.", "Ms.", "M/s"];
// const coSearchTerms = [
//   "Billing",
//   "Shipping",
//   "Accounts",
//   "Operations",
//   "General",
// ];
const industryGroups = [
  "Manufacturing",
  "Others",
];

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
  salesOffice: string;
  salesOrganization: string;
  distributionChannel: string;
  division: string;
  customerAccountGroup: string;
  titleText: string;
  coSearchTerm1: string;
  reconciliationAccountGL: string;
  languageKey: string;
  paymentTerms: string;
  shippingConditions: string;
  incoterms: string;
  exchangeRateType: string;
  taxClassification: string;
  sapCode: string;
  billCompany: string;
  billAddress1: string;
  billAddress2: string;
  billCity: string;
  billState: string;
  billCountry: string;
  billPincode: string;
  billPhone: string;
  billEmail: string;
  shipCompany: string;
  shipAddress1: string;
  shipAddress2: string;
  shipCity: string;
  shipState: string;
  shipCountry: string;
  shipPincode: string;
  shipPhone: string;
  shipEmail: string;
};

type ContactRow = {
  contactId: string;
  locationId: string;
  role: string;
  name: string;
  mobile: string;
  alternateMobile: string;
  email: string;
};

type AddressFields = {
  address1: string;
  address2: string;
  city: string;
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
  const [billLocationId, setBillLocationId] = useState("");
  const [shipLocationId, setShipLocationId] = useState("");
  const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [saving, setSaving] = useState(false);
  const [salesRespOptions, setSalesRespOptions] = useState<Option[]>([]);

  const [sameAddress, setSameAddress] = useState(false);

  const [contacts, setContacts] = useState<ContactRow[]>([
    {
      contactId: "",
      locationId: "",
      role: "Technical",
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
    salesOffice: "",
    salesOrganization: "",
    distributionChannel: "",
    division: "",
    customerAccountGroup: "",
    titleText: "",
    coSearchTerm1: "",
    reconciliationAccountGL: "",
    languageKey: "English",
    paymentTerms: "",
    shippingConditions: "",
    incoterms: "",
    exchangeRateType: "",
    taxClassification: "",
    sapCode: "",

    billCompany: "",
    billAddress1: "",
    billAddress2: "",
    billCity: "",
    billState: "",
    billCountry: "",
    billPincode: "",
    billPhone: "",
    billEmail: "",

    shipCompany: "",
    shipAddress1: "",
    shipAddress2: "",
    shipCity: "",
    shipState: "",
    shipCountry: "",
    shipPincode: "",
    shipPhone: "",
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

  const copyBillToShip = (checked: boolean) => {
    setSameAddress(checked);

    if (checked) {
      setForm((prev) => ({
        ...prev,
        shipCompany: prev.billCompany,
        shipAddress1: prev.billAddress1,
        shipAddress2: prev.billAddress2,
        shipCity: prev.billCity,
        shipState: prev.billState,
        shipCountry: prev.billCountry,
        shipPincode: prev.billPincode,
        shipPhone: prev.billPhone,
        shipEmail: prev.billEmail,
      }));
    }
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
  const customerAccountGroupOptions = customerAccountGroups.map((item) => ({
    value: item,
    label: item,
  }));
  const IndustryGroupOptions = industryGroups.map((item) => ({
    value: item,
    label: item,
  }));
  const titleTextOptions = titleTexts.map((item) => ({
    value: item,
    label: item,
  }));
  // const coSearchTermOptions = coSearchTerms.map((item) => ({
  //   value: item,
  //   label: item,
  // }));
  const paymentTermsOptions = paymentTerms.map((item) => ({
    value: item,
    label: item,
  }));
  const contactRoleOptions = contactRoles.map((item) => ({
    value: item,
    label: item,
  }));

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
    setForm({
      salesRespId: String(raw.sales_resp_id ?? raw.salesRespId ?? ""),
      customerType: String(raw.customer_Type ?? raw.customerType ?? ""),
      companyName: String(raw.customer ?? raw.companyName ?? ""),
      customerAbb: String(raw.customer_abb ?? raw.customerAbb ?? ""),
      gstNo: String(raw.gst_no ?? raw.gstNo ?? ""),
      panNo: String(raw.pan_no ?? raw.panNo ?? ""),
      currency: String(raw.currency ?? "INR"),
      industry: String(raw.industry ?? ""),
      salesOffice: String(raw.salesOffice ?? ""),
      salesOrganization: String(raw.salesOrganization ?? ""),
      distributionChannel: String(raw.distributionChannel ?? ""),
      division: String(raw.division ?? ""),
      customerAccountGroup: String(raw.customerAccountGroup ?? ""),
      titleText: String(raw.titleText ?? ""),
      coSearchTerm1: String(raw.coSearchTerm1 ?? ""),
      reconciliationAccountGL: String(raw.reconciliationAccountGL ?? ""),
      languageKey: String(raw.languageKey ?? "English"),
      paymentTerms: String(raw.paymentTerms ?? ""),
      shippingConditions: String(raw.shippingConditions ?? ""),
      incoterms: String(raw.incoterms ?? ""),
      exchangeRateType: String(raw.exchangeRateType ?? ""),
      taxClassification: String(raw.taxClassification ?? ""),
      sapCode: String(raw.sapcustcode ?? raw.sapCode ?? ""),
      billCompany: String(raw.billCompany ?? ""),
      billAddress1: String(raw.billAddress1 ?? ""),
      billAddress2: String(raw.billAddress2 ?? ""),
      billCity: String(raw.billCity ?? ""),
      billState: String(raw.billState ?? ""),
      billCountry: String(raw.billCountry ?? ""),
      billPincode: String(raw.billPincode ?? ""),
      billPhone: String(raw.billPhone ?? ""),
      billEmail: String(raw.billEmail ?? ""),
      shipCompany: String(raw.shipCompany ?? ""),
      shipAddress1: String(raw.shipAddress1 ?? ""),
      shipAddress2: String(raw.shipAddress2 ?? ""),
      shipCity: String(raw.shipCity ?? ""),
      shipState: String(raw.shipState ?? ""),
      shipCountry: String(raw.shipCountry ?? ""),
      shipPincode: String(raw.shipPincode ?? ""),
      shipPhone: String(raw.shipPhone ?? ""),
      shipEmail: String(raw.shipEmail ?? ""),
    });
    setSameAddress(
      Boolean(
        raw.shipCompany &&
          raw.shipCompany === raw.billCompany &&
          raw.shipAddress1 === raw.billAddress1
      )
    );
  };

  const splitAddressFields = (addressText: string) => {
    const parts = String(addressText ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      address1: parts[0] ?? "",
      address2: parts[1] ?? "",
      city: parts[2] ?? "",
      state: parts[3] ?? "",
      country: parts[4] ?? "",
      pincode: parts[5] ?? "",
    };
  };

  const buildAddressText = (address1: string, address2: string, city: string, state: string, country: string, pincode: string) =>
    [address1, address2, city, state, country, pincode].map((part) => String(part ?? "").trim()).filter(Boolean).join("\n");

  const hydrateLocations = (rows: Record<string, unknown>[]) => {
    const normalized = rows.map((row) => ({
      locationId: String(row.location_id ?? row.locationId ?? "").trim(),
      location: String(row.location ?? "").trim(),
      address: String(row.address ?? "").trim(),
      phoneno1: String(row.phoneno1 ?? "").trim(),
      phoneno2: String(row.phoneno2 ?? "").trim(),
    })).filter((row) => row.locationId || row.location);

    const billRow = normalized.find((row) => /bill/i.test(row.location)) ?? normalized[0];
    const shipRow = normalized.find((row) => /ship/i.test(row.location)) ?? normalized[1] ?? normalized[0];

    if (billRow) {
      const billAddress = splitAddressFields(billRow.address);
      setBillLocationId(billRow.locationId);
      setForm((prev) => ({
        ...prev,
        billCompany: billRow.location,
        billAddress1: billAddress.address1,
        billAddress2: billAddress.address2,
        billCity: billAddress.city,
        billState: billAddress.state,
        billCountry: billAddress.country,
        billPincode: billAddress.pincode,
        billPhone: billRow.phoneno1,
        billEmail: "",
      }));
    }

    if (shipRow) {
      const shipAddress = splitAddressFields(shipRow.address);
      setShipLocationId(shipRow.locationId);
      setForm((prev) => ({
        ...prev,
        shipCompany: shipRow.location,
        shipAddress1: shipAddress.address1,
        shipAddress2: shipAddress.address2,
        shipCity: shipAddress.city,
        shipState: shipAddress.state,
        shipCountry: shipAddress.country,
        shipPincode: shipAddress.pincode,
        shipPhone: shipRow.phoneno1,
        shipEmail: "",
      }));
    }

    setSameAddress(Boolean(billRow && shipRow && billRow.locationId === shipRow.locationId));
  };

  const hydrateContacts = (rows: Record<string, unknown>[]) => {
    const normalized = rows
      .map((row) => ({
        contactId: String(row.contact_id ?? row.contactId ?? "").trim(),
        locationId: String(row.location_id ?? row.locationId ?? "").trim(),
        role: String(row.ContactTitle ?? row.contactTitle ?? row.contact_title ?? "Technical"),
        name: String(row.ContactName ?? row.contactName ?? row.contact_name ?? ""),
        mobile: String(row.mobile1 ?? row.mobile_1 ?? row.mobileno1 ?? ""),
        alternateMobile: String(row.mobile2 ?? row.mobile_2 ?? row.mobileno2 ?? ""),
        email: String(row.email11 ?? row.email ?? row.email1 ?? ""),
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
    setSameAddress(false);
    setContacts([
      {
        contactId: "",
        locationId: "",
        role: "Technical",
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
      salesOffice: "",
      salesOrganization: "",
      distributionChannel: "",
      division: "",
      customerAccountGroup: "",
      titleText: "",
      coSearchTerm1: "",
      reconciliationAccountGL: "",
      languageKey: "English",
      paymentTerms: "",
      shippingConditions: "",
      incoterms: "",
      exchangeRateType: "",
      taxClassification: "",
      sapCode: "",
      billCompany: "",
      billAddress1: "",
      billAddress2: "",
      billCity: "",
      billState: "",
      billCountry: "",
      billPincode: "",
      billPhone: "",
      billEmail: "",
      shipCompany: "",
      shipAddress1: "",
      shipAddress2: "",
      shipCity: "",
      shipState: "",
      shipCountry: "",
      shipPincode: "",
      shipPhone: "",
      shipEmail: "",
    });
  };

  const handleModeChange = (mode: "new" | "edit" | "delete") => {
    setFormMode(mode);
    setSelectedCustomerId("");
    setBillLocationId("");
    setShipLocationId("");
    setSameAddress(false);
    setContacts([
      {
        contactId: "",
        locationId: "",
        role: "Technical",
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
      salesOffice: "",
      salesOrganization: "",
      distributionChannel: "",
      division: "",
      customerAccountGroup: "",
      titleText: "",
      coSearchTerm1: "",
      reconciliationAccountGL: "",
      languageKey: "English",
      paymentTerms: "",
      shippingConditions: "",
      incoterms: "",
      exchangeRateType: "",
      taxClassification: "",
      sapCode: "",
      billCompany: "",
      billAddress1: "",
      billAddress2: "",
      billCity: "",
      billState: "",
      billCountry: "",
      billPincode: "",
      billPhone: "",
      billEmail: "",
      shipCompany: "",
      shipAddress1: "",
      shipAddress2: "",
      shipCity: "",
      shipState: "",
      shipCountry: "",
      shipPincode: "",
      shipPhone: "",
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

  const buildCustomerPayload = (customerId?: string) => ({
    itemno: customerId ? Number(customerId) : undefined,
    customer: form.companyName.trim(),
    customer_abb: form.customerAbb.trim(),
    gst_no: form.gstNo.trim(),
    sales_resp_id: String(form.salesRespId ?? ""),
    sales_resp: getSalesRespLabel(String(form.salesRespId ?? "")),
    customer_Type: form.customerType,
    sapcustcode: form.sapCode.trim(),
    addedby: sessionStorage.getItem("SessionUserName") || "guest",
  });

  const buildLocationPayload = (
    customerId: string,
    locationId: string,
    locationName: string,
    addressLines: AddressFields,
    phone: string
  ) => ({
    itemno: customerId,
    customer_id: customerId,
    location_id: locationId ? Number(locationId) : undefined,
    location: locationName.trim(),
    address: buildAddressText(
      addressLines.address1,
      addressLines.address2,
      addressLines.city,
      addressLines.state,
      addressLines.country,
      addressLines.pincode
    ),
    phoneno1: phone.trim(),
    phoneno2: "",
    addedby: sessionStorage.getItem("SessionUserName") || "guest",
  });

  const buildContactPayload = (customerId: string, locationId: string, contact: ContactRow) => ({
    customer_id: Number(customerId),
    location_id: Number(locationId),
    ContactTitle: contact.role,
    ContactName: contact.name.trim(),
    email11: contact.email.trim(),
    mobile1: contact.mobile.trim(),
    mobile2: contact.alternateMobile.trim(),
  });

  const isContactRowPopulated = (contact: ContactRow) =>
    [contact.contactId, contact.locationId, contact.name, contact.mobile, contact.alternateMobile, contact.email].some(
      (value) => String(value ?? "").trim() !== ""
    );

  const validateContactRows = () => {
    const rows = contacts.filter(isContactRowPopulated);

    for (const contact of rows) {
      if (!String(contact.role ?? "").trim()) return "Contact title is required.";
      if (!String(contact.name ?? "").trim()) return "Contact name is required.";
      if (!String(contact.mobile ?? "").trim()) return "Contact mobile is required.";
      if (!String(contact.email ?? "").trim()) return "Contact email is required.";
    }

    return "";
  };

  const validateForm = () => {
    if (!form.companyName.trim()) return "Customer name is required.";
    if (!form.customerAbb.trim()) return "Customer abbreviation is required.";
    if (!form.gstNo.trim()) return "GST number is required.";
    if (!form.salesRespId.trim()) return "Sales responsibility is required.";
    if (!form.customerType.trim()) return "Customer type is required.";
    if (!form.paymentTerms.trim()) return "Payment terms is required.";
    if (!form.incoterms.trim()) return "Incoterms is required.";
    if (!form.billCompany.trim()) return "Bill to company name is required.";
    if (!form.billAddress1.trim()) return "Bill to address is required.";
    if (!form.shipCompany.trim() && !sameAddress) return "Ship to company name is required.";
    if (!form.shipAddress1.trim() && !sameAddress) return "Ship to address is required.";
    const contactError = validateContactRows();
    if (contactError) return contactError;
    return "";
  };

  const saveCustomerRecord = async (customerId?: string): Promise<SavedRecordResponse> => {
    const payload = buildCustomerPayload(customerId);
    if (formMode === "edit" && customerId) {
      const res = await axios.put<SavedRecordResponse>(`${baseUrl}/api/Sales/EditCustomer/${encodeURIComponent(customerId)}`, payload);
      return res.data;
    }

    const res = await axios.post<SavedRecordResponse>(`${baseUrl}/api/Sales/AddCustomer`, payload);
    return res.data;
  };

  const saveLocationRecord = async (
    customerId: string,
    locationId: string,
    locationName: string,
    addressLines: AddressFields,
    phone: string
  ): Promise<SavedRecordResponse> => {
    const payload = buildLocationPayload(customerId, locationId, locationName, addressLines, phone);
    if (locationId) {
      const res = await axios.put<SavedRecordResponse>(
        `${baseUrl}/api/Sales/EditCustLocation/${encodeURIComponent(locationId)}?customerId=${encodeURIComponent(customerId)}`,
        payload
      );
      return res.data;
    }

    const res = await axios.post<SavedRecordResponse>(`${baseUrl}/api/Sales/AddCustLocation`, payload);
    return res.data;
  };

  const saveContactRecord = async (customerId: string, contact: ContactRow, locationId: string) => {
    const payload = buildContactPayload(customerId, locationId, contact);
    if (contact.contactId) {
      const res = await axios.put(
        `${baseUrl}/api/Sales/EditCustContact/${encodeURIComponent(contact.contactId)}`,
        { ...payload, contact_id: Number(contact.contactId) }
      );
      return res.data;
    }

    const res = await axios.post(`${baseUrl}/api/Sales/AddCustContact`, payload);
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
      const savedCustomerId = String(customerResult?.itemno ?? customerResult?.itemNo ?? currentCustomerId ?? "").trim();

      if (!savedCustomerId) {
        throw new Error("Customer save did not return an item number.");
      }

      const savedBillLocation = await saveLocationRecord(
        savedCustomerId,
        billLocationId,
        form.billCompany,
        {
          address1: form.billAddress1,
          address2: form.billAddress2,
          city: form.billCity,
          state: form.billState,
          country: form.billCountry,
          pincode: form.billPincode,
        },
        form.billPhone
      );

      const effectiveBillLocationId = String(
          savedBillLocation?.location_id ?? savedBillLocation?.locationId ?? billLocationId ?? ""
      ).trim();

      let effectiveShipLocationId = shipLocationId;
      if (sameAddress) {
        effectiveShipLocationId = effectiveBillLocationId;
      } else {
        const savedShipLocation = await saveLocationRecord(
          savedCustomerId,
          shipLocationId,
          form.shipCompany,
          {
            address1: form.shipAddress1,
            address2: form.shipAddress2,
            city: form.shipCity,
            state: form.shipState,
            country: form.shipCountry,
            pincode: form.shipPincode,
          },
          form.shipPhone
        );
        effectiveShipLocationId = String(
          savedShipLocation?.location_id ?? savedShipLocation?.locationId ?? shipLocationId ?? ""
      ).trim();
      }

      const contactRows = contacts.filter(isContactRowPopulated);

      for (const contact of contactRows) {
        const targetLocationId = String(contact.locationId || effectiveBillLocationId || effectiveShipLocationId || "").trim();
        if (!targetLocationId) {
          throw new Error("Unable to determine a location for one or more contacts.");
        }
        await saveContactRecord(savedCustomerId, contact, targetLocationId);
      }

      setSelectedCustomerId(savedCustomerId);
      setBillLocationId(effectiveBillLocationId);
      setShipLocationId(effectiveShipLocationId);
      setFormMode("edit");
      toast.success(formMode === "new" ? "Customer saved successfully." : "Customer updated successfully.");
      await loadCustomerForMode(savedCustomerId);
      void loadCustomers();
    } catch (error) {
      console.error("Bundle save failed:", error);
      toast.error("Unable to save the customer bundle.");
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
  }, []);

  useEffect(() => {
    if (formMode === "edit" || formMode === "delete") {
      void loadCustomers();
    }
  }, [formMode]);

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
                {form.customerType === "DOMESTIC" && renderTextField("GST Number", "gstNo", true)}
  
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
<SelectControl
  name="industry"
  label="Industry"
  value={form.industry}
  onChange={handleChange}
  options={IndustryGroupOptions}
  required
  width="100%"
  height={40}
  fontSize="0.9rem"
  labelFontWeight={600}
  shrinkLabel={false}
  disabled={isDeleteMode}
/>
                {renderTextField("Sales Office", "salesOffice")}

                <SelectControl
                  name="customerAccountGroup"
                  label="Customer Account Group"
                  value={form.customerAccountGroup}
                  onChange={handleChange}
                  options={customerAccountGroupOptions}
                  width="100%"
                  height={40}
                  fontSize="0.9rem"
                  labelFontWeight={600}
                  shrinkLabel
                  disabled={isDeleteMode}
                />

                <SelectControl
                  name="titleText"
                  label="Title Text"
                  value={form.titleText}
                  onChange={handleChange}
                  options={titleTextOptions}
                  width="100%"
                  height={40}
                  fontSize="0.9rem"
                  labelFontWeight={600}
                  shrinkLabel
                  disabled={isDeleteMode}
                />

                {/* <SelectControl
                  name="coSearchTerm1"
                  label="Co-Search Term 1"
                  value={form.coSearchTerm1}
                  onChange={handleChange}
                  options={coSearchTermOptions}
                  width="100%"
                  height={40}
                  fontSize="0.9rem"
                  labelFontWeight={600}
                  shrinkLabel
                  disabled={isDeleteMode}
                /> */}

                <Box sx={{ gridColumn: { xs: "auto", md: "1 / -1" } }}>
                  {renderTextField("Reconciliation Account in General Ledger", "reconciliationAccountGL")}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {tab === 1 && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={sectionCardStyle}>
                <Box sx={sectionHeaderStyle}>
                  <LocationOn />
                  <Typography variant="h6" fontWeight={600}>
                    Bill To Address
                  </Typography>
                </Box>

                <CardContent>
                  <Grid container spacing={2} alignItems="stretch">
                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Company Name",
                        "billCompany",
                        true
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Address Line 1",
                        "billAddress1",
                        true,
                        true,
                        2
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Address Line 2",
                        "billAddress2",
                        false,
                        true,
                        2
                      )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("City", "billCity", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("State", "billState", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Country", "billCountry", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Pincode", "billPincode", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Phone", "billPhone")}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Email ID", "billEmail")}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={sectionCardStyle}>
                <Box sx={sectionHeaderStyle}>
                  <LocationOn />
                  <Typography variant="h6" fontWeight={600}>
                    Ship To Address
                  </Typography>
                </Box>

                <CardContent>
                  <FormControlLabel
                    control={
                    <Checkbox
                        checked={sameAddress}
                        onChange={(e) =>
                          copyBillToShip(e.target.checked)
                        }
                        disabled={isDeleteMode}
                      />
                    }
                    label="Same as Bill To"
                    sx={{ mb: 2 }}
                  />

                  <Grid container spacing={2} alignItems="stretch">
                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Company Name",
                        "shipCompany",
                        true
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Address Line 1",
                        "shipAddress1",
                        true,
                        true,
                        2
                      )}
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      {renderTextField(
                        "Address Line 2",
                        "shipAddress2",
                        false,
                        true,
                        2
                      )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("City", "shipCity", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("State", "shipState", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Country", "shipCountry", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Pincode", "shipPincode", true)}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Phone", "shipPhone")}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      {renderTextField("Email", "shipEmail")}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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
                    <Grid size={{ xs: 12, md: 3 }}>
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
                          width="100%"
                          height={40}
                          fontSize="0.9rem"
                          labelFontWeight={600}
                          shrinkLabel={false}
                          disabled={isDeleteMode}
                        />
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
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
                          fullWidth
                          style={inputStyle}
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
                          fullWidth
                          style={inputStyle}
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

                    <Grid size={{ xs: 12, md: 2 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField(
                    "Sales Organization",
                    "salesOrganization",
                    true
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField(
                    "Distribution Channel",
                    "distributionChannel"
                  )}
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField("Division", "division")}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: "flex", width: "100%", minHeight: 52 }}>
                     <SelectControl
                      name="paymentTerms"
                      label="Payment Terms"
                      value={form.paymentTerms}
                      onChange={handleChange}
                      required
                      options={paymentTermsOptions}
                      fullWidth={false}
                      width={240}
                      height={40}
                      fontSize="0.9rem"
                      labelFontWeight={600}
                      shrinkLabel
                      sx={{ width: "100%", mt: "auto" }}
                      disabled={isDeleteMode}
                    />
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField(
                    "Shipping Conditions",
                    "shippingConditions"
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField("Incoterms", "incoterms", true)}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField(
                    "Exchange Rate Type",
                    "exchangeRateType"
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField(
                    "Tax Classification",
                    "taxClassification"
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  {renderTextField("SAP Customer Code", "sapCode")}
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
