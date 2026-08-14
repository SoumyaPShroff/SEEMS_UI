import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BuildIcon from "@mui/icons-material/Build";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import DescriptionIcon from "@mui/icons-material/Description";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { baseUrl } from "../../const/BaseUrl";
import TextControl from "../../components/resusablecontrols/TextControl";

interface SapPoLine {
  salesOrder?: string;
  customerName?: string;
  purchaseOrderNumber?: string;
  poDate?: string;
  salesOrderQuantity?: string;
  totalDeliveredQuantity?: string;
  openQuantity?: string;
  paymentTerm?: string;
  docCurrency?: string;
  netPrice?: string;
  netValueInDocCurrency?: string;
}

interface PoApprovalDetails {
  id: number;
  poNumber?: string;
  enquiryNo?: string;
  quoteNo?: string;
  poDate?: string;
  poAmount?: string;
  balanceAmount?: string;
  paymentTerms?: string;
  currencyId: number;
  currencyName?: string;
  convRate?: string;
  sez?: string;
  approvalStatus?: string;
  comments?: string;
  approverComments?: string;
  hasDocument?: boolean;

  layQty?: string;
  layRatePerHr?: string;
  layAmount?: string;

  analysisQty?: string;
  analysisRatePerHr?: string;
  analysisAmount?: string;

  vaQty?: string;
  vaRatePerHr?: string;
  vaAmount?: string;

  npiQty?: string;
  npiRatePerHr?: string;
  npiAmount?: string;

  libQty?: string;
  libRatePerHr?: string;
  libAmount?: string;

  dfmQty?: string;
  dfmRatePerHr?: string;
  dfmAmount?: string;

  onsiteQty?: string;
  onsiteRatePerHr?: string;
  onsiteAmount?: string;

  sapPoData: SapPoLine[];
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

const tableHeadCellStyle = { fontSize: 11.5, fontWeight: 700, color: "#243a5a", py: 0.75 };
const tableBodyCellStyle = { fontSize: "0.8rem", fontWeight: 700, color: "#0f2d55", py: 0.5 };

const mismatchValueStyle = { color: "#d32f2f", fontWeight: 800 };

const InfoField = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value?: React.ReactNode;
  highlight?: boolean;
}) => (
  <Box>
    <Typography sx={readOnlyLabelStyle}>{label}</Typography>
    <Typography sx={highlight ? { ...readOnlyValueStyle, ...mismatchValueStyle } : readOnlyValueStyle}>
      {value ?? "-"}
    </Typography>
  </Box>
);

const parseAmount = (value?: string): number => {
  if (!value) return NaN;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isNaN(parsed) ? NaN : parsed;
};

const POApprovalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  const [details, setDetails] = useState<PoApprovalDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [comments, setComments] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PoApprovalDetails>(`${baseUrl}/api/Sales/PoApprovalDetails/${id}`);
      setDetails(response.data);
      setComments(response.data.approverComments || "");
    } catch (error) {
      console.error("Error loading PO approval details:", error);
      toast.error("Failed to load PO details");
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
      await axios.post(`${baseUrl}/api/Sales/ApprovePO/${id}/${encodeURIComponent(loginId)}`, null, {
        params: { comments },
      });
      toast.success("PO approved successfully");
      loadData();
    } catch (error) {
      console.error("Error approving PO:", error);
      toast.error("Failed to approve PO");
    } finally {
      setApproving(false);
    }
  };

  const scopeRows = details
    ? [
        { name: "Layout", qty: details.layQty, rate: details.layRatePerHr, amount: details.layAmount },
        { name: "Analysis", qty: details.analysisQty, rate: details.analysisRatePerHr, amount: details.analysisAmount },
        { name: "VA", qty: details.vaQty, rate: details.vaRatePerHr, amount: details.vaAmount },
        { name: "NPI", qty: details.npiQty, rate: details.npiRatePerHr, amount: details.npiAmount },
        { name: "Library", qty: details.libQty, rate: details.libRatePerHr, amount: details.libAmount },
        { name: "DFM", qty: details.dfmQty, rate: details.dfmRatePerHr, amount: details.dfmAmount },
        { name: "Onsite", qty: details.onsiteQty, rate: details.onsiteRatePerHr, amount: details.onsiteAmount },
      ].filter((row) => row.qty && Number(row.qty) > 0)
    : [];

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
        <Typography>PO not found.</Typography>
      </Box>
    );
  }

  const isApproved = details.approvalStatus === "YES";

  const sapCustomerName = details.sapPoData.find((line) => line.customerName)?.customerName;

  const poAmountNum = parseAmount(details.poAmount);
  const hasSapNetPrice = details.sapPoData.some((line) => !Number.isNaN(parseAmount(line.netPrice)));
  const sapNetPriceTotal = details.sapPoData.reduce((sum, line) => {
    const val = parseAmount(line.netPrice);
    return sum + (Number.isNaN(val) ? 0 : val);
  }, 0);
  const amountMismatch =
    hasSapNetPrice && !Number.isNaN(poAmountNum) && Math.abs(poAmountNum - sapNetPriceTotal) > 0.01;

  const noSapData = !details.sapPoData || details.sapPoData.length === 0;

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
          maxWidth: 1200,
          mx: "auto",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate("/Home/POApproval")}
              size="small"
              sx={{ textTransform: "none" }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f4ea6", mb: 0.1 }}>
                PO Approval - {details.poNumber}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                Review the PO and SAP data below before approving
              </Typography>
            </Box>
          </Box>
          <Chip
            label={isApproved ? "Approved" : "Pending Approval"}
            color={isApproved ? "success" : "warning"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Card sx={{ ...sectionCardStyle, mt: 1 }}>
          <Box sx={sectionHeaderStyle}>
            <AssignmentIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>PO Details</Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, minmax(0, 1fr))" },
                gap: 1,
              }}
            >
              <InfoField label="PO Number" value={details.poNumber} />
              <InfoField label="Enquiry No" value={details.enquiryNo} />
              <InfoField label="Quote No" value={details.quoteNo} />
              <InfoField label="PO Date" value={details.poDate} />

              <InfoField label="Customer Name" value={sapCustomerName} />
              <InfoField label="PO Amount" value={details.poAmount} highlight={amountMismatch} />
              <InfoField label="Balance Amount" value={details.balanceAmount} />
              <InfoField label="Currency" value={details.currencyName} />
              <InfoField label="Conversion Rate" value={details.convRate} />

              <InfoField label="Payment Terms" value={details.paymentTerms} />
              <InfoField label="SEZ" value={details.sez} />
              <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 2" } }}>
                <InfoField label="Comments" value={details.comments} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {scopeRows.length > 0 && (
          <Card sx={{ ...sectionCardStyle, mt: 1.25 }}>
            <Box sx={sectionHeaderStyle}>
              <BuildIcon sx={{ fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={600}>Scope of Work</Typography>
            </Box>
            <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadCellStyle}>Scope</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Qty</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Rate / Hr</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scopeRows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell sx={tableBodyCellStyle}>{row.name}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{row.qty}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{row.rate}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{row.amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        <Card sx={{ ...sectionCardStyle, mt: 1.25 }}>
          <Box sx={sectionHeaderStyle}>
            <CloudSyncIcon sx={{ fontSize: 18 }} />
            <Typography variant="subtitle2" fontWeight={600}>SAP PO Data</Typography>
          </Box>
          <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
            {details.sapPoData && details.sapPoData.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={tableHeadCellStyle}>Sales Order Number</TableCell>
                      <TableCell sx={tableHeadCellStyle}>Customer Name</TableCell>
                      <TableCell sx={tableHeadCellStyle}>PO Number</TableCell>
                      <TableCell sx={tableHeadCellStyle}>PO Date</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Sales Order Qty</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Total Order Qty</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Open Qty</TableCell>
                      <TableCell sx={tableHeadCellStyle}>Payment Term</TableCell>
                      <TableCell sx={tableHeadCellStyle}>Currency</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Net Price</TableCell>
                      <TableCell sx={tableHeadCellStyle} align="right">Net Value (Doc Currency)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {details.sapPoData.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell sx={tableBodyCellStyle}>{line.salesOrder}</TableCell>
                        <TableCell sx={tableBodyCellStyle}>{line.customerName}</TableCell>
                        <TableCell sx={tableBodyCellStyle}>{line.purchaseOrderNumber}</TableCell>
                        <TableCell sx={tableBodyCellStyle}>{line.poDate}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{line.salesOrderQuantity}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{line.totalDeliveredQuantity}</TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{line.openQuantity}</TableCell>
                        <TableCell sx={tableBodyCellStyle}>{line.paymentTerm}</TableCell>
                        <TableCell sx={tableBodyCellStyle}>{line.docCurrency}</TableCell>
                        <TableCell
                          sx={amountMismatch ? { ...tableBodyCellStyle, ...mismatchValueStyle } : tableBodyCellStyle}
                          align="right"
                        >
                          {line.netPrice}
                        </TableCell>
                        <TableCell sx={tableBodyCellStyle} align="right">{line.netValueInDocCurrency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" sx={{ fontSize: "0.85rem" }}>
                No SAP PO data found for this PO number.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card sx={{ ...sectionCardStyle, mt: 1.25 }}>
          <CardContent sx={{ ...sectionContentStyle, p: 1.25, "&:last-child": { pb: 1.25 } }}>
            <Typography sx={{ fontSize: 11.5, fontWeight: 400, color: "#243a5a", mb: 0.5 }}>
              Approver Comments
            </Typography>
            <TextControl
              name="approverComments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add your comments before approving..."
              disabled={isApproved || approving}
              multiline
              rows={2}
              fullWidth
            />
          </CardContent>
        </Card>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1.5 }}>
          {details.hasDocument ? (
            <Button
              component="a"
              href={`${baseUrl}/api/Sales/DownloadPOFile/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<DescriptionIcon />}
              size="small"
              sx={{ textTransform: "none" }}
            >
              View PO Document
            </Button>
          ) : (
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
              No PO document uploaded
            </Typography>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {!isApproved && noSapData && (
              <Typography sx={{ fontSize: "0.78rem", color: "#d32f2f", fontWeight: 600 }}>
                No SAP data found for this PO - approval is blocked until SAP data is available.
              </Typography>
            )}
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircleIcon />}
              disabled={isApproved || approving || amountMismatch || noSapData}
              onClick={handleApprove}
              sx={{ textTransform: "none", borderRadius: 2, px: 2.5 }}
            >
              {isApproved ? "Approved" : approving ? "Approving..." : "Approve PO"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default POApprovalDetails;
