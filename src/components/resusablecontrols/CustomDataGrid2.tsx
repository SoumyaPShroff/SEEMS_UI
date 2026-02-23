import  { useMemo, useState } from "react";
import { Box, IconButton, InputAdornment, Paper, TextField, Typography,} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { DataGrid } from "@mui/x-data-grid";
import type {
  GridColDef,
  GridColumnVisibilityModel,
  GridRowIdGetter,
  GridValidRowModel,
  GridRowParams,
} from "@mui/x-data-grid";

interface CustomDataGrid2Props<TRow extends GridValidRowModel = GridValidRowModel> {
  rows: TRow[];
  columns: GridColDef<TRow>[];
  title?: string;
  loading?: boolean;
  rowHeight?: number;
  gridHeight?: number | string;
  searchableFields?: Array<keyof TRow | string>;
  placeholder?: string;
  getRowId?: GridRowIdGetter<TRow>;
  columnVisibilityModel?: GridColumnVisibilityModel;
  onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void;
  onRowClick?: (row: TRow) => void;
}

const CustomDataGrid2 = <TRow extends GridValidRowModel = GridValidRowModel>({
  rows,
  columns,
  title,
  loading = false,
  rowHeight = 34,
  gridHeight = 460,
  searchableFields,
  placeholder = "Search records...",
  getRowId,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  onRowClick,
}: CustomDataGrid2Props<TRow>) => {
  const [searchInput, setSearchInput] = useState("");
  const searchTerm = searchInput.trim().toLowerCase();

  const clearSearch = () => setSearchInput("");

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;

    return rows.filter((row) => {
      const keys =
        searchableFields && searchableFields.length > 0
          ? searchableFields
          : (Object.keys(row) as string[]);

      const haystack = keys
        .map((key) => {
          const value = (row as Record<string, unknown>)[String(key)];
          return value == null ? "" : String(value);
        })
        .join(" ")
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [rows, searchTerm, searchableFields]);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: "14px",
        border: "1px solid #d6e1f2",
        background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
      }}
    >
      <Box
        sx={{
          mb: 1.5,
          p: 1.2,
          borderRadius: "10px",
          border: "1px solid #d6e1f2",
          background: "linear-gradient(90deg, #eef4ff 0%, #e8f7ff 100%)",
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        {title && (
          <Typography
            sx={{
              fontWeight: 700,
              color: "#0f3f7f",
              fontSize: "1rem",
              mr: "auto",
            }}
          >
            {title}
          </Typography>
        )}

        <TextField
          size="small"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 240, flex: "1 1 280px", maxWidth: 420, backgroundColor: "#fff" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchInput ? (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small" edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      </Box>

      <Box sx={{ height: gridHeight, width: "100%" }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          rowHeight={rowHeight}
          getRowId={getRowId}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={onColumnVisibilityModelChange}
          onRowClick={(params: GridRowParams<TRow>) => onRowClick?.(params.row)}
          disableRowSelectionOnClick
          density="compact"
          showCellVerticalBorder
          showColumnVerticalBorder
          sx={{
            border: "1px solid #d6e1f2",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            "& .MuiDataGrid-columnHeaders": {
              //backgroundColor: "#1f4e8c !important",
                backgroundColor: "#2c5c9a !important",
              borderBottom: "1px solid #c8d8f4",
            },
            "& .MuiDataGrid-columnHeader": {
             // backgroundColor: "#1f4e8c !important",
               backgroundColor: "#2c5c9a !important",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontWeight: 700,
              color: "#ffffff",
              fontSize: "0.86rem",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "0.82rem",
              borderColor: "#e5ecf8",
            },
            "& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type": {
              borderRight: "none",
            },
            "& .MuiDataGrid-filler": {
              display: "none",
            },
            "& .MuiDataGrid-row:nth-of-type(2n)": {
              backgroundColor: "#fbfdff",
            },
            "& .MuiDataGrid-row:hover": {
              backgroundColor: "#eef5ff",
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #dbe6f8",
              backgroundColor: "#f7faff",
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default CustomDataGrid2;
