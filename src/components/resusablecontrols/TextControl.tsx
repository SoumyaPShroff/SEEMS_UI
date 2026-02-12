import React from 'react';

interface TextControlProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  type?: "text" | "number";
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}

const TextControl: React.FC<TextControlProps> = ({
  value,
  onChange,
  placeholder,
  style,
  disabled,
  type = "text",
  inputMode,
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
      inputMode={inputMode}
    />
  );
};

export default TextControl;
