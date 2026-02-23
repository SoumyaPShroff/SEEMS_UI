import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Box, Button, CircularProgress, Paper, Tab, Tabs, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useNavigate, useSearchParams } from "react-router-dom";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { baseUrl } from "../../const/BaseUrl";
import { toast } from "react-toastify";

type ViewTab = "customers" | "locations" | "contacts";

//const ACCESS_PAGE_KEYS = ["ViewCustomers"];

const parseRoleFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
};

const getCustomerId = (row: any): string =>
  String(row?.customer_id ?? row?.itemno ?? row?.customerId ?? "").trim();

const ViewCustomers = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [activeTab, setActiveTab] = useState<ViewTab>("customers");
  const [roleFlag, setRoleFlag] = useState<boolean | null>(null);

  const [customerRows, setCustomerRows] = useState<any[]>([]);
  const [locationRows, setLocationRows] = useState<any[]>([]);
  const [contactRows, setContactRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
 // const [selectedLocationCustomerId, setSelectedLocationCustomerId] = useState("");
 // const [selectedContactCustomerId, setSelectedContactCustomerId] = useState("");

  useEffect(() => {
    const requestedTab = (searchParams.get("tab") || "").toLowerCase();
    if (requestedTab === "customers" || requestedTab === "locations" || requestedTab === "contacts") {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);


  const loadRoleFlag = useCallback(async (): Promise<boolean> => {
    const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
    const userRole = userRoleRes.data;

    //   for (const key of ACCESS_PAGE_KEYS) {
    try {
      const roleCheck = await axios.get(`${baseUrl}/UserRoleInternalRights/${userRole}/viewcustomers`);
      if (parseRoleFlag(roleCheck.data)) return true;
    } catch {
      // Try next key variant.
    }
    //  }

    return false;
  }, [loginId]);

  const getOrLoadRoleFlag = useCallback(async (): Promise<boolean> => {
    if (roleFlag !== null) return roleFlag;
    const flag = await loadRoleFlag();
    setRoleFlag(flag);
    return flag;
  }, [loadRoleFlag, roleFlag]);

  const fetchCustomersByRights = useCallback(
    async (hasAllAccess: boolean): Promise<any[]> => {
      const endpoint = `${baseUrl}/api/Sales/Customers`;
      if (hasAllAccess) {
        const allRes = await axios.get(endpoint);
        return Array.isArray(allRes.data) ? allRes.data : [];
      }

      const scopedRes = await axios.get(endpoint, {
        params: { sales_resp_id: loginId },
      });
      return Array.isArray(scopedRes.data) ? scopedRes.data : [];
    },
    [loginId]
  );

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const hasAllAccess = await getOrLoadRoleFlag();
      const rows = await fetchCustomersByRights(hasAllAccess);
      setCustomerRows(rows);
    } catch (err) {
      console.error("Error loading customers:", err);
      setCustomerRows([]);
      toast.error("Unable to load customer records.");
    } finally {
      setLoading(false);
    }
  }, [fetchCustomersByRights, getOrLoadRoleFlag]);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const hasAllAccess = await getOrLoadRoleFlag();
      const res = await axios.get(`${baseUrl}/api/Sales/customerlocations`);
      let rows = Array.isArray(res.data) ? res.data : [];

      if (!hasAllAccess) {
        const scopedCustomers = await fetchCustomersByRights(false);
        const allowedCustomerIds = new Set(scopedCustomers.map(getCustomerId).filter(Boolean));
        rows = rows.filter((row: any) => allowedCustomerIds.has(getCustomerId(row)));
      }

      setLocationRows(rows);
    } catch (err) {
      console.error("Error loading locations:", err);
      setLocationRows([]);
      toast.error("Unable to load locations.");
    } finally {
      setLoading(false);
    }
  }, [fetchCustomersByRights, getOrLoadRoleFlag]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const hasAllAccess = await getOrLoadRoleFlag();
      const res = await axios.get(`${baseUrl}/api/Sales/customercontacts`);
      let rows = Array.isArray(res.data) ? res.data : [];

      if (!hasAllAccess) {
        const scopedCustomers = await fetchCustomersByRights(false);
        const allowedCustomerIds = new Set(scopedCustomers.map(getCustomerId).filter(Boolean));
        rows = rows.filter((row: any) => allowedCustomerIds.has(getCustomerId(row)));
      }

      setContactRows(rows);
    } catch (err) {
      console.error("Error loading contacts:", err);
      setContactRows([]);
      toast.error("Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }, [fetchCustomersByRights, getOrLoadRoleFlag]);

  useEffect(() => {
    if (activeTab === "customers") {
      loadCustomers();
      return;
    }
    if (activeTab === "locations") {
      loadLocations();
      return;
    }
    loadContacts();
  }, [activeTab, loadContacts, loadCustomers, loadLocations]);

  const rows = activeTab === "customers" ? customerRows : activeTab === "locations" ? locationRows : contactRows;

  const actionLink = (label: string, onClick: () => void) => (
    <a
      href="#"
      style={{
        color: "#1976d2",
        cursor: "pointer",
        textDecoration: "underline",
      }}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      {label}
    </a>
  );

  const customerColumns: GridColDef[] = useMemo(
    () => [
      { field: "customer", headerName: "Customer", minWidth: 280, flex: 1 },
      { field: "customer_abb", headerName: "Abbrev", minWidth: 90, flex: 1 },
      { field: "sales_resp", headerName: "Sales Resp", minWidth: 180, flex: 1 },
      {
        field: "editCustomer",
        headerName: "Edit Customer",
        minWidth: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) =>
          actionLink("Edit Customer", () => {
            const id = getCustomerId(params.row) || String(params.row?.id ?? "");
            navigate(`/Home/AddEditCustomer/${encodeURIComponent(id)}`);
          }),
      },

      { field: "customer_Type", headerName: "Type", minWidth: 110, flex: 1 },
      { field: "sapcustcode", headerName: "SAP CustCode", minWidth: 130, flex: 1 },
      { field: "sales_resp_id", headerName: "Sales Resp ID", minWidth: 130, flex: 1 },
      { field: "itemno", headerName: "CustomerId", minWidth: 120, flex: 1 },
      { field: "gst_no", headerName: "GST No", minWidth: 110, flex: 1 },
    ],
    [navigate]
  );

  const locationColumns: GridColDef[] = useMemo(
    () => [
      { field: "customer", headerName: "Customer", minWidth: 250, flex: 1 },
      { field: "customerAbb", headerName: "Cust Abbrev", minWidth: 150, flex: 1 },
      { field: "location", headerName: "Location", minWidth: 180, flex: 1 },
      { field: "address", headerName: "Address", minWidth: 280, flex: 1.2 },
      { field: "phoneno1", headerName: "Phone1", minWidth: 120, flex: 1 },
      { field: "phoneno2", headerName: "Phone2", minWidth: 120, flex: 1 },
      {
        field: "editLocation",
        headerName: "Edit Location",
        minWidth: 130,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const customerId = getCustomerId(params.row);
          const currentLocationId = String(params.row?.location_id ?? params.row?.locationId ?? "").trim();
          if (!customerId) return "-";
          return actionLink("Edit Location", () => {
            const target = `/Home/AddEditCustLocation/${encodeURIComponent(customerId)}${currentLocationId ? `?locationId=${encodeURIComponent(currentLocationId)}` : ""
              }`;
            navigate(target);
          });
        },
      },
      { field: "customer_id", headerName: "Customer Id", minWidth: 130, flex: 1 },
      { field: "location_id", headerName: "Location Id", minWidth: 130, flex: 1 }

    ],
    [navigate]
  );

  const contactColumns: GridColDef[] = useMemo(
    () => [
      { field: "customer", headerName: "Customer", minWidth: 220, flex: 1 },
      { field: "customerAbb", headerName: "Cust Abbrev", minWidth: 130, flex: 1 },
      { field: "contactName", headerName: "Contact Name", minWidth: 180, flex: 1 },
      { field: "contactTitle", headerName: "Title", minWidth: 100, flex: 1 },
      { field: "mobile1", headerName: "Mobile1", minWidth: 120, flex: 1 },
      { field: "mobile2", headerName: "Mobile2", minWidth: 120, flex: 1 },
      { field: "email11", headerName: "Email", minWidth: 200, flex: 1 },
      {
        field: "editContact",
        headerName: "Edit Contact",
        minWidth: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const contactRouteId = String(params.row?.contact_id ?? params.row?.contactId ?? "").trim();
          const customerId = getCustomerId(params.row);
          const targetId = contactRouteId || customerId;
          if (!targetId) return "-";
          return actionLink("Edit Contact", () => {
            navigate(`/Home/AddEditCustContact/${encodeURIComponent(targetId)}`);
          });
        },
      },
      { field: "customer_id", headerName: "Customer Id", minWidth: 200, flex: 1 },
      { field: "contact_id", headerName: "Contact Id", minWidth: 200, flex: 1 },
    ],
    [navigate]
  );

  const columns = activeTab === "customers" ? customerColumns : activeTab === "locations" ? locationColumns : contactColumns;

  const getRowId = (row: any) => {
    if (activeTab === "customers") return row.itemno ?? row.id;
    if (activeTab === "locations") return row.location_id ?? `${getCustomerId(row)}-${row.location ?? ""}-${row.id ?? ""}`;
    return row.contact_id ?? `${getCustomerId(row)}-${row.location_id ?? ""}-${row.id ?? ""}`;
  };

  const searchableFields =
    activeTab === "customers"
      ? ["customer", "customer_abb", "sales_resp", "sales_resp_id", "sapcustcode", "itemno", "gst_no", "customer_Type"]
      : activeTab === "locations"
        ? ["customer", "customerAbb", "location", "address", "phoneno1", "phoneno2"]
        : ["customer", "customerAbb", "contactName", "contactTitle", "mobile1", "mobile2", "email11"];

  const title =
    activeTab === "customers" ? "Customers"
      : activeTab === "locations"
        ? "Customer Locations"
        : "Customer Contacts";

  const handleExport = () => {
    if (!rows.length) {
      toast.warning("No data available to export.", { position: "bottom-right" });
      return;
    }

    if (activeTab === "customers") {
      exporttoexcel(rows, "ViewCustomers", "ViewCustomers.xlsx");
    } else if (activeTab === "locations") {
      exporttoexcel(rows, "ViewCustomerLocations", "ViewCustomerLocations.xlsx");
    } else {
      exporttoexcel(rows, "ViewCustomerContacts", "ViewCustomerContacts.xlsx");
    }
    toast.success("Data exported.", { position: "bottom-right" });
  };

  const handlePrimaryAdd = () => {
    if (activeTab === "customers") {
      navigate("/Home/AddEditCustomer/new");
      return;
    }
    if (activeTab === "locations") {
      navigate("/Home/AddEditCustLocation/new");
      return;
    }
    navigate("/Home/AddEditCustContact/new");
  };

  const addButtonLabel =
    activeTab === "customers" ? "Add New" : activeTab === "locations" ? "New Location" : "New Contact";

  return (
    <Box
      sx={{
        p: { xs: 1, md: 1.5 },
        mt: 15,
        width: "100%",
        maxWidth: 1280,
        mx: "auto",
        background: "radial-gradient(circle at top right, #ecf4ff 0%, #f7fbff 42%, #eef6ff 100%)",
        borderRadius: 2,
        border: "1px solid #849aad",
      }}
    >
      <Typography
        sx={{
          mb: 0.8,
          fontSize: { xs: "1rem", md: "1.5rem" },
          fontWeight: 700,
          color: "#1b4f91",
          alignContent: "center",
          textAlign: "center",
          fontFamily: "Arial",
        }}
      >
        Customer Register
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 0.4,
          borderRadius: 1,
          border: "1px solid #d3e3fa",
          background: "linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%)",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, tab: ViewTab) => setActiveTab(tab)}
          sx={{
            minHeight: 30,
            "& .MuiTabs-indicator": { display: "none" },
          }}
        >
          <Tab
            value="customers"
            label="Customers"
            sx={{
              minHeight: 30,
              py: 0.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#3a5d8f",
              "&.Mui-selected": {
                color: "#fff",
                background: "linear-gradient(135deg, #1e5fae 0%, #2b7ad8 100%)",
                boxShadow: "0 8px 18px rgba(27, 101, 189, 0.28)",
              },
            }}
          />

          <Tab
            value="contacts"
            label="Contacts"
            sx={{
              minHeight: 30,
              py: 0.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#3a5d8f",
              "&.Mui-selected": {
                color: "#fff",
                background: "linear-gradient(135deg, #1e5fae 0%, #2b7ad8 100%)",
                boxShadow: "0 8px 18px rgba(27, 101, 189, 0.28)",
              },
            }}
          />
          <Tab
            value="locations"
            label="Locations"
            sx={{
              minHeight: 30,
              py: 0.2,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#3a5d8f",
              "&.Mui-selected": {
                color: "#fff",
                background: "linear-gradient(135deg, #1e5fae 0%, #2b7ad8 100%)",
                boxShadow: "0 8px 18px rgba(27, 101, 189, 0.28)",
              },
            }}
          />
        </Tabs>
      </Paper>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
          width: "100%",
          maxWidth: 1240,
        }}
      >
        <ExportButton label="Export to Excel" onClick={handleExport} />
        <Button
          variant="contained"
          onClick={handlePrimaryAdd}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 1.5,
            px: 1.5,
            py: 0.5,
            background: "linear-gradient(135deg, #1f62b2 0%, #0f7dd6 100%)",
            boxShadow: "0 8px 16px rgba(20, 93, 178, 0.28)",
            "&:hover": {
              background: "linear-gradient(135deg, #1a5598 0%, #0c6dbc 100%)",
            },
            height: 32,
          }}
        >
          {addButtonLabel}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: "1px dashed #a8bfdc",
            borderRadius: 2,
            p: 2.2,
            textAlign: "center",
            color: "#4c6282",
            background: "linear-gradient(180deg, #fcfeff 0%, #f3f8ff 100%)",
          }}
        >
          <Typography>No records found.</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            p: 0.7,
            borderRadius: 2,
            border: "1px solid #d5e3f8",
            background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
            boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
            maxWidth: 1240,
            mx: "auto",
          }}
        >
          <CustomDataGrid2
            rows={rows}
            columns={columns}
            title={title}
            loading={loading}
            gridHeight={700}
            getRowId={getRowId}
            searchableFields={searchableFields}
            placeholder={`Search ${title.toLowerCase()}...`}
          //  onRowClick={(row: any) => {
            //  const customerId = getCustomerId(row);
              //if (activeTab === "locations") setSelectedLocationCustomerId(customerId);
             // if (activeTab === "contacts") setSelectedContactCustomerId(customerId);
          //  }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ViewCustomers;
