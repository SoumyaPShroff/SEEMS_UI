import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ContentCopy,
  ReceiptLong,
  Save,
  WorkOutline,
  TrendingUp,
  TaskAlt,
  AccountTree,
} from "@mui/icons-material";

const tabs = ["PO Details", "Scope Costing", "Jobs", "Allocation", "Billing"];

const scopes = ["Layout", "Analysis", "VA", "NPI", "DFM", "Library"];

const poMetrics = [
  {
    title: "PO Amount",
    value: "INR 12,50,000",
    helper: "Current PO value",
    tone: "primary" as const,
  },
  {
    title: "Allocated Hours",
    value: "220 hrs",
    helper: "Resource assigned",
    tone: "success" as const,
  },
  {
    title: "Balance Hours",
    value: "80 hrs",
    helper: "Pending allocation",
    tone: "warning" as const,
  },
  {
    title: "Billing Progress",
    value: "68%",
    helper: "Current billing status",
    tone: "info" as const,
  },
];

type Tone = "primary" | "success" | "warning" | "info";

export default function POJobAllocation() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 4 },
        background:
          "radial-gradient(circle at top left, rgba(25,118,210,0.12), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
      }}
    >
      <Stack spacing={3} sx={{ maxWidth: 1600, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(13,71,161,0.98) 0%, rgba(25,118,210,0.94) 55%, rgba(66,165,245,0.92) 100%)",
            color: "common.white",
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(120deg, rgba(255,255,255,0.08), transparent 45%)",
              pointerEvents: "none",
            },
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 1 }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
                <Chip
                  icon={<ReceiptLong sx={{ color: "inherit !important" }} />}
                  label="Purchase Order Execution"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.16)",
                    color: "common.white",
                    fontWeight: 600,
                  }}
                />
                <Chip
                  icon={<TaskAlt sx={{ color: "inherit !important" }} />}
                  label="Approved"
                  sx={{
                    bgcolor: "rgba(46,125,50,0.28)",
                    color: "common.white",
                    fontWeight: 600,
                  }}
                />
              </Stack>

              <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>
                PO-2026-00045
              </Typography>

              <Typography sx={{ mt: 1, color: "rgba(255,255,255,0.85)" }}>
                Manage scope costing, job allocation, and billing from one
                workspace.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<ContentCopy />}
                sx={{
                  borderColor: "rgba(255,255,255,0.45)",
                  color: "common.white",
                  bgcolor: "rgba(255,255,255,0.08)",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.14)",
                  },
                }}
              >
                Clone
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReceiptLong />}
                sx={{
                  borderColor: "rgba(255,255,255,0.45)",
                  color: "common.white",
                  bgcolor: "rgba(255,255,255,0.08)",
                  "&:hover": {
                    borderColor: "common.white",
                    bgcolor: "rgba(255,255,255,0.14)",
                  },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                sx={{
                  bgcolor: "#ffffff",
                  color: "primary.main",
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#f3f7ff", boxShadow: "none" },
                }}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Grid container spacing={2.5}>
          {poMetrics.map((metric) => (
            <Grid key={metric.title} size={{ xs: 12, md: 6, xl: 3 }}>
              <MetricCard {...metric} />
            </Grid>
          ))}
        </Grid>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            backgroundColor: "background.paper",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, nextValue) => setActiveTab(nextValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              px: 1,
              bgcolor: "grey.50",
              borderBottom: "1px solid",
              borderColor: "divider",
              "& .MuiTab-root": {
                py: 2,
                textTransform: "none",
                fontWeight: 700,
                minHeight: 64,
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab} label={tab} />
            ))}
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {activeTab === 0 && <PoDetailsTab />}
            {activeTab === 1 && <ScopeCostingTab />}
            {activeTab === 2 && <JobsTab />}
            {activeTab === 3 && <AllocationTab />}
            {activeTab === 4 && <BillingTab />}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

function MetricCard({
  title,
  value,
  helper,
  tone,
}: {
  title: string;
  value: string;
  helper: string;
  tone: Tone;
}) {
  const toneMap: Record<
    Tone,
    { bg: string; border: string; accent: string; iconBg: string }
  > = {
    primary: {
      bg: "linear-gradient(180deg, rgba(25,118,210,0.10), rgba(25,118,210,0.04))",
      border: "rgba(25,118,210,0.20)",
      accent: "#1565c0",
      iconBg: "rgba(25,118,210,0.12)",
    },
    success: {
      bg: "linear-gradient(180deg, rgba(46,125,50,0.10), rgba(46,125,50,0.04))",
      border: "rgba(46,125,50,0.20)",
      accent: "#2e7d32",
      iconBg: "rgba(46,125,50,0.12)",
    },
    warning: {
      bg: "linear-gradient(180deg, rgba(245,124,0,0.12), rgba(245,124,0,0.04))",
      border: "rgba(245,124,0,0.20)",
      accent: "#ef6c00",
      iconBg: "rgba(245,124,0,0.12)",
    },
    info: {
      bg: "linear-gradient(180deg, rgba(2,136,209,0.10), rgba(2,136,209,0.04))",
      border: "rgba(2,136,209,0.20)",
      accent: "#0277bd",
      iconBg: "rgba(2,136,209,0.12)",
    },
  };

  const toneStyle = toneMap[tone];

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 4,
        border: "1px solid",
        borderColor: toneStyle.border,
        background: toneStyle.bg,
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{ mt: 1.5, color: toneStyle.accent, fontWeight: 800 }}
            >
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {helper}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              bgcolor: toneStyle.iconBg,
              color: toneStyle.accent,
            }}
          >
            <TrendingUp />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      justifyContent="space-between"
      spacing={1.5}
      mb={2}
    >
      <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}

function FieldCard({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", fontWeight: 700, mb: 1, display: "block" }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        type={type}
        defaultValue={value}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2.5,
            bgcolor: "white",
          },
        }}
      />
    </Box>
  );
}

function StatusPill({
  label,
  color = "primary",
}: {
  label: string;
  color?: "primary" | "success" | "warning";
}) {
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}

function PoDetailsTab() {
  return (
    <Stack spacing={3}>
      <SectionHeader
        title="PO Information"
        action={
          <Stack direction="row" spacing={1}>
            <StatusPill label="Active" color="success" />
          </Stack>
        }
      />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Enquiry No" value="ENQ-2026-1055" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Quote No" value="QT-2055" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Customer" value="ABC Technologies" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Project" value="PCB Design" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="PO Number" value="PO-2026-0012" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="PO Date" value="2026-05-26" type="date" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Currency" value="INR" />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <FieldCard label="Payment Terms" value="45 Days" />
        </Grid>
      </Grid>
    </Stack>
  );
}

function ScopeCostingTab() {
  return (
    <Stack spacing={2.5}>
      <SectionHeader
        title="Scope Costing Matrix"
        action={
          <Button variant="contained" startIcon={<Add />} sx={{ borderRadius: 2.5 }}>
            Add Scope
          </Button>
        }
      />
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 800 }}>Scope</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Qty</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Rate/Hr</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Allocated</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Balance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {scopes.map((scope) => (
              <TableRow
                key={scope}
                sx={{
                  "&:hover": { bgcolor: "grey.50" },
                  "& td": { borderColor: "divider" },
                }}
              >
                <TableCell sx={{ fontWeight: 700 }}>{scope}</TableCell>
                <TableCell>
                  <TextField size="small" defaultValue="100" sx={{ width: 110 }} />
                </TableCell>
                <TableCell>
                  <TextField size="small" defaultValue="1200" sx={{ width: 110 }} />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>INR 1,20,000</TableCell>
                <TableCell sx={{ color: "warning.main", fontWeight: 700 }}>
                  60 hrs
                </TableCell>
                <TableCell sx={{ color: "success.main", fontWeight: 700 }}>
                  40 hrs
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function JobsTab() {
  return (
    <Stack spacing={2.5}>
      <SectionHeader
        title="Job Creation"
        action={
          <Button variant="contained" startIcon={<WorkOutline />} sx={{ borderRadius: 2.5 }}>
            Create Job
          </Button>
        }
      />
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 800 }}>Job No</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Scope</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Engineer</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Planned Hrs</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((item) => (
              <TableRow
                key={item}
                sx={{
                  "&:hover": { bgcolor: "grey.50" },
                  "& td": { borderColor: "divider" },
                }}
              >
                <TableCell sx={{ fontWeight: 700 }}>JOB-10{item}</TableCell>
                <TableCell>Layout</TableCell>
                <TableCell>Engineer {item}</TableCell>
                <TableCell>80 hrs</TableCell>
                <TableCell>
                  <Chip
                    label="In Progress"
                    color="primary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function AllocationTab() {
  return (
    <Stack spacing={2.5}>
      <SectionHeader
        title="Resource Allocation"
        action={
          <Button variant="outlined" startIcon={<AccountTree />} sx={{ borderRadius: 2.5 }}>
            View Map
          </Button>
        }
      />
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "grey.50" }}>
              <TableCell sx={{ fontWeight: 800 }}>Employee</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Scope</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Assigned</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Remaining</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((item) => (
              <TableRow
                key={item}
                sx={{
                  "&:hover": { bgcolor: "grey.50" },
                  "& td": { borderColor: "divider" },
                }}
              >
                <TableCell sx={{ fontWeight: 700 }}>Engineer {item}</TableCell>
                <TableCell>Analysis</TableCell>
                <TableCell>40 hrs</TableCell>
                <TableCell sx={{ color: "success.main", fontWeight: 700 }}>
                  120 hrs
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function BillingTab() {
  return (
    <Stack spacing={3}>
      <SectionHeader title="Billing Overview" />
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <MetricCard
            title="Total Billing"
            value="INR 8,50,000"
            helper="Current invoice"
            tone="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <MetricCard
            title="Pending Billing"
            value="INR 4,00,000"
            helper="Yet to bill"
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <MetricCard
            title="Collection"
            value="INR 5,20,000"
            helper="Payment received"
            tone="success"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, xl: 3 }}>
          <MetricCard
            title="Billing Status"
            value="68%"
            helper="Current progress"
            tone="info"
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
