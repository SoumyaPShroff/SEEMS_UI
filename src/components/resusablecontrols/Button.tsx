import React from "react";
import { Button as MuiButton } from "@mui/material";

interface ButtonProps {
  label: string;
  onClick: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "text" | "outlined" | "contained";
  color?: "primary" | "secondary" | "success" | "error" | "warning" | "info" | "inherit";
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  sx?: object;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  type = "button",
  variant = "contained",
  color = "primary",
  disabled = false,
  fullWidth = false,
  size = "medium",
  startIcon,
  endIcon,
  style,
  className,
  sx = {},
}) => {
  return (
    <MuiButton
      type={type}
      variant={variant}
      color={color}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      onClick={onClick}
      startIcon={startIcon}
      endIcon={endIcon}
      className={className}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 1,
        ...sx,
      }}
      style={style}
    >
      {label}
    </MuiButton>
  );
};

export default Button;
