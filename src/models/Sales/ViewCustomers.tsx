import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography,} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useNavigate } from "react-router-dom";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import ExportButton from "../../components/resusablecontrols/ExportButton";
import { exporttoexcel } from "../../components/utils/exporttoexcel";
import { baseUrl } from "../../const/BaseUrl";
import { toast } from "react-toastify";

type ResponsibilityFilter = "salesResponsibilityId" | "completeResponsibilityId" | "all";

const ACCESS_PAGE_KEYS = ["addeditcustomerdata", "viewallenquiries"];

const toArray = (data: unknown): any[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const nestedRows = (data as any).data;
    if (Array.isArray(nestedRows)) return nestedRows;
    return [data];
  }
  return [];
};

const AddEditCustomerData = () => {
  const navigate = useNavigate();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSpecialRole, setHasSpecialRole] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<ResponsibilityFilter>("all");
  const [error, setError] = useState("");

  const buildRows = useCallback((rawData: unknown) => {
    const sourceRows = toArray(rawData);
    return sourceRows.map((row: any, index: number) => ({
      id:
        row.id ??
        row.customerId ??
        row.customer_id ??
        row.customerCode ??
        row.customercode ??
        `cust-${index + 1}`,
      customerId:
        row.customerId ??
        row.customer_id ??
        row.customercode ??
        row.customerCode ??
        row.id ??
        "",
      customerCode: row.customerCode ?? row.customercode ?? "",
      customerName: row.customerName ?? row.customer ?? "",
      locationId: row.locationId ?? row.location_id ?? "",
      location: row.location ?? "",
      contactId: row.contactId ?? row.contact_id ?? "",
      contactName: row.contactName ?? row.contact ?? "",
      email: row.email ?? row.email11 ?? "",
      phone: row.phone ?? row.mobile ?? row.cellnumber ?? "",
      address: row.address ?? "",
      salesResponsibility: row.salesResponsibilityId   ?? "",
      completeResponsibility: row.completeResponsibilityId  ?? "",
      ...row,
    }));
  }, []);

  const loadRoleFlag = useCallback(async (): Promise<boolean> => {
    const userRoleRes = await axios.get(`${baseUrl}/UserDesignation/${loginId}`);
    const userRole = userRoleRes.data;

    for (const key of ACCESS_PAGE_KEYS) {
      try {
        const roleCheck = await axios.get<boolean>(
          `${baseUrl}/UserRoleInternalRights/${userRole}/${key}`
        );
        if (roleCheck.data === true) return true;
      } catch {
        // Ignore unavailable page keys and continue with the next key.
      }
    }

    return false;
  }, [loginId]);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const roleFlag = await loadRoleFlag();
      setHasSpecialRole(roleFlag);

      const endpoint = `${baseUrl}/api/sales/CustomerContLocData`;

      if (roleFlag) {
        const allRes = await axios.get(endpoint);
        setRows(buildRows(allRes.data));
        setAppliedFilter("all");
        return;
      }

      const salesRes = await axios.get(endpoint, {
        params: { salesResponsibilityId: loginId },
      });
      const salesRows = buildRows(salesRes.data);

      if (salesRows.length > 0) {
        setRows(salesRows);
        setAppliedFilter("salesResponsibilityId");
        return;
      }

      const completeRes = await axios.get(endpoint, {
        params: { completeResponsibilityId: loginId },
      });
      setRows(buildRows(completeRes.data));
      setAppliedFilter("completeResponsibilityId");
    } catch (err) {
      console.error("Error loading customer data:", err);
      setRows([]);
      setAppliedFilter("all");
      setError("Unable to load customer details right now.");
    } finally {
      setLoading(false);
    }
  }, [buildRows, loadRoleFlag, loginId]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleCustomerExport = () => {
    if (!rows || rows.length === 0) {
      toast.warning("No data available to export.", { position: "bottom-right" });
      return;
    }

    exporttoexcel(rows, "ViewCustomers", "ViewCustomers.xlsx");
    toast.success("Customer data exported.", { position: "bottom-right" });
  };

  const columns: GridColDef[] = useMemo(() => {
    const getCustomerId = (row: any): string =>
      String(
        row.itemno ??
          row.customerId ??
          row.customer_id ??
          row.customercode ??
          row.customerCode ??
          row.id ??
          ""
      );

    const actionLink = (
      label: string,
      params: any,
      routePrefix: string
    ) => {
      const customerId = getCustomerId(params.row);
      const targetCustomerId = customerId || String(params.row?.id ?? "");

      return (
        <a
          href="#"
          style={{
            color: "#1976d2",
            cursor: "pointer",
            textDecoration: "underline",
            opacity: 1,
          }}
          onClick={(e) => {
            e.preventDefault();
            navigate(`${routePrefix}/${encodeURIComponent(targetCustomerId)}`);
          }}
        >
          {label}
        </a>
      );
    };

    const dataColumns: GridColDef[] = [
      { field: "customer", headerName: "Customer", minWidth: 250, flex: 1 },
      { field: "location", headerName: "Location", minWidth: 140, flex: 1 },
      { field: "contactName", headerName: "Contact Name", minWidth: 120, flex: 1.3 },
    //  { field: "address", headerName: "Address", minWidth: 130, flex: 1 },
   //   { field: "abbreviation", headerName: "Abbrev", minWidth: 80, flex: 1.2 },
      { field: "salesresp", headerName: "Sales Resp", minWidth: 130, flex: 1 },
      {
        field: "editCustomer",
        headerName: "Edit Customer",
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => actionLink("Edit Customer", params, "/Home/AddEditCustomer"),
      },
      {
        field: "addLocation",
        headerName: "Add Location",
 
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => actionLink("Add Location", params, "/Home/AddEditCustLocation"),
      },
      {
        field: "addContact",
        headerName: "Add Contact",
 
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => actionLink("Add Contact", params, "/Home/AddEditCustContact"),
      },
      //{ field: "completeResponsibility", headerName: "Complete Resp", minWidth: 200, flex: 1.2 },
      { field: "customertype", headerName: "Type", minWidth: 80, flex: 1 },
      { field: "sapcustcode", headerName: "SapCustCode", minWidth: 140, flex: 1 },
      { field: "itemno", headerName: "CustomerId", flex:1},
       ];

    return dataColumns;
  }, [navigate, rows]);

  const roleLabel = hasSpecialRole ? "Full Access" : "Restricted Access";
  const filterLabel =
    appliedFilter === "all"
      ? "No filter"
      : appliedFilter === "salesresponsbility"
      ? "Filtered by salesresponsbility"
      : "Filtered by completeresp";

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, mt: 2, width: "100%" }}>
      <Box sx={{ mr: 4, display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <ExportButton label="Export to Excel" onClick={handleCustomerExport} />
        <Button variant="contained" onClick={() => navigate("/Home/AddEditCustomer/new")}>
          Add New
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
            border: "1px dashed #9fb2cf",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            color: "#53657f",
            background: "#fbfdff",
          }}
        >
          <Typography>No customer records found.</Typography>
        </Paper>
      ) : (
        <CustomDataGrid2
          rows={rows}
          columns={columns}
          title="View Customer Contact and Location Details"
          loading={loading}
          gridHeight={700}
          searchableFields={[
            "customer",
            "location",
            "contactName",
            "address",
            "abbreviation",
            "salesresp",
            "customertype",
            "sapcustcode",
          ]}
          placeholder="Search customers..."
        />
      )}
    </Box>
  );
};

export default AddEditCustomerData;
