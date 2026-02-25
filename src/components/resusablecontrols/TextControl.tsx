import React from 'react';

interface TextControlProps {
  name?: string;
  value?: string | null;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  fontSize?: string | number;
  fontWeight?: React.CSSProperties["fontWeight"];
  disabled?: boolean;
  type?: "text" | "number" | "date";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  lang?: string;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
}

const TextControl: React.FC<TextControlProps> = ({
  name,
  value,
  onChange,
  placeholder,
  style,
  fontSize = "0.9rem",
  disabled,
  type = "text",
  inputMode,
  className,
  multiline = false,
  rows = 2,
  fullWidth = false,
}) => {
  const baseStyle: React.CSSProperties = {
    fontFamily: "Arial",
    fontSize,
    borderRadius: 4,
    border: "1px solid #ccc",
    padding: "8px 12px",  
    width: fullWidth ? "100%" : undefined,
    ...style,
  };

  if (multiline) {
    return (
      <textarea
        name={name}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        style={baseStyle}
        disabled={disabled}
        className={className}
        rows={rows}
      />
    );
  }

  return (
    <input
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      style={baseStyle}
      disabled={disabled}
      inputMode={inputMode}
      className={className}
    />
  );
};

export default TextControl;
