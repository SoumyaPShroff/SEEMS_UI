import * as XLSX from "xlsx-js-style";

interface ExportToExcelProps<T> {
  data: T[];
  sheetName?: string;
  fileName?: string;
  columns?: Array<{ field: string; headerName?: string }>;
}

export function exporttoexcel<T extends Record<string, any>>(
  data: T[],
  sheetName?: string,
  fileName?: string
): void;
export function exporttoexcel<T extends Record<string, any>>(
  options: ExportToExcelProps<T>
): void;
export function exporttoexcel<T extends Record<string, any>>(
  arg1: T[] | ExportToExcelProps<T>,
  sheetName = "Sheet1",
  fileName = "export.xlsx"
): void {
  const normalized =
    Array.isArray(arg1)
      ? { data: arg1, sheetName, fileName }
      : {
          data: arg1.data,
          sheetName: arg1.sheetName ?? sheetName,
          fileName: arg1.fileName ?? fileName,
          columns: arg1.columns,
        };

  const { data, sheetName: resolvedSheetName, fileName: resolvedFileName } =
    normalized;

  if (!data || data.length === 0) {
    console.warn("No data available for export.");
    return;
  }

  try {
    const columns =
      "columns" in normalized && Array.isArray(normalized.columns)
        ? normalized.columns
        : Object.keys(data[0] ?? {})
            .filter((key) => key !== "id")
            .map((field) => ({ field, headerName: field }));

    const exportColumns = [
      { field: "id", headerName: "SI No" },
      ...columns.filter((column) => column.field !== "id"),
    ];

    const rows = data.map((row, index) =>
      exportColumns.reduce<Record<string, any>>((acc, column) => {
        if (column.field === "id") {
          acc[column.headerName ?? column.field] = row.id ?? index + 1;
          return acc;
        }

        acc[column.headerName ?? column.field] = row[column.field];
        return acc;
      }, {})
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const columnWidths = exportColumns.map((column) => {
      const header = column.headerName ?? column.field;
      return {
        wch:
          Math.max(
            header.length,
            ...rows.map((row) => String(row[header] ?? "").length)
          ) + 4,
      };
    });

    worksheet["!cols"] = columnWidths;
    worksheet["!autofilter"] = {
      ref: worksheet["!ref"] || "A1",
    };

    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "D9D9D9" } },
        bottom: { style: "thin", color: { rgb: "D9D9D9" } },
        left: { style: "thin", color: { rgb: "D9D9D9" } },
        right: { style: "thin", color: { rgb: "D9D9D9" } },
      },
    };

    const evenRowStyle = {
      fill: { patternType: "solid", fgColor: { rgb: "F7FBFF" } },
    };

    const bodyStyle = {
      alignment: { vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "E0E0E0" } },
        bottom: { style: "thin", color: { rgb: "E0E0E0" } },
        left: { style: "thin", color: { rgb: "E0E0E0" } },
        right: { style: "thin", color: { rgb: "E0E0E0" } },
      },
    };

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (!cell) continue;

        if (row === 0) {
          cell.s = headerStyle;
        } else {
          cell.s = {
            ...bodyStyle,
            ...(row % 2 === 1 ? evenRowStyle : {}),
            alignment: {
              horizontal: col === 0 ? "center" : "left",
              vertical: "center",
              wrapText: true,
            },
          };
        }
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, resolvedSheetName);
    XLSX.writeFile(workbook, resolvedFileName);

   // console.log("Excel exported successfully.");
  } catch (error) {
   // console.error("Error exporting to Excel:", error);
  }
}
