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
  //autoHeight?: boolean;   // ← add this
  gridheight?: number | string; // ← height for scroll
  // ✅ TYPES ONLY (NO commas, NO values)
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
  // ✅ MUST be here
  columnVisibilityModel,
  onColumnVisibilityModelChange,
}) => {
  const defaultSx = {
    // Actual text inside each header cell
    "& .MuiDataGrid-columnHeaderTitle": {
      color: "SlateGrey",
      fontWeight: "bold",
      fontSize: "14px",
    },
    "& .MuiDataGrid-columnSeparator": {
      display: "none",
    },
  };

  return (
    <div
      style={{
        // height: "auto",
        height: gridheight, // <-- important for vertical scroll
        width: "100%",
        background: "#fff",
        //  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
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
            padding: "8px",
          }}

        >
          {title}
        </h3>
      )}
      <div style={{ height: gridheight, width: "100%" }}>
        <DataGrid
          //  autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          rowHeight={rowHeight}
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
