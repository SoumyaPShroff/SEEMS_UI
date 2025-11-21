import React from "react";
import { Button } from "@mui/material";
//import { Download as DownloadIcon } from "@mui/icons-material";
import DownloadIcon from "@mui/icons-material/Download";

interface ExportButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
  variant?: "text" | "outlined" | "contained";
  style?: React.CSSProperties;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  label,
  onClick,
  icon = <DownloadIcon fontSize="small" />,
  disabled = false,
  style = {},
}) => {
  return (
    <Button
      onClick={onClick} 
      startIcon={icon}
      disabled={disabled}
      sx={{
        textTransform: "none",
        fontWeight:550,
        borderRadius: 2,
        paddingX: 2,
        ...style,
      }}
    >
      {label}
    </Button>
  );
};

export default ExportButton;
