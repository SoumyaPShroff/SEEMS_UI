import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridColumnVisibilityModel, } from "@mui/x-data-grid";

interface CustomDataGridProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  title?: string;
  rowHeight?: number;
  getRowClassName?: (params: any) => string;
  sx?: object;
  gridheight?: number | string; // ← height for scroll
  columnVisibilityModel?: GridColumnVisibilityModel;
  onColumnVisibilityModelChange?: (
    model: GridColumnVisibilityModel
  ) => void;
}

const CustomDataGrid: React.FC<CustomDataGridProps> = ({
  rows,
  columns,
  loading = false,
  title,
  rowHeight = 40,
  getRowClassName,
  sx = {},
  gridheight,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
}) => {
  
  const defaultSx = {
// ===== GRID OUTER BORDER =====
  border: "1px solid #0b0202",

  // ===== HEADER ROW =====
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#f5f7fa",
    borderBottom: "1px solid #0b0202",
    minHeight: "52px !important",
    maxHeight: "52px !important",
  },

  // Header text
"& .MuiDataGrid-columnHeader .MuiDataGrid-columnHeaderTitle": {
  fontWeight: 700,
  fontSize: "14px",
  //color: "#1a6286",
  color: "#ffffff",
  letterSpacing: "0.3px",
  whiteSpace: "normal",
  lineHeight: 1.2,
  overflow: "visible",       //wrap the colum header text to multiple lines instead of truncating with ellipsis
  textOverflow: "clip",           //
},

  // Header cells
  "& .MuiDataGrid-columnHeader": {
    borderRight: "1.5px solid #0b0202",
    backgroundColor: "#2c5c9a !important",
    color: "#ffffff",
    minHeight: "52px !important",
    maxHeight: "52px !important",
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
  },
  "& .MuiDataGrid-columnHeaderTitleContainer": {
    whiteSpace: "normal",
    overflow: "visible",
    lineHeight: 1.2,
  },

    // 🔥 REMOVE BLUE BORDER ON HOVER / FOCUS
  "& .MuiDataGrid-columnHeader:hover": {
    backgroundColor: "#e3f2fd",
  },

  "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": {
    outline: "none",
    borderRight: "1.5px solid #0b0202",
  },

    // ===== COLUMN RESIZER (🔥 THIS IS THE FIX) =====
  "& .MuiDataGrid-columnSeparator": {
    color: "#0b0202",        // controls the resize line color
    minWidth: "2px",
  },

  "& .MuiDataGrid-columnSeparator--resizing": {
    color: "#0b0202",
  },

  // optional: hide resize icon (but keep resize)
  "& .MuiDataGrid-iconSeparator": {
    display: "none",
  },
  "& .MuiDataGrid-menuIcon": {
    visibility: "visible",
    opacity: 1,
    width: "auto",
  },
  "& .MuiDataGrid-iconButtonContainer": {
    visibility: "visible",
    width: "auto",
  },
  
  // ===== BODY CELLS =====
  "& .MuiDataGrid-cell": {
    borderRight: "1.5px solid #0b0202",
   // color: "#263238",       //do not set color here to allow row-based coloring (this will override row colors based on legends)
    fontSize: "14px",
  },

  // ===== ROW SEPARATORS =====
  "& .MuiDataGrid-row": {
    borderBottom: "1.5px solid #0b0202",
  },

  // ===== HOVER EFFECT =====
  "& .MuiDataGrid-row:hover": {
    backgroundColor: "#f0f4ff",
  },
    // Filler column fix - removes ghost column border - since mui has extra filler column
  "& .MuiDataGrid-filler": {
    borderRight: "none",
  },
  //Prevent header text dimming on focus (rare edge case)
  "& .MuiDataGrid-columnHeader:focus .MuiDataGrid-columnHeaderTitle": {
  fontWeight: 700,
},
};

  return (
    <div
      style={{
        height: gridheight, // <-- important for vertical scroll
        width: "100%",
        background: "#fff",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      {title && (
        <h3
          style={{
            color: "#1976d2",
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: 600,
            border: "1px solid #d1d1d1",
            padding: "4px",
            fontSize: "16px",
          }}

        >
          {title}
        </h3>
      )}
      <div style={{ height: gridheight, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowHeight={rowHeight}
          columnHeaderHeight={52}
          getRowClassName={(params) => (getRowClassName?.(params) ?? '')}
          sx={{ ...defaultSx, ...sx }}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          disableColumnSelector={false}
        />
      </div>
    </div>
  );
};

export default CustomDataGrid;
