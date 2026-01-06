import React, { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Card } from "@mui/material";

export type ToggleOption = {
  label: string;
  value: string;
};

type ToggleViewProps = {
  options: ToggleOption[];
  defaultValue: string;
  renderMap: Record<string, React.ReactNode>;
};

const ToggleView: React.FC<ToggleViewProps> = ({
  options,
  defaultValue,
  renderMap,
}) => {
  const [mode, setMode] = useState<string>(defaultValue);

  const handleModeChange = (_: any, value: string) => {
    if (value) setMode(value);
  };

  return (
    <Box sx={{ mt: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Toggle Buttons */}
      <Card
        sx={{
          p: 1,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "#f5f9ff",
          width: "fit-content",
        }}
      >
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          color="primary"
          size="large"
        >
          {options.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Card>

      {/* Dynamic Content */}
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        {renderMap[mode]}
      </Box>
    </Box>
  );
};

export default ToggleView;
