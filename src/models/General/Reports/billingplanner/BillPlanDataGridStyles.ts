//code changed w.r.t mui grid cell text color and hover effect
//duplicate window - colour coding fails
export const dataGridSx = {
  "& .MuiDataGrid-row.row-red .MuiDataGrid-cell": {
    color: "#f42323ff !important",
    fontWeight: 450,
  },
  "& .MuiDataGrid-row.row-green .MuiDataGrid-cell": {
    color: "#45811dff !important",
    fontWeight: 450,
  },
  "& .MuiDataGrid-row.row-blue .MuiDataGrid-cell": {
    color: "#340cd6ff !important",
  },
  "& .MuiDataGrid-row.row-black .MuiDataGrid-cell": {
    color: "black !important",
    fontWeight: 450,
  },
  "& .MuiDataGrid-row.row-purple .MuiDataGrid-cell": {
    color: "#d517f2c2 !important",
    fontWeight: 450,
  },
  "& .MuiDataGrid-row.row-detail .MuiDataGrid-cell": {
    backgroundColor: "#f1d27d !important",
    color: "#1f2937 !important",
    fontWeight: 500,
  },
    "& .row-detail": {
    //backgroundColor: "red",

    "& .MuiDataGrid-cell": {
      borderRight: "none !important",
    },

    "& .MuiDataGrid-cell:first-of-type": {
      borderLeft: "none !important",
    },
  },
};
