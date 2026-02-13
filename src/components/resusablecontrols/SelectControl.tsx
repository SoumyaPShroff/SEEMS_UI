import React from "react";
import { FormControl, FormHelperText, TextField,  Autocomplete,} from "@mui/material";

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
  disabled?: boolean;
  fontSize?: string | number;
  shrinkLabel?: boolean;
  //size?: "small" | "medium";
}

const SelectControl: React.FC<SelectControlProps> = ({
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  fullWidth = true,
  height = 32,
  width = "100%",
  error = false,
  helperText,
  fontSize = "0.9rem",
  shrinkLabel = true,
  sx = {},
}) => {
  // const controlFontFamily =
  //   "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu";
  const controlFontFamily ="Arial";

  // Find currently selected option (for Autocomplete to display correct label)
 // const selectedOption = options.find((opt) => opt.value === value) || null;
const selectedOption =
  options?.find((opt) => opt?.value !== undefined && opt.value === value) || null;

  return (
    <FormControl
      required={required}
      fullWidth={fullWidth}
      error={error}
      sx={{
        minWidth: width,
        fontFamily: controlFontFamily,
        "& .MuiOutlinedInput-root": {
          height,
        },
        "& .MuiInputBase-input": {
          padding: "8px 10px",
          fontFamily: controlFontFamily,
          fontSize, 
        },
        "& .MuiInputLabel-root": {
          fontFamily: controlFontFamily,
          fontSize,
        },
        ...sx,
      }}
    >
      <Autocomplete
        value={selectedOption}
       // options={options}
       options={options || []}
        getOptionLabel={(opt) => opt.label?.toString() ?? ""}
        isOptionEqualToValue={(option, val) => option.value === val.value}
        onChange={(_, newValue) => {
          onChange({
            target: { name, value: newValue ? newValue.value : "" },
          });
        }}
        renderInput={(params) => (
          <TextField
            {...params}
           label={
              <>
                {label}
                {required && (
                  <span style={{ color: "red", marginLeft: 2 }}>*</span>
                )}
              </>
            }
            size="small"
            InputLabelProps={{ shrink: shrinkLabel }}
            sx={{
              "& .MuiInputLabel-root": {
                fontSize,
              },
            }}
          />
        )}
        ListboxProps={{
          style: { maxHeight: 250, fontFamily: controlFontFamily, fontSize: `${fontSize}` },
        }}
        sx={{
          fontFamily: controlFontFamily,
          "& .MuiOutlinedInput-root": {
            height,
          },
          "& .MuiInputBase-input": {
            fontFamily: controlFontFamily,
           fontSize
          },
          "& .MuiInputLabel-root": {
            fontFamily: controlFontFamily,
            fontSize: "1.1rem"
          },
        }}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
};

export default SelectControl;
