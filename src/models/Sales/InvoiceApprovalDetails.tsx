import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../const/BaseUrl";

interface InvoiceApprovalDetails {
  invoiceCount: number;
  invoiceNo?: string;
  jobNumber?: string;
  customerName?: string;
  quoteNo?: string;
  poNumber?: string;
  invoiceDate?: string;
  billingDate?: string;
  ratePerHr?: string;
  poHrs?: string;
  poAmount?: string;
  invoiceCurrency?: string;
  remarks?: string;

  approvalStatus?: string;
  projMgrId?: string;
  projMgrName?: string;
  salesMgrId?: string;
  salesMgrName?: string;
}

const readOnlyLabelStyle = { fontSize: 11.5, fontWeight: 400, color: "#243a5a", mb: 0.2 };
const readOnlyValueStyle = { fontSize: "0.85rem", fontWeight: 700, color: "#0f2d55" };

const sectionCardStyle = {
  borderRadius: 3,
  border: "1px solid #d9e4f5",
  boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  overflow: "hidden",
};
const sectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  px: 1.5,
  py: 0.75,
  background: "linear-gradient(90deg,#0f4ea6,#3c78d8)",
  color: "white",
  minHeight: 34,
};
const sectionContentStyle = { background: "linear-gradient(180deg,#ffffff 0%,#f2f7ff 100%)" };

const InfoField = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Box>
    <Typography sx={readOnlyLabelStyle}>{label}</Typography>
    <Typography sx={readOnlyValueStyle}>{value ?? "-"}</Typography>
  </Box>
);

const InvoiceApprovalDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [details, setDetails] = useState<InvoiceApprovalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<InvoiceApprovalDetails>(`${baseUrl}/api/Sales/InvoiceApprovalDetails/${id}`);
      setDetails(response.data);
    } catch (error) {
      console.error("Error loading invoice approval details:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApprove = async () => {
    setApproving(true);
    try {
      await axios.post(`${baseUrl}/api/Sales/ApproveInvoice/${id}/${encodeURIComponent(loginId)}`);
      toast.success("Invoice approved successfully");
      loadData();
    } catch (error: any) {
      console.error("Error approving invoice:", error);
      toast.error(error?.response?.data?.message || "Failed to approve invoice");
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2.5, mt: 10, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!details) {
    return (
      <Box sx={{ p: 2.5, mt: 10 }}>
        <Typography>Invoice not found.</Typography>
      </Box>
    );
  }

  const isFullyApproved = details.approvalStatus === "YES";
  const isProjMgrApproved = !!details.projMgrId;
  const isSalesMgrApproved = !!details.salesMgrId;
  // The logged-in user already filled their role's slot on this invoice (as PM or as Sales Manager) -
  // block them from approving it again, even though the other role's slot may still be open.
  const alreadyApprovedByMe = details.projMgrId === loginId || details.salesMgrId === loginId;

  return (
    <Box sx={{ p: 2.5, mt: 10, background: "#f4f7fb", fontFamily: "'Inter', sans-serif" }}>
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderRadius: 3,
          border: "1px solid #557ec6",
          boxShadow: "0 14px 30px rgba(24, 71, 153, 0.16)",
          background: "linear-gradient(145deg, #f7fbff 0%, #e8f2ff 52%, #dbeaff 100%)",
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/Home/InvoiceApproval")}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.1 }}>
                Invoice Approval - {details.invoiceNo}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                Review the invoice below before approving
              </Typography>
            </Box>
          </Box>
          <Chip
            label={isFullyApproved ? "Approved" : "Pending Approval"}
            color={isFullyApproved ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Card sx={{ ...sectionCardStyle, mt: 1 }}>
          <Box sx={sectionHeaderStyle}>
            <ReceiptLongIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>Invoice Details</Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              <InfoField label="Invoice No" value={details.invoiceNo} />
              <InfoField label="Job Number" value={details.jobNumber} />
              <InfoField label="Customer" value={details.customerName} />
              <InfoField label="Quote No" value={details.quoteNo} />

              <InfoField label="PO Number" value={details.poNumber} />
              <InfoField label="Invoice Date" value={details.invoiceDate} />
              <InfoField label="Billing Date" value={details.billingDate} />
              <InfoField label="Currency" value={details.invoiceCurrency} />

              <InfoField label="Rate / Hr" value={details.ratePerHr} />
              <InfoField label="PO Hrs" value={details.poHrs} />
              <InfoField label="Invoice Amount" value={details.poAmount} />
              <InfoField label="Remarks" value={details.remarks} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ ...sectionCardStyle, mt: 1.25 }}>
          <Box sx={sectionHeaderStyle}>
            <CheckCircleIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>Approval Status</Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <InfoField label="Project Manager" value={details.projMgrName || details.projMgrId || "-"} />
                <Chip
                  label={isProjMgrApproved ? "Approved" : "Pending"}
                  color={isProjMgrApproved ? "success" : "warning"}
                  size="small"
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <InfoField label="Sales Manager" value={details.salesMgrName || details.salesMgrId || "-"} />
                <Chip
                  label={isSalesMgrApproved ? "Approved" : "Pending"}
                  color={isSalesMgrApproved ? "success" : "warning"}
                  size="small"
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<CheckCircleIcon />}
            disabled={isFullyApproved || alreadyApprovedByMe || approving}
            onClick={handleApprove}
            sx={{ textTransform: "none", borderRadius: 2, px: 2.5 }}
          >
            {isFullyApproved
              ? "Approved"
              : alreadyApprovedByMe
              ? "You Already Approved"
              : approving
              ? "Approving..."
              : "Approve Invoice"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default InvoiceApprovalDetailsPage;
