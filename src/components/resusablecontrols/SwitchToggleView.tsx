import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type SwitchToggleOption = {
  label: string;
  value: string;
};

type SwitchToggleViewProps = {
  options: SwitchToggleOption[];
  defaultValue: string;
  renderMap: Record<string, React.ReactNode>;
  title?: string;
  subtitle?: string;
  hideHeader?: boolean;
  containerSx?: SxProps<Theme>;
  switchSx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

const SwitchToggleView: React.FC<SwitchToggleViewProps> = ({
  options,
  defaultValue,
  renderMap,
  title = "Choose Option",
  subtitle,
  hideHeader = false,
  containerSx,
  switchSx,
  contentSx,
}) => {
  const safeOptions = options.length >= 2 ? options : [];
  const fallbackValue = safeOptions[0]?.value ?? "";
  const [mode, setMode] = useState<string>(defaultValue || fallbackValue);

  const activeIndex = useMemo(() => {
    const idx = safeOptions.findIndex((x) => x.value === mode);
    return idx >= 0 ? idx : 0;
  }, [safeOptions, mode]);

  const itemWidthPct = safeOptions.length ? 100 / safeOptions.length : 100;

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
                mb: 1.5,
                textAlign: "center",
                fontSize: { xs: "0.78rem", md: "0.84rem" },
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </>
      )}

      <Box
        sx={{
          width: "100%",
          maxWidth: 350,
          p: 0.5,
          borderRadius: 999,
          border: "1px solid #dbe5ff",
          bgcolor: "#edf3ff",
          position: "relative",
          overflow: "hidden",
          ...switchSx,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: `calc(${activeIndex * itemWidthPct}% + 4px)`,
            width: `calc(${itemWidthPct}% - 8px)`,
            borderRadius: 999,
            bgcolor: "#ffffff",
            boxShadow: "0 6px 16px rgba(17, 53, 126, 0.16)",
            transition: "left 180ms ease",
          }}
        />

        <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${safeOptions.length || 2}, minmax(0, 1fr))`, position: "relative", zIndex: 1 }}>
          {safeOptions.map((opt) => {
            const selected = mode === opt.value;
            return (
              <Box
                key={opt.value}
                component="button"
                type="button"
                onClick={() => setMode(opt.value)}
                sx={{
                  border: 0,
                  bgcolor: "transparent",
                  py: 0.9,
                  px: 1,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  fontWeight: selected ? 700 : 600,
                  color: selected ? "#0b46b3" : "#4a5e87",
                  transition: "color 120ms ease",
                }}
              >
                {opt.label}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ width: "100%", maxWidth: 1100, ...contentSx }}>{renderMap[mode]}</Box>
    </Box>
  );
};

export default SwitchToggleView;

