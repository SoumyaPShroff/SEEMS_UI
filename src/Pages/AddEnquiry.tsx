import React, { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography, Card } from "@mui/material";
import OnsiteEnquiry from "./OnsiteEnquiry";
import OffshoreEnquiry from "./OffshoreEnquiry";

const AddEnquiry: React.FC = () => {
  const [mode, setMode] = useState<string>("OFFSHORE");

  const handleModeChange = (_: any, value: string) => {
    if (value) setMode(value);
  };

  const renderForm = () => {
    switch (mode) {
      case "ONSITE":
        return <OnsiteEnquiry />;
      default:
        return <OffshoreEnquiry />;
    }
  };

  return (
    <Box sx={{ mt: 5, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        ENQUIRY
      </Typography>

      {/* 🔹 Radio Button Box */}
      <Card
        sx={{
          p: 1,
          mb: 3,
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
          <ToggleButton value="ONSITE">ONSITE</ToggleButton>
          <ToggleButton value="OFFSHORE">OFFSHORE</ToggleButton>
        </ToggleButtonGroup>
      </Card>

      {/* 🔹 Dynamic Form Panel */}
      <Box sx={{ width: "100%", maxWidth: 1100 }}>
        {renderForm()}
      </Box>
    </Box>
  );
};

export default AddEnquiry;
