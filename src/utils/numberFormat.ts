export const formatAmount = (
  value: number,
  locale: string = "en-IN",
  fractionDigits: number = 2
): string => {
  return value.toLocaleString(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};
