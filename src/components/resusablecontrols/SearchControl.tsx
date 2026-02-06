import React from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface SearchControlProps {
  label?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  value?: string;
  width?: string | number;
}

const SearchControl: React.FC<SearchControlProps> = ({
  label = "Search",
  placeholder = "Type to search...",
  onChange,
  value = "",
  width = "100%",
}) => {
  return (
    <TextField
      label={label}
      variant="outlined"
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ width: width, backgroundColor: "white" }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon color="action" />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton onClick={() => onChange("")} size="small" edge="end">
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default SearchControl;