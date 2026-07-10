export const formatInLakhs = (
  value: number,
  fractionDigits = 2
): string => {
  if (!value && value !== 0) return "0";

  const lakhs = value / 100000;

  return `${lakhs.toFixed(fractionDigits)} L`;
};
