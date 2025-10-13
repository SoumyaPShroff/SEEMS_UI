export const formatLakhs = (value: number): string => (value / 100000).toFixed(2);
export const normCat = (cat: string): string => cat.trim().toLowerCase();

export const bucketFor = (job: string, enqType: string, typ: string): string | null => {
  if (!job) return null;
  if (job.endsWith("_VA")) return "VA";
  if (job.endsWith("_NPI")) return "NPI";
  if (job.endsWith("_Analysis")) return "Analysis";
  if (enqType === "OFFSHORE" && typ === "Export") return "At Office Export";
  if (enqType === "OFFSHORE" && typ === "Domestic") return "At Office Domestic";
  if (enqType === "ONSITE" && typ === "Domestic") return "Onsite Domestic";
  return "Layout";
};
