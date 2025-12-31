import * as XLSX from "xlsx";

/**
 * Export JSON data to an Excel file.
 *
 * @param data - The array of objects to export (each key becomes a column).
 * @param sheetName - The name of the sheet inside Excel.
 * @param fileName - The name of the file to save (default: export.xlsx).
 */
export const exporttoexcel = (
  data: any[],
  sheetName: string = "Sheet1",
  fileName: string = "export.xlsx"
): void => {
  if (!data || data.length === 0) {
    console.warn("⚠️ No data available for export.");
    return;
  }
 
 const formattedData = data.map(({ id, ...rest }, index) => ({
      SINo: id ?? index + 1, // rename id -> SINo
      ...rest,              
    }));
 
  try {
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error("❌ Error exporting to Excel:", error);
  }
};
