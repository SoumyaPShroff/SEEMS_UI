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

interface CustomerForm {
  customer: string;
  customer_abb: string;
  gst_no: string;
  sales_resp_id: string;
  customer_Type: string;
  sapcustcode: string;
}

const emptyForm: CustomerForm = {
  customer: "",
  customer_abb: "",
  gst_no: "",
  sales_resp_id: "",
  customer_Type: "",
  sapcustcode: "",
};

const fallbackCustomerTypes: Option[] = [
  { value: "Govt", label: "Domestic" },
  { value: "MNC", label: "MNC" },
  { value: "Export", label: "Export" },
];

const AddEditCustomer = () => {
  const navigate = useNavigate();
  const { itemno } = useParams();
  const selectedItemNo = decodeURIComponent(itemno ?? "").trim();
  const isEditMode = !!selectedItemNo && selectedItemNo.toLowerCase() !== "new";
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [salesRespOptions, setSalesRespOptions] = useState<Option[]>([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState<Option[]>([]);
  const pageTitle = isEditMode ? "Edit Customer Details" : "Add New Customer";
  const loginUser = sessionStorage.getItem("SessionUserName") || "guest";

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSelectChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: String(value ?? "") }));
  };

  const hydrateCustomerForm = (raw: any) => {
    if (!raw) return;
    setForm({
      customer: String(raw.customer ?? ""),
      customer_abb: String(raw.customer_abb ?? ""),
      gst_no: String(raw.gst_no ?? ""),
      sales_resp_id: String(raw.sales_resp_id ?? ""),
      customer_Type: String(raw.customer_Type ?? ""),
      sapcustcode: String(raw.sapcustcode ?? ""),
    });
  };

  const fetchSalesResponsibility = async () => {
    try {
      const res = await axios.get(`${baseUrl}/SalesManagers`);
      const source = Array.isArray(res.data) ? res.data : [];
      const mapped = source
        .map((x: any, idx: number) => ({
          value: x.id ?? `sm-${idx}`,
          label: String(x.name ?? ""),
        }))
        .filter((x: Option) => x.label);
      setSalesRespOptions(mapped);
    } catch (err) {
      console.error("Failed to load Sales Responsibility list:", err);
      setSalesRespOptions([]);
    }
  };

  const setDefaultCustomerTypes = () => {
    setCustomerTypeOptions(fallbackCustomerTypes);
  };

  const fetchEditCustomerDetails = async () => {
    if (!isEditMode || !selectedItemNo) return;
    try {
      const res = await axios.get(
        `${baseUrl}/api/Sales/CustomerById?itemno=${encodeURIComponent(selectedItemNo)}`
      );
      const row = Array.isArray(res.data) ? res.data[0] : res.data;
      if (row) {
        hydrateCustomerForm(row);
        return;
      }
      toast.warning("No data found for selected customer.");
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
      toast.error("Unable to load customer details.");
    }
  };

  const validate = () => {
    if (!form.customer.trim()) return "Customer is required.";
    if (!form.customer_abb.trim()) return "Customer abbreviation is required.";
    if (!form.gst_no.trim()) return "GST number is required.";
    if (!form.sales_resp_id) return "Sales Responsibility is required.";
    if (!form.customer_Type) return "Customer Type is required.";
    return "";
  };

  const saveCustomer = async () => {
    const selectedSalesResp = salesRespOptions.find(
      (opt) => String(opt.value) === String(form.sales_resp_id)
    );

    const payload = {
      itemno: isEditMode ? selectedItemNo : undefined,
      customer: form.customer.trim(),
      customer_abb: form.customer_abb.trim(),
      gst_no: form.gst_no.trim(),
      sales_resp_id: String(form.sales_resp_id),
      sales_resp: String(selectedSalesResp?.label ?? ""),
      customer_Type: form.customer_Type,
      sapcustcode: form.sapcustcode.trim(),
      addedby: loginUser,
     // addeddate: new Date().toISOString(), // api service takes care of this
    };

    if (isEditMode) {
      await axios.put(`${baseUrl}/api/Sales/EditCustomer/${selectedItemNo}`, payload);
    } else {
      await axios.post(`${baseUrl}/api/Sales/AddCustomer`, payload);
    }
  };

  const handleSave = async (mode: "add" | "edit") => {
    if (mode === "add" && isEditMode) return;
    if (mode === "edit" && !isEditMode) return;

    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSaving(true);
    try {
      await saveCustomer();
      toast.success(isEditMode ? "Customer updated successfully." : "Customer added successfully.");
      navigate("/Home/ViewCustomers");
    } catch (err) {
      console.error("Customer save failed:", err);
      toast.error("Unable to save customer details.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoadingPage(true);
      try {
        setDefaultCustomerTypes();
        await fetchSalesResponsibility();
        await fetchEditCustomerDetails();
      } finally {
        setLoadingPage(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemNo]);

  return (
    <Box
      sx={{
        maxWidth: 600,
        mx: "auto",
        mt: 20,
        px: { xs: 1.5, md: 0 },
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
          "& .MuiTypography-root, & .MuiInputBase-input, & .MuiInputLabel-root": {
            fontFamily: "Arial",
          },
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.2 } }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "#0f4ea6", letterSpacing: "0.01em", fontSize: { xs: "1rem", md: "1.1rem" } }}
            >
              {pageTitle}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/Home/ViewCustomers")}
              sx={{ minWidth: 140, alignSelf: { xs: "flex-start", md: "center" } }}
            >
              Back to Customers
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
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    columnGap: 1.5,
                    rowGap: 1.2,
                    alignItems: "start",
                  }}
                >
                  <Box>
                    <Label text="Customer" bold required />
                    <TextControl
                      name="customer"
                      value={form.customer}
                      onChange={onTextChange}
                      placeholder="Enter customer name"
                      style={standardInputStyle}
                    />
                  </Box>

                  <Box>
                    <Label text="Customer Abbreviation" bold required />
                    <Box sx={{ maxWidth: 260 }}>
                      <TextControl
                        name="customer_abb"
                        value={form.customer_abb}
                        onChange={onTextChange}
                        placeholder="Enter abbreviation"
                        style={standardInputStyle}
                      />
                    </Box>
                    <Typography sx={{ mt: 0.6, fontSize: 12, color: "#5f6f86" }}>
                      Maximum Characters allowed in Customer abbrevation are 4 and Minimum 3
                    </Typography>
                  </Box>

                  <Box>
                    <Label text="GST No" bold required />
                    <Box sx={{ maxWidth: 260 }}>
                      <TextControl
                        name="gst_no"
                        value={form.gst_no}
                        onChange={onTextChange}
                        placeholder="Enter GST number"
                        style={standardInputStyle}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ maxWidth: 260 }}>
                      <SelectControl
                        name="sales_resp_id"
                        label="Sales Responsibility"
                        value={form.sales_resp_id}
                        options={salesRespOptions}
                        onChange={onSelectChange}
                        required
                        height={34}
                        sx={{ mt: 2.3 }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ maxWidth: 260 }}>
                      <SelectControl
                        name="customer_Type"
                        label="Type"
                        value={form.customer_Type}
                        options={customerTypeOptions}
                        onChange={onSelectChange}
                        required
                        height={34}
                        fullWidth
                        sx={{ mt: 2.3 }}
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Label text="SAP Customer Code" bold  />
                    <TextControl 
                      name="sapcustcode"
                      value={form.sapcustcode}
                      onChange={onTextChange}
                      placeholder="Enter SAP code"
                      style={{ ...standardInputStyle, mt: 2 }}
                     />
                  </Box>
                </Box>

                <Stack direction="row"  spacing={1} sx={{ mt: 2, justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    size="small"
                    disabled={saving || isEditMode}
                    onClick={() => handleSave("add")}
                  >
                    Add New Customer
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    disabled={saving || !isEditMode}
                    onClick={() => handleSave("edit")}
                  >
                    Edit Customer
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

export default AddEditCustomer;
