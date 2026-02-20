import React from "react";
import "./styles/Label.css";

interface LabelProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "menu" | "submenu";
  fontSize?: string | number;
  bold?: boolean;
  required?: boolean;
}

const Label: React.FC<LabelProps> = ({
  text,
  className = "",
  style,
  variant = "default",
  fontSize = "12px",
  bold = false,
  required = false,
}) => {
  return (
    <label
      className={`app-label app-label--${variant} ${className}`}
      style={{ fontFamily: "Arial", fontSize, fontWeight: bold ? 700 : 400, ...style }}
    >
      {text}
      {required && <span style={{ color: "red", marginLeft: 2 }}>*</span>}
    </label>
  );
};

export default Label;
