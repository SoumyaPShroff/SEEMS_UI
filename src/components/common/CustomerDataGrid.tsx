import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { FaWeight } from "react-icons/fa";

interface CustomDataGridProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  title?: string;
  rowHeight?: number;
  getRowClassName?: (params: any) => string;
  sx?: object;
}

const CustomDataGrid: React.FC<CustomDataGridProps> = ({
  rows,
  columns,
  loading = false,
  title,
  rowHeight = 40,
  getRowClassName,
  sx = {},
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
        height: "auto",
        width: "100%",
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
          }}
        >
          {title}
        </h3>
      )}

      <DataGrid
        autoHeight
        rows={rows}
        columns={columns}
        loading={loading}
        rowHeight={rowHeight}
        getRowClassName={getRowClassName}
        sx={{ ...defaultSx, ...sx }}
      />
    </div>
  );
};

export default CustomDataGrid;
