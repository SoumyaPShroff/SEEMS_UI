import React from "react";
import { Box, FormControlLabel, Radio, RadioGroup } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type RadioOption = {
  value: string | number;
  label: string;
};

interface CompactRadioGroupProps {
  name: string;
  value: string | number;
  options: RadioOption[];
  onChange: (e: any) => void;
  height?: number;
  fontSize?: string | number;
  sx?: SxProps<Theme>;
}

const CompactRadioGroup: React.FC<CompactRadioGroupProps> = ({
  name,
  value,
  options,
  onChange,
  height = 34,
  fontSize = "0.78rem",
  sx,
}) => {
  return (
    <Box
      sx={{
        border: "1px solid #cfd8e3",
        borderRadius: "10px",
        px: 0.6,
        mt: 0.5,
        bgcolor: "#fbfdff",
        minHeight: height,
        display: "flex",
        alignItems: "center",
        ...sx,
      }}
    >
      <RadioGroup
        row
        name={name}
        value={String(value)}
        onChange={onChange}
        sx={{ width: "100%", justifyContent: "space-evenly", gap: 0.25 }}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={String(opt.value)}
            value={String(opt.value)}
            control={<Radio size="small" sx={{ p: 0.35 }} />}
            label={opt.label}
            sx={{
              m: 0,
              "& .MuiFormControlLabel-label": {
                fontSize,
                lineHeight: 1.1,
              },
            }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
};

export default CompactRadioGroup;

