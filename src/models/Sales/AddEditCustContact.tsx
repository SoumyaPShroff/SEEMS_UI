import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Label from "../../components/resusablecontrols/Label";
import TextControl from "../../components/resusablecontrols/TextControl";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import { baseUrl } from "../../const/BaseUrl";
import { standardInputStyle } from "./styles/standardInputStyle";

type Option = { value: string | number; label: string };

interface ContactForm {
  location_id: string;
  contact_id: string;
  customer_id: string;
  ContactTitle: string;
  ContactName: string;
  mobile1: string;
  mobile2: string;
  email: string;
}

const emptyForm: ContactForm = {
  location_id: "",
  contact_id: "",
  customer_id: "",
  ContactTitle: "",
  ContactName: "",
  mobile1: "",
  mobile2: "",
  email: "",
};

const titleOptions: Option[] = [
  { value: "Mr.", label: "Mr." },
  { value: "Mrs.", label: "Mrs." },
  { value: "Ms.", label: "Ms." },
];

const pickValue = (row: any, keys: string[]): string => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "";
};

const normalizeTitle = (value: string): string => {
  const t = value.trim().toLowerCase().replace(".", "");
  if (t === "mr") return "Mr.";
  if (t === "mrs") return "Mrs.";
  if (t === "ms") return "Ms.";
  return value;
};

const AddEditCustContact = () => {
  const navigate = useNavigate();
  const { itemno } = useParams();
  const selectedItemNo = decodeURIComponent(itemno ?? "").trim();
  const isAddNewMode = selectedItemNo.toLowerCase() === "new";

  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [customerName, setCustomerName] = useState("");
  const [customerAbb, setCustomerAbb] = useState("");
  const [customerOptions, setCustomerOptions] = useState<Option[]>([]);
  const [locationOptions, setLocationOptions] = useState<Option[]>([]);
  const [contactId, setContactId] = useState<string>("");
  const [resolvedCustomerId, setResolvedCustomerId] = useState<string>("");

  const currentCustomerId = (resolvedCustomerId || (isAddNewMode ? form.customer_id : selectedItemNo) || "").trim();

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSelectChange = (e: any) => {
    const { name, value } = e.target;
    const nextValue = String(value ?? "");
    if (name === "location_id") {
      setForm((prev) => ({
        ...prev,
        [name]: nextValue,
        mobile1: "",
        mobile2: "",
        email: "",
      }));
      return;
    }
    if (name === "customer_id") {
      setResolvedCustomerId(nextValue);
      setForm((prev) => ({
        ...prev,
        customer_id: nextValue,
        location_id: "",
        mobile1: "",
        mobile2: "",
        email: "",
      }));
      setLocationOptions([]);
      if (nextValue) {
        void fetchCustomerLabels(nextValue);
        void fetchLocations(nextValue);
      } else {
        setCustomerName("");
        setCustomerAbb("");
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const fetchCustomersForNew = async () => {
    const res = await axios.get(`${baseUrl}/api/Sales/Customers`);
    const rows = Array.isArray(res.data) ? res.data : [];
    const mapped = rows
      .map((x: any, idx: number) => ({
        value: String(x.itemno ?? x.customer_id ?? x.customerId ?? `cust-${idx}`),
        label: String(x.customer ?? x.customerName ?? ""),
      }))
      .filter((x: Option) => !!x.label);
    setCustomerOptions(mapped);
  };

  const fetchCustomerLabels = async (customerId: string) => {
    if (!customerId) return;
    const res = await axios.get(`${baseUrl}/api/Sales/CustomerById?itemno=${encodeURIComponent(customerId)}`);
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    setCustomerName(String(row?.customer ?? ""));
    setCustomerAbb(String(row?.customerAbb ?? ""));
  };

  const fetchLocations = async (customerId: string) => {
    if (!customerId) return;
    let rows: any[] = [];

    try {
      const res = await axios.get(`${baseUrl}/api/Sales/customerlocations?customerId=${encodeURIComponent(customerId)}`);
      rows = Array.isArray(res.data) ? res.data : [];
    } catch {
      // Treat "no data"/error from customerId API as empty set and use fallback API.
      rows = [];
    }

    if (rows.length === 0) {
      const allRes = await axios.get(`${baseUrl}/api/Sales/customerlocations`);
      rows = Array.isArray(allRes.data) ? allRes.data : [];
    }

    const locationRows = rows.map((x: any) => ({
      location: String(x.location ?? ""),
      location_id: String(x.location_id ?? x.locationId ?? ""),
    }));

    setLocationOptions(
      locationRows.map((x: any, idx: number) => ({
        value: x.location_id || `loc-${idx}`,
        label: x.location,
      }))
    );
  };

  const fetchExistingContact = async () => {
    if (!currentCustomerId || !form.location_id) return;
    try {
      const effectiveContactId = String(form.contact_id || "").trim();
      const url = effectiveContactId
        ? `${baseUrl}/api/Sales/customercontacts?contactid=${encodeURIComponent(effectiveContactId)}`
        : `${baseUrl}/api/Sales/customercontacts?customer_id=${encodeURIComponent(currentCustomerId)}&location_id=${encodeURIComponent(form.location_id)}`;

      const res = await axios.get(url);
      const dataRows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
      const row = effectiveContactId
        ? dataRows.find((x: any) => String(x.contact_id ??  "") === effectiveContactId)
        : dataRows.find(
            (x: any) => String(x.location_id ?? x.locationId ?? "") === String(form.location_id)
          );
      if (!row) {
        setContactId("");
        setForm((prev) => ({ ...prev, ContactTitle: "", ContactName: "", mobile1: "", mobile2: "", email: "" }));
        return;
      }
      const nextContactId = pickValue(row, ["contact_id", "contactId"]);
      setContactId(nextContactId);
      setForm((prev) => ({
        ...prev,
        contact_id: nextContactId,
        ContactTitle: normalizeTitle(pickValue(row, ["ContactTitle", "contactTitle", "contact_title"])),
        ContactName: pickValue(row, ["ContactName", "contactName", "contact_name"]),
        mobile1: pickValue(row, ["mobile1", "mobile_1", "mobileno1"]),
        mobile2: pickValue(row, ["mobile2", "mobile_2", "mobileno2"]),
        email: pickValue(row, ["email11", "email", "email1"]),
      }));
    } catch {
      setContactId("");
      setForm((prev) => ({ ...prev, ContactTitle: "", ContactName: "", mobile1: "", mobile2: "", email: "" }));
    }
  };

  const tryLoadByContactId = async (maybeContactId: string) => {
    if (!maybeContactId) return false;
    const res = await axios.get(
      `${baseUrl}/api/Sales/customercontacts?contactid=${encodeURIComponent(maybeContactId)}`
    );
    const rows = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    const matched =
      rows.find((x: any) => String(x.contact_id ?? x.contactId ?? "").trim() === maybeContactId) ||
      rows[0];

    if (!matched) return false;

    const customerId = String(matched.customer_id ?? matched.customerId ?? "").trim();
    if (!customerId) return false;

    const matchedContactId = String(matched.contact_id ?? matched.contactId ?? "").trim();
    const matchedLocationId = String(matched.location_id ?? matched.locationId ?? "").trim();
    setResolvedCustomerId(customerId);
    setContactId(matchedContactId);

    setForm((prev) => ({
      ...prev,
      customer_id: customerId,
      contact_id: matchedContactId,
      location_id: matchedLocationId,
      ContactTitle: normalizeTitle(pickValue(matched, ["ContactTitle", "contactTitle", "contact_title"])),
      ContactName: pickValue(matched, ["ContactName", "contactName", "contact_name"]),
      mobile1: pickValue(matched, ["mobile1", "mobile_1", "mobileno1"]),
      mobile2: pickValue(matched, ["mobile2", "mobile_2", "mobileno2"]),
      email: pickValue(matched, ["email11", "email", "email1"]),
    }));

    await Promise.all([fetchCustomerLabels(customerId), fetchLocations(customerId)]);
    return true;
  };

  const validate = () => {
    if (!currentCustomerId) return "Customer is required.";
    if (!form.location_id) return "Location is required.";
    if (!form.ContactTitle) return "Contact Title is required.";
    if (!form.ContactName.trim()) return "Contact Name is required.";
    if (!form.mobile1.trim()) return "Mobile1 is required.";
    if (!form.email.trim()) return "Email is required.";
    return "";
  };

  const handleSave = async (mode: "add" | "edit") => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    if (mode === "edit" && !contactId) {
      toast.error("Contact ID is required for edit.");
      return;
    }

    const basePayload = {
     // itemno: selectedItemNo,
      customer_id: currentCustomerId,
      location_id: form.location_id,
      ContactTitle: form.ContactTitle,
      ContactName: form.ContactName,
      email11: form.email.trim(),
      mobile1: form.mobile1.trim(),
      mobile2: form.mobile2.trim(),
    };

    setSaving(true);
    try {
      if (mode === "add") {
        await axios.post(`${baseUrl}/api/Sales/AddCustContact`, basePayload);
        toast.success("Customer contact added successfully.");
      } else {
        const payload = { ...basePayload, contact_id: contactId };
        await axios.put(`${baseUrl}/api/Sales/EditCustContact/${encodeURIComponent(contactId || selectedItemNo)}`, payload);
        toast.success("Customer contact updated successfully.");
      }
      navigate("/Home/ViewCustomers?tab=contacts");
    } catch (error) {
      console.error("Contact save failed:", error);
      toast.error("Unable to save customer contact.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        if (isAddNewMode) {
          setResolvedCustomerId("");
          setContactId("");
          setForm(emptyForm);
          setCustomerName("");
          setCustomerAbb("");
          setLocationOptions([]);
          await fetchCustomersForNew();
          return;
        }

        const loadedByContactId = await tryLoadByContactId(selectedItemNo);
        if (!loadedByContactId) {
          setResolvedCustomerId(selectedItemNo);
          setForm((prev) => ({ ...prev, customer_id: selectedItemNo }));
          await Promise.all([fetchCustomerLabels(selectedItemNo), fetchLocations(selectedItemNo)]);
        }
      } catch (error) {
        console.error("Load contact page failed:", error);
        toast.error("Unable to load customer/contact details.");
      } finally {
        setLoadingPage(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemNo, isAddNewMode]);

  useEffect(() => {
    fetchExistingContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location_id, currentCustomerId, contactId, form.contact_id]);

  return (
    <Box sx={{ maxWidth: 650, mx: "auto", mt: 20, px: { xs: 1.5, md: 0 }, fontFamily: "Arial" }}>
      <Card
        sx={{
          width: "100%",
          m: "auto",
          mt: 1.25,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.2 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f4ea6" }}>
              Add / Edit Customer Contact
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/Home/ViewCustomers?tab=contacts")}
              sx={{ minWidth: 140, alignSelf: { xs: "flex-start", md: "center" } }}
            >
              Back to Contacts
            </Button>
          </Stack>

          <Box
            sx={{
              mt: 1.2,
              borderRadius: 2,
              border: "1px solid #d5e1f8",
              boxShadow: "0 6px 14px rgba(33, 75, 149, 0.08)",
              background: "#ffffff",
              p: { xs: 1.4, md: 1.7 },
            }}
          >
            {loadingPage ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                <CircularProgress size={26} />
              </Box>
            ) : (
              <>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, columnGap: 1.5, rowGap: 1.2, alignItems: "start" }}>
                  <Box sx={{ p: 0.6 }}>
                    <Label text="Customer Name"  />
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold" }}>{customerName || "-"}</Typography>
                  </Box>
                  <Box sx={{ p: 0.6 }}>
                    <Label text="Customer Abbreviation"  />
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold" }}>{customerAbb || "-"}</Typography>
                  </Box>
                  {isAddNewMode && (
                    <Box sx={{ gridColumn: { xs: "1 / -1", md: "1 / 3" }, p: 0.5 }}>
                      <SelectControl
                        name="customer_id"
                        label="Customer"
                        value={form.customer_id}
                        options={customerOptions}
                        onChange={onSelectChange}
                        required
                        height={34}
                      />
                    </Box>
                  )}
                  <Box>
                    <SelectControl
                      name="location_id"
                      label="Locations"
                      value={form.location_id}
                      options={locationOptions}
                      onChange={onSelectChange}
                      height={34}
                    />
                  </Box>
                  <Box>
                    <SelectControl
                      name="ContactTitle"
                      label="Contact Title"
                      value={form.ContactTitle}
                      options={titleOptions}
                      onChange={onSelectChange}
                      height={34}
                    />
                  </Box>
                  <Box>
                    <Label text="Contact Name" bold />
                    <TextControl
                      name="ContactName"
                      value={form.ContactName}
                      onChange={onTextChange}
                      style={standardInputStyle}
                    />
                  </Box>
                  <Box>
                    <Label text="Mobile1" bold />
                    <TextControl name="mobile1" value={form.mobile1} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                  <Box>
                    <Label text="Mobile2" bold />
                    <TextControl name="mobile2" value={form.mobile2} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                  <Box>
                    <Label text="Email" bold />
                    <TextControl name="email" value={form.email} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                </Box>

             <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                     <Button
                    variant="contained"
                    size="small"
                    disabled={saving || !isAddNewMode}
                    onClick={() => handleSave("add")}
                  >
                    Add Contact
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={saving || isAddNewMode || !contactId}
                    onClick={() => handleSave("edit")}
                  >
                    Edit Contact
                  </Button>
               
                </Stack>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddEditCustContact;
