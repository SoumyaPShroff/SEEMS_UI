import React from 'react';

interface TextControlProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const TextControl: React.FC<TextControlProps> = ({ value, onChange, placeholder, style, disabled }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={style}
      disabled={disabled}
    />
  );
};

export default TextControl;