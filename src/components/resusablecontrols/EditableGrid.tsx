import  { useMemo } from "react";
import { Paper } from "@mui/material";
// import { toast } from "react-toastify";
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowIdGetter,
  type GridValidRowModel,
} from "@mui/x-data-grid";
import TextControl from "./TextControl";

type DropdownOption = {
  label: string;
  value: string | number;
};

export type EditableGridColumn<TRow extends GridValidRowModel = GridValidRowModel> = GridColDef<TRow> & {
  editorType?: "textcontrol" | "dropdown";
  inputType?: "text" | "number";
  dropdownOptions?: DropdownOption[];
};

type ValidateCellEditArgs<TRow extends GridValidRowModel> = {
  row: TRow;
  field: string;
  value: unknown;
};

interface EditableGridProps<TRow extends GridValidRowModel = GridValidRowModel> {
  rows: TRow[];
  columns: EditableGridColumn<TRow>[];
  onRowsChange: (nextRows: TRow[]) => void;
  getRowId?: GridRowIdGetter<TRow>;
  onValidateCellEdit?: (args: ValidateCellEditArgs<TRow>) => string | null;
}

const defaultGetRowId = (row: GridValidRowModel) => row.id ?? row.jobNumber;
const ALLOWED_TEXT_REGEX = /[^a-zA-Z0-9_,-]/g;

function sanitizeValue(value: string, inputType: "text" | "number") {
  if (inputType === "number") {
    return value.replace(/[^0-9]/g, "");
  }
  return value.replace(ALLOWED_TEXT_REGEX, "");
}

export default function EditableGrid<TRow extends GridValidRowModel = GridValidRowModel>({
  rows,
  columns,
  onRowsChange,
  getRowId,
  onValidateCellEdit,
}: EditableGridProps<TRow>) {
  const rowIdGetter = useMemo(
    () => (getRowId ?? (defaultGetRowId as GridRowIdGetter<TRow>)),
    [getRowId]
  );
  // const updateCellValue = (id: unknown, field: string, value: unknown) => {
  //   const updatedRows = rows.map((row) => {
  //     if (rowIdGetter(row) !== id) return row;

  //      if (onValidateCellEdit) {
  //       const validationMessage = onValidateCellEdit({ row, field, value });
  //        if (validationMessage) {
  //         return row;
  //        }
  //     }

  //     return { ...row, [field]: value };
  //   });

  //   onRowsChange(updatedRows);
  // };
  const updateCellValue = (id: unknown, field: string, value: unknown) => {
    const updatedRows = rows.map((row) => {
      if (rowIdGetter(row) !== id) return row;

      // ✅ build next row BEFORE validation
      const nextRow = { ...row, [field]: value };

      // ✅ run validation here
      if (onValidateCellEdit) {
        const validationMessage = onValidateCellEdit({
          row: nextRow,
          field,
          value,
        });

        // 🚫 BLOCK update if invalid
        if (validationMessage) {
          return row;   // 🚫 just block update
        }
      }

      return nextRow;
    });

    onRowsChange(updatedRows);
  };

  const resolvedColumns = useMemo(
    () =>
      columns.map((column) => {
        if (!column.editable || column.renderCell) return column;
        const editableCellClass = "editable-grid-cell";
 
  //       const mergedCellClassName =
  // typeof column.cellClassName === "function"
  //   ? (params: any) =>
  //       `${column.cellClassName(params) ?? ""} ${editableCellClass}`.trim()
  //   : `${column.cellClassName ?? ""} ${editableCellClass}`.trim();
  const originalCellClassName = column.cellClassName;

const mergedCellClassName =
  typeof originalCellClassName === "function"
    ? (params: any) =>
        `${originalCellClassName(params) ?? ""} ${editableCellClass}`.trim()
    : `${originalCellClassName ?? ""} ${editableCellClass}`.trim();

        const editorType =
          column.editorType ??
          ((column.dropdownOptions && column.dropdownOptions.length > 0) ? "dropdown" : "textcontrol");

        if (editorType === "dropdown") {
          const options = column.dropdownOptions ?? [];
          return {
            ...column,
            cellClassName: mergedCellClassName,
            renderCell: (params: GridRenderCellParams) => (
              <select
                value={params.value == null ? "" : String(params.value)}
                onChange={(e) => {
                  const selected = options.find((opt) => String(opt.value) === e.target.value);
                  updateCellValue(params.id, params.field, selected ? selected.value : e.target.value);
                }}
                style={{
                  width: "100%",
                  height: "28px",
                  border: "1px solid #3b82f6",
                  borderRadius: "4px",
                  outline: "none",
                  padding: "0 8px",
                  fontSize: "0.875rem",
                  color: "#1e293b",
                  background: "transparent",
                }}
              >
                {options.map((opt) => (
                  <option key={`${params.field}-${opt.value}`} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ),
          };
        }

        const inputType: "text" | "number" =
          column.inputType ?? (column.type === "number" ? "number" : "text");

        return {
          ...column,
          cellClassName: mergedCellClassName,
          renderCell: (params: GridRenderCellParams) => (
            <TextControl
              type={inputType}
              inputMode={inputType === "number" ? "numeric" : "text"}
              value={params.value == null ? "" : String(params.value)}
              onChange={(e) => {
                const next = sanitizeValue(e.target.value, inputType);
                const normalized = inputType === "number" ? (next === "" ? "" : Number(next)) : next;
                updateCellValue(params.id, params.field, normalized);
              }}
              style={{
                width: "100%",
                height: "28px",
                border: "1px solid #3b82f6",
                borderRadius: "4px",
                outline: "none",
                padding: "0 8px",
                fontSize: "0.875rem",
                color: "#1e293b",
                background: "transparent",
              }}
            />
          ),
        };
      }),
    [columns, rows, rowIdGetter, onValidateCellEdit]
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        height: "65vh", 
        border: "1px solid #94a3b8",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "none",
      }}
    >
      <DataGrid
        rows={rows}
        columns={resolvedColumns}
        getRowId={rowIdGetter}
       // autoHeight
        density="compact"
        // density="comfortable"  
        //too space use comfortable for density
        //  columnHeaderHeight={32}   //   smaller header height
        disableRowSelectionOnClick
        showColumnVerticalBorder
        showCellVerticalBorder
        processRowUpdate={(newRow) => {
          const updatedRows = rows.map(r =>
            r.id === newRow.id ? newRow : r
          );

          onRowsChange(updatedRows);

          return newRow;
        }}
        sx={{

          /* 🔥 REMOVE ALL DEFAULT MUI BORDERS */
          "& .MuiDataGrid-withBorderColor": {
            borderColor: "#000 !important",
          },

          "& .MuiDataGrid-columnHeaders": {
            // color: "#4370da",
            color: "#2f4fa8",
            fontWeight: "bold",
            textTransform: "none",
            fontFamily: "-apple-systeem, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu",
            backgroundColor: "#e5e7eb !important",
          },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: "#e5e7eb !important",
            borderRight: "1px solid #000 !important",
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #000 !important",
            borderRight: "1px solid #000 !important",
            display: "flex",
            alignItems: "center",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu",
            fontSize: "0.85rem",
            color: "black"
          },

          "& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type": {
            borderRight: "none",
          },
          "& .editable-grid-cell": {
            backgroundColor: "#e5e7eb !important",
          },
          "& .editable-grid-cell input, & .editable-grid-cell select": {
            backgroundColor: "transparent !important",
          },
          "& .editable-grid-cell input:hover, & .editable-grid-cell select:hover": {
            backgroundColor: "#eff6ff",
            borderColor: "#60a5fa",
          },
          "& .editable-grid-cell input:focus, & .editable-grid-cell select:focus": {
            backgroundColor: "#dbeafe",
            borderColor: "#2563eb",
          },

          "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus": {
            outline: "none",
          },
          "& .invalid-cell": {
            backgroundColor: "#fee2e2 !important",
            borderColor: "#dc2626 !important",
          },
        }}
      />
    </Paper>
  );
}
