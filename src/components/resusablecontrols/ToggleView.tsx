import React, { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Card, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type ToggleOption = {
  label: string;
  value: string;
  subtitle?: string;
};

type ToggleViewProps = {
  options: ToggleOption[];
  defaultValue: string;
  renderMap: Record<string, React.ReactNode>;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  containerSx?: SxProps<Theme>;
  cardSx?: SxProps<Theme>;
  toggleGroupSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

const ToggleView: React.FC<ToggleViewProps> = ({
  options,
  defaultValue,
  renderMap,
  title = "Choose Option",
  subtitle,
  hideHeader = false,
  containerSx,
  cardSx,
  toggleGroupSx,
  contentSx,
}) => {
  const [mode, setMode] = useState<string>(defaultValue);

  const handleModeChange = (_: any, value: string) => {
    if (value) setMode(value);
  };

  return (
    <Box
      sx={{
        mt: 8,
        px: { xs: 2, md: 0 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...containerSx,
      }}
    >
      {!hideHeader && (
        <>
          <Typography
            sx={{
              fontSize: { xs: "0.98rem", md: "1.08rem" },
              fontWeight: 600,
              letterSpacing: "0.02em",
              color: "#1f2d5a",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              sx={{
                color: "#5f6b84",
                mb: 1.75,
                textAlign: "center",
                fontSize: { xs: "0.78rem", md: "0.84rem" },
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </>
      )}

      <Card
        sx={{
          p: 0.1,
          borderRadius: 2.5,
          border: "1px solid #dbe5ff",
          boxShadow: "0 10px 24px rgba(31, 45, 90, 0.14)",
          background:
            "linear-gradient(145deg, rgba(249,252,255,0.95) 0%, rgba(235,242,255,0.96) 100%)",
          width: "100%",
          maxWidth: 460,
          ...cardSx,
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          color="primary"
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 0.3,
            border: "none",
            "& .MuiToggleButtonGroup-grouped": {
              border: "none",
              borderRadius: "10px !important",
              minHeight: { xs: 44, md: 48 },
              px: { xs: 1, md: 1.15 },
              py: 0.5,
              textTransform: "none",
              lineHeight: 1.2,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              textAlign: "left",
              bgcolor: "rgba(255,255,255,0.7)",
              color: "#405177",
            },
            "& .MuiToggleButtonGroup-grouped.Mui-selected": {
              color: "#0b46b3",
              border: "1px solid #b8cdff",
              bgcolor: "#ffffff",
              boxShadow: "0 10px 24px rgba(11, 70, 179, 0.18)",
            },
            ...toggleGroupSx,
          }}
        >
          {options.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: "0.82rem" }}>{opt.label}</Typography>
                {opt.subtitle ? (
                  <Typography sx={{ mt: 0.2, fontSize: "0.68rem", color: "#6d7e9f", fontWeight: 500 }}>
                    {opt.subtitle}
                  </Typography>
                ) : null}
              </Box>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Card>

      {/* Dynamic Content */}
      <Box sx={{ ...contentSx }}>
        {renderMap[mode]}
      </Box>
    </Box>
  );
};

export default ToggleView;
