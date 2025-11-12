import React from "react";
import {
  FormControl,
  InputLabel,
  FormHelperText,
  TextField,
  Autocomplete,
} from "@mui/material";

interface Option {
  value: string | number;
  label: string;
}

interface SelectControlProps {
  name: string;
  label: string;
  value: string | number | null;
  options: Option[];
  onChange: (e: any) => void;
  required?: boolean;
  fullWidth?: boolean;
  height?: number;
  width?: string | number;
  error?: boolean;
  helperText?: string;
  sx?: object;
}

const SelectControl: React.FC<SelectControlProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  fullWidth = true,
  height = 40,
  width = "100%",
  error = false,
  helperText,
  sx = {},
}) => {
  // Find currently selected option (for Autocomplete to display correct label)
  const selectedOption = options.find((opt) => opt.value === value) || null;

  return (
    <FormControl
      required={required}
      fullWidth={fullWidth}
      error={error}
      sx={{
        minWidth: width,
        "& .MuiOutlinedInput-root": {
          height,
        },
        "& .MuiInputBase-input": {
          padding: "6px 10px",
        },
        ...sx,
      }}
    >
      <Autocomplete
        value={selectedOption}
        options={options}
        getOptionLabel={(opt) => opt.label?.toString() ?? ""}
        onChange={(_, newValue) => {
          onChange({
            target: { name, value: newValue ? newValue.value : "" },
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            size="small"
            required={required}
          />
        )}
        PaperProps={{
          style: { maxHeight: 250 },
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            height,
          },
        }}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectControl;
