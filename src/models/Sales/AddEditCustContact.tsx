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
import { padding } from "@mui/system";

type Option = { value: string | number; label: string };

interface ContactForm {
  location_id: string;
  contactTitle: string;
  mobile1: string;
  mobile2: string;
  email: string;
}

const emptyForm: ContactForm = {
  location_id: "",
  contactTitle: "",
  mobile1: "",
  mobile2: "",
  email: "",
};

const titleOptions: Option[] = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
];

const AddEditCustContact = () => {
  const navigate = useNavigate();
  const { itemno } = useParams();
  const selectedItemNo = decodeURIComponent(itemno ?? "").trim();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ContactForm>(emptyForm);
  const [customerName, setCustomerName] = useState("");
  const [customerAbb, setCustomerAbb] = useState("");
  const [locationOptions, setLocationOptions] = useState<Option[]>([]);
  const [contactId, setContactId] = useState<string>("");

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSelectChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: String(value ?? "") }));
  };

  const fetchCustomerLabels = async () => {
    if (!selectedItemNo) return;
    const res = await axios.get(`${baseUrl}/api/Sales/CustomerById?itemno=${encodeURIComponent(selectedItemNo)}`);
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    setCustomerName(String(row?.customer ?? ""));
    setCustomerAbb(String(row?.customerAbb ?? ""));
  };

  const fetchLocations = async () => {
    if (!selectedItemNo) return;
    const res = await axios.get(`${baseUrl}/api/Sales/customerlocations?customerId=${encodeURIComponent(selectedItemNo)}`);
    const rows = Array.isArray(res.data) ? res.data : [];
    setLocationOptions(
      rows.map((x: any, idx: number) => ({
        value: x.location_id ?? x.locationId ?? `loc-${idx}`,
        label: String(x.location ?? ""),
      }))
    );
  };

  const fetchExistingContact = async () => {
    if (!selectedItemNo || !form.location_id) return;
    const res = await axios.get(
      `${baseUrl}/api/Sales/customercontacts?customer_id=${encodeURIComponent(selectedItemNo)}&location_id=${encodeURIComponent(form.location_id)}`
    );
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!row) return;
    setContactId(String(row.contact_id  ?? ""));
    setForm((prev) => ({
      ...prev,
      contactTitle: String(row.contactTitle ?? ""),
      mobile1: String(row.mobile1 ?? ""),
      mobile2: String(row.mobile2 ?? ""),
      email: String( row.email11 ?? ""),
    }));
  };

  const validate = () => {
    if (!form.location_id) return "Location is required.";
    if (!form.contactTitle) return "Contact Title is required.";
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

    const payload = {
     // itemno: selectedItemNo,
      customer_id: selectedItemNo,
      contact_id: contactId || undefined,
      location_id: form.location_id,
      contactTitle: form.contactTitle,
      mobile1: form.mobile1.trim(),
      mobile2: form.mobile2.trim(),
      email11: form.email.trim(),
      addedby: loginId,
    };

    setSaving(true);
    try {
      if (mode === "add") {
        await axios.post(`${baseUrl}/api/Sales/AddCustomerContact`, payload);
        toast.success("Customer contact added successfully.");
      } else {
        await axios.put(`${baseUrl}/api/Sales/EditCustomerContact/${selectedItemNo}`, payload);
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
        await Promise.all([fetchCustomerLabels(), fetchLocations()]);
      } catch (error) {
        console.error("Load contact page failed:", error);
        toast.error("Unable to load customer/contact details.");
      } finally {
        setLoadingPage(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemNo]);

  useEffect(() => {
    fetchExistingContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location_id, selectedItemNo]);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 20, px: { xs: 1.5, md: 0 }, fontFamily: "Arial" }}>
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
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, columnGap: 1.5, rowGap: 1.2 }}>
                  <Box  sx={{ p: 1.2 }}>
                    <Label text="Customer Name"  />
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold"  }}>{customerName || "-"}</Typography>
                  </Box>
                  <Box sx={{ p: 1.2 }}>
                    <Label text="Customer Abbreviation"  />
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold" }}>{customerAbb || "-"}</Typography>
                  </Box>
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
                      name="contact_title"
                      label="Contact Title"
                      value={form.contact_title}
                      options={titleOptions}
                      onChange={onSelectChange}
                      height={34}
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
                     <Button variant="contained" size="small" disabled={saving} onClick={() => handleSave("add")}>
                    Add Contact
                  </Button>
                  <Button variant="contained" color="success" size="small" disabled={saving} onClick={() => handleSave("edit")}>
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
