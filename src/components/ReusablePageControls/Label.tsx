import React from 'react';

interface LabelProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ text, style, className }) => {
  return <label className={className} style={style}>{text}</label>;
};

export default Label;