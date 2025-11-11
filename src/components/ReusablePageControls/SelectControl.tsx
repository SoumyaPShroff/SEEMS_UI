import React from "react";
import {FormControl, InputLabel, Select, MenuItem,  FormHelperText,} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

interface Option {
  value: string | number;
  label: string;
}

interface SelectControlProps {
  name: string;
  label: string;
  value: string | number;
  options: Option[];
  onChange: (e: SelectChangeEvent<string | number>) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  height?: string | number;
  width?: string | number;
  sx?: object; // optional extra MUI styling prop
}

const SelectControl: React.FC<SelectControlProps> = ({
  name,
  label,
  value,
  options,
  onChange,
  required = false,
  error = false,
  helperText = "",
  disabled = false,
  fullWidth = true,
  size = "small",
  height,
  width,
  sx = {},
}) => {
  return (
    <FormControl fullWidth={fullWidth} size={size} error={error} disabled={disabled} sx={{ width, ...sx }}>
      <InputLabel required={required}>{label}</InputLabel>
      <Select
        name={name}
        value={value}
        label={label}
        onChange={onChange}
        sx={{
          backgroundColor: "#fff",
          height,
        }}
      >
        {options.length > 0 ? (
          options.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled value="">
            No options available
          </MenuItem>
        )}
      </Select>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectControl;
