import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, CircularProgress, Paper, Tab, Tabs, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import CustomDataGrid2 from "../../components/resusablecontrols/CustomDataGrid2";
import TextControl from "../../components/resusablecontrols/TextControl";
import { standardInputStyle } from "../Sales/styles/standardInputStyle";
import { baseUrl } from "../../const/BaseUrl";

type RequestStatus = "OPEN" | "CLOSED" | "IN-PROCESS" | "COMPLETED" | "REJECTED" | "APPROVED";
type ViewTab = RequestStatus;

interface RequestItem {
  id: string;
  requestDate: string;
  type: string;
  module: string;
  comments: string;
  status: RequestStatus;
  file: File | null;
  fileName: string;
  reqid: string;
  modulename: string;
  description: string;
  requestedby: string;
  requestedon: string;
  closedon: string;
  appDateon: string;
  approver: string;
  approverremarks: string;
  pickedby: string;
  pickedon: string;
  completedby: string;
  completedon: string;
  completedrem: string;
  verifiedby: string;
  verifiedon: string;
  verifiedrem: string;
  Requesttype: string;
}

interface ApiRequestRecord {
  [key: string]: unknown;
}

const TABS: ViewTab[] = ["OPEN", "CLOSED", "IN-PROCESS", "COMPLETED", "REJECTED", "APPROVED"];

const REQUEST_ENDPOINTS = [`${baseUrl}/SEEMSRequestData`];

const columns: GridColDef<RequestItem>[] = [
  { field: "reqid", headerName: "Request ID", minWidth: 150, flex: 1 },
  { field: "modulename", headerName: "Module Name", minWidth: 180, flex: 1 },
  { field: "description", headerName: "Description", minWidth: 170, flex: 1 },
  { field: "requestedby", headerName: "Requested By", minWidth: 170, flex: 1.2 },
  { field: "requestedon", headerName: "Request Date", minWidth: 170, flex: 1.6 },
  { field: "closedon", headerName: "Closed On", minWidth: 150, flex: 1 },
  { field: "appDateon", headerName: "Approved On", minWidth: 170, flex: 1 },
  { field: "approver", headerName: "Approver", minWidth: 210, flex: 1.2 },
  { field: "approverremarks", headerName: "Approver Comments", minWidth: 280, flex: 1.6 },
  { field: "pickedby", headerName: "Picked By", minWidth: 160, flex: 1 },
  { field: "pickedon", headerName: "Picked On", minWidth: 170, flex: 1 },
  { field: "completedby", headerName: "Completed By", minWidth: 170, flex: 1.2 },
  { field: "completedon", headerName: "Completed On", minWidth: 170, flex: 1.6 },
  { field: "completedrem", headerName: "Completed Remarks", minWidth: 160, flex: 1 },
  { field: "verifiedby", headerName: "Verified By", minWidth: 170, flex: 1 },
  { field: "verifiedon", headerName: "verifiedon", minWidth: 210, flex: 1.2 },
  { field: "verifiedrem", headerName: "Verified Comments", minWidth: 280, flex: 1.6 },
  { field: "Requesttype", headerName: "Request Type", minWidth: 160, flex: 1 },    
];

const tabLabelMap: Record<ViewTab, string> = {
  "OPEN": "OPEN",
  "CLOSED": "CLOSED",
  "IN-PROCESS": "IN-PROCESS",
  "COMPLETED": "COMPLETED",
  "REJECTED": "REJECTED",
  "APPROVED": "APPROVED",
};

const asString = (value: unknown): string => (value == null ? "" : String(value).trim());

const normalizeStatus = (value: string): RequestStatus => {
  const normalized = value.trim();
  if (normalized === "CLOSED") {
    return "CLOSED";
  }
  if (normalized === "IN-PROCESS") {
    return "IN-PROCESS";
  }
  if (normalized === "COMPLETED") {
    return "COMPLETED";
  }
  if (normalized === "REJECTED") {
    return "REJECTED";
  }
  if (normalized === "APPROVED") {
    return "APPROVED";
  }
  if (normalized === "OPEN") {
    return "OPEN";
  }
  return "OPEN";
};

const extractRecords = (data: unknown): ApiRequestRecord[] => {
  if (Array.isArray(data)) {
    return data as ApiRequestRecord[];
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data)
  ) {
    return (data as { data: ApiRequestRecord[] }).data;
  }

  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    (data as { data?: unknown }).data &&
    !Array.isArray((data as { data?: unknown }).data)
  ) {
    return [(data as { data: ApiRequestRecord }).data];
  }

  if (typeof data === "object" && data !== null) {
    return [data as ApiRequestRecord];
  }

  return [];
};

const mapApiRequest = (record: ApiRequestRecord): RequestItem => ({
  id: asString(
    record.id ??
      record.reqid ??
      record.requestId ??
      record.requestid ??
      record.requestNo ??
      record.requestno
  ),
  requestDate: asString(
    record.requestDate ?? record.requestdate ?? record.requestedon ?? record.createdDate ?? record.createddate
  ),
  type: asString(record.type ?? record.requestType ?? record.requesttype ?? record.Requesttype),
  module: asString(record.module ?? record.moduleName ?? record.modulename ?? record.pageName ?? record.pagename),
  comments: asString(record.comments ?? record.comment ?? record.remarks ?? record.description),
  status: normalizeStatus(asString(record.status ?? record.Requesttype)),
  file: null,
  fileName: asString(record.fileName ?? record.filename ?? record.attachmentName ?? record.attachmentname),
  reqid: asString(
    record.reqid ??
      record.id ??
      record.requestId ??
      record.requestid ??
      record.requestNo ??
      record.requestno
  ),
  modulename: asString(record.modulename ?? record.moduleName ?? record.module ?? record.pageName ?? record.pagename),
  description: asString(record.description ?? record.comments ?? record.comment ?? record.remarks),
  requestedby: asString(record.requestedby ?? record.requestedBy ?? record.createdBy ?? record.createdby),
  requestedon: asString(
    record.requestedon ?? record.requestDate ?? record.requestdate ?? record.createdDate ?? record.createddate
  ),
  closedon: asString(record.closedon ?? record.closedOn),
  appDateon: asString(record.appDateon ?? record.approvedon ?? record.approvedOn),
  approver: asString(record.approver),
  approverremarks: asString(record.approverremarks ?? record.approverRemarks),
  pickedby: asString(record.pickedby ?? record.pickedBy),
  pickedon: asString(record.pickedon ?? record.pickedOn),
  completedby: asString(record.completedby ?? record.completedBy),
  completedon: asString(record.completedon ?? record.completedOn),
  completedrem: asString(record.completedrem ?? record.completedRemarks),
  verifiedby: asString(record.verifiedby ?? record.verifiedBy),
  verifiedon: asString(record.verifiedon ?? record.verifiedOn),
  verifiedrem: asString(record.verifiedrem ?? record.verifiedRemarks),
  Requesttype: asString(record.Requesttype ?? record.status ?? record.requestType ?? record.requesttype),
});

const normalizeStatusParam = (value: string | null): ViewTab | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (normalized === "OPEN") {
    return "OPEN";
  }
  if (normalized === "CLOSED") {
    return "CLOSED";
  }
  if (normalized === "IN-PROCESS") {
    return "IN-PROCESS";
  }
  if (normalized === "COMPLETED") {
    return "COMPLETED";
  }
  if (normalized === "REJECTED") {
    return "REJECTED";
  }
  if (normalized === "APPROVED") {
    return "APPROVED";
  }
  return null;
};

const ViewSEEMSRequests: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeStatus = normalizeStatusParam(searchParams.get("status"));
  const routeDate = searchParams.get("requestdate") ?? "";

  const [activeTab, setActiveTab] = useState<ViewTab>(routeStatus ?? "OPEN");
  const [requestDate, setRequestDate] = useState(routeDate);
  const [rows, setRows] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    setActiveTab(routeStatus ?? "OPEN");
  }, [routeStatus]);

  useEffect(() => {
    setRequestDate(routeDate);
  }, [routeDate]);

  useEffect(() => {
    void loadRows({
      status: routeStatus ?? undefined,
      requestdate: routeDate || undefined,
    });
  }, [routeStatus, routeDate]);

  const loadRows = async (filters?: { status?: string; requestdate?: string }) => {
    setLoading(true);
    setHasFetched(true);

    try {
      let result: RequestItem[] = [];

      for (const endpoint of REQUEST_ENDPOINTS) {
        try {
          const response = await axios.get(endpoint, { params: filters });
          result = extractRecords(response.data).map(mapApiRequest).filter((item) => Boolean(item.id));
          break;
        } catch (error) {
          console.warn("Failed to load SEEMS requests from endpoint:", endpoint, error);
        }
      }

      if (result.length === 0 && !filters?.status && !filters?.requestdate) {
        setRows([]);
        return;
      }

      if (result.length === 0) {
        setRows([]);
        return;
      }

      setRows(result);
    } catch (error) {
      setRows([]);
      toast.error("Unable to load SEEMS requests.");
      console.warn("Failed to load SEEMS requests.", error);
    } finally {
      setLoading(false);
    }
  };

  const visibleRows = useMemo(
    () => rows.filter((row) => row.status === activeTab),
    [rows, activeTab]
  );

  const updateQuery = (status: ViewTab, date: string) => {
    const params = new URLSearchParams();
    params.set("status", status);
    if (date) {
      params.set("requestdate", date);
    }
    setSearchParams(params);
  };

  const handleTabChange = (_: React.SyntheticEvent, tab: ViewTab) => {
    setActiveTab(tab);
    updateQuery(tab, requestDate);
  };

  const handleDateChange = (value: string) => {
    setRequestDate(value);
    if (routeStatus) {
      updateQuery(activeTab, value);
      return;
    }
    const params = new URLSearchParams();
    if (value) {
      params.set("requestdate", value);
    }
    setSearchParams(params);
  };

  return (
    <Box
      sx={{
        p: { xs: 1, md: 1.5 },
        mt: 15,
        width: "100%",
        maxWidth: 1100,
        mx: "auto",
        background: "radial-gradient(circle at top right, #ecf4ff 0%, #f7fbff 42%, #eef6ff 100%)",
        borderRadius: 2,
        border: "1px solid #849aad",
      }}
    >
      <Typography
        sx={{
          mb: 1,
          fontSize: { xs: "1rem", md: "1.5rem" },
          fontWeight: 700,
          color: "#1b4f91",
          textAlign: "center",
          fontFamily: "Arial",
        }}
      >
        View SEEMS Requests
      </Typography>

      <Card
        sx={{
          width: "100%",
          maxWidth: 1100,
          mx: "auto",
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.12)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 1.75, md: 2.2 } }}>
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              alignItems: "end",
              gridTemplateColumns: { xs: "1fr", md: "1.3fr minmax(150px, 190px) auto auto" },
              mb: 1.5,
            }}
          >
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
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 34,
                  "& .MuiTabs-indicator": { display: "none" },
                }}
              >
                {TABS.map((tab) => (
                  <Tab
                    key={tab}
                    value={tab}
                    label={tabLabelMap[tab]}
                    sx={{
                      minHeight: 34,
                      py: 0.4,
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
                ))}
              </Tabs>
            </Paper>

            <Box sx={{ width: "100%", maxWidth: 190 }}>
              <Typography sx={{ mb: 0.4, width: "100%", fontSize: "0.84rem", fontWeight: 700, color: "#31527d" }}>
                Request Date
              </Typography>
              <TextControl
                type="date"
                value={requestDate}
                onChange={(event) => handleDateChange(event.target.value)}
                style={standardInputStyle}
                fullWidth
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
              <CircularProgress />
            </Box>
          ) : !hasFetched || visibleRows.length > 0 ? (
            <Box
              sx={{
                p: 0.7,
                borderRadius: 2,
                border: "1px solid #d5e3f8",
                background: "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)",
                boxShadow: "0 14px 28px rgba(39, 95, 169, 0.08)",
              }}
            >
              <CustomDataGrid2
                rows={visibleRows}
                columns={columns}
                title={`${tabLabelMap[activeTab]} Requests`}
                loading={loading}
                gridHeight={620}
                searchableFields={["id", "requestDate", "type", "module", "comments", "status", "fileName"]}
                placeholder="Search requests..."
                getRowId={(row) => row.id}
              />
            </Box>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ViewSEEMSRequests;
