import React from "react";
import "./styles/Label.css";

interface LabelProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "menu" | "submenu";
}

const Label: React.FC<LabelProps> = ({
  text,
  className = "",
  style,
  variant = "default",
}) => {
  return (
    <label
      className={`app-label app-label--${variant} ${className}`}
      style={style}
    >
      {text}
    </label>
  );
};

export default Label;