import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Label from "../../components/resusablecontrols/Label";
import TextControl from "../../components/resusablecontrols/TextControl";
import { baseUrl } from "../../const/BaseUrl";
import { standardInputStyle } from "./styles/standardInputStyle";

interface LocationForm {
  location: string;
  address: string;
  phoneno1: string;
  phoneno2: string;
}

const emptyForm: LocationForm = {
  location: "",
  address: "",
  phoneno1: "",
  phoneno2: "",
};

const AddEditCustLocation = () => {
  const navigate = useNavigate();
  const { itemno } = useParams();
  const selectedItemNo = decodeURIComponent(itemno ?? "").trim();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
 const [form, setForm] = useState<LocationForm>(emptyForm);
  const [customerName, setCustomerName] = useState("");
  const [customerAbb, setCustomerAbb] = useState("");
  const [locationId, setLocationId] = useState<string>("");

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const fetchCustomerLabels = async () => {
    if (!selectedItemNo) return;
    const res = await axios.get(`${baseUrl}/api/Sales/CustomerById?itemno=${encodeURIComponent(selectedItemNo)}`);
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    setCustomerName(String(row?.customer ?? ""));
    setCustomerAbb(String(row?.customer_abb ?? ""));
  };

  const fetchExistingLocation = async () => {
    if (!selectedItemNo) return;
    const res = await axios.get(`${baseUrl}/api/Sales/customerlocations?customerId=${encodeURIComponent(selectedItemNo)}`);
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!row) return;
    setLocationId(String(row.location_id ?? row.locationId ?? ""));
    setForm({
      location: String(row.location ?? ""),
      address: String(row.address ?? ""),
      phoneno1: String(row.phoneno1 ?? ""),
      phoneno2: String(row.phoneno2 ?? ""),
    });
  };

  const validate = () => {
    if (!form.location.trim()) return "Location is required.";
    if (!form.address.trim()) return "Address is required.";
    return "";
  };

  const handleSave = async (mode: "add" | "edit") => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    const payload = {
      itemno: selectedItemNo,
      customer_id: selectedItemNo,
      location_id: locationId || undefined,
      location: form.location.trim(),
      address: form.address.trim(),
      phoneno1: form.phoneno1.trim(),
      phoneno2: form.phoneno2.trim(),
      addedby: loginId,
    };

    setSaving(true);
    try {
      if (mode === "add") {
        await axios.post(`${baseUrl}/api/Sales/AddCustomerLocation`, payload);
        toast.success("Customer location added successfully.");
      } else {
        await axios.put(`${baseUrl}/api/Sales/EditCustomerLocation/${selectedItemNo}`, payload);
        toast.success("Customer location updated successfully.");
      }
      navigate("/Home/ViewCustomers?tab=locations");
    } catch (error) {
      console.error("Location save failed:", error);
      toast.error("Unable to save customer location.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        await Promise.all([fetchCustomerLabels(), fetchExistingLocation()]);
      } catch (error) {
        console.error("Load location page failed:", error);
        toast.error("Unable to load customer/location details.");
      } finally {
        setLoadingPage(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemNo]);

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
              Add / Edit Customer Location
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/Home/ViewCustomers?tab=locations")}
              sx={{ minWidth: 140, alignSelf: { xs: "flex-start", md: "center" } }}
            >
              Back to Locations
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
                    <Label text="Customer Name"/>
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold" }}>{customerName || "-"}</Typography>
                  </Box>
                  <Box  sx={{ p: 1.2 }}> 
                    <Label text="Customer Abbreviation"/>
                    <Typography sx={{ mt: 0.7, fontSize: 14, color: "#4782d4", fontWeight: "bold" }}>{customerAbb || "-"}</Typography>
                  </Box>
                  <Box>
                    <Label text="Location" bold />
                    <TextControl name="location" value={form.location} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                  <Box>
                    <Label text="Address" bold />
                    <TextControl name="address" value={form.address} onChange={onTextChange} style={standardInputStyle} multiline rows={2}
                   />
                  </Box>
                  <Box>
                    <Label text="Phone no1" bold />
                    <TextControl name="phoneno1" value={form.phoneno1} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                  <Box>
                    <Label text="Phone no2" bold />
                    <TextControl name="phoneno2" value={form.phoneno2} onChange={onTextChange} style={standardInputStyle} />
                  </Box>
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                  <Button variant="contained" size="small" disabled={saving} onClick={() => handleSave("add")}>
                    Add Location
                  </Button>
                  <Button variant="contained" color="success" size="small" disabled={saving} onClick={() => handleSave("edit")}>
                    Edit Location
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

export default AddEditCustLocation;
