import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface CustomDataGridProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  title?: string;
  rowHeight?: number;
  headerColor?: string;
  hoverColor?: string;
  getRowClassName?: (params: any) => string;
  sx?: object; // ✅ accept external sx (like dataGridSx)
}

const CustomDataGrid: React.FC<CustomDataGridProps> = ({
  rows,
  columns,
  loading = false,
  title,
  rowHeight = 40,
  headerColor = "#1976d2",
  hoverColor = "#f5f5f5",
  getRowClassName,
  sx = {}, // ✅ allow override
}) => {
  // Default sx — can be merged with external sx
  const defaultSx = {
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: headerColor,
      color: "#fff",
      fontWeight: "bold",
      fontSize: "0.9rem",
    },
    "& .MuiDataGrid-columnSeparator": { display: "none" },
    "& .MuiDataGrid-row:hover": { backgroundColor: hoverColor },
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
        sx={{ ...defaultSx, ...sx }} // ✅ Merge styles
      />
    </div>
  );
};

export default CustomDataGrid;
