import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { FaSearch } from "react-icons/fa";

const SearchableDataGrid = ({ columns, rows }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter rows dynamically based on search input
    const filteredRows = rows.filter((row) =>
        columns.some((col) =>
            row[col.field]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
    );

    return (
        <div className="p-6">
            {/* Search Bar with Magnifier Icon */}
            <div className="flex items-center border border-gray-300 rounded-md p-2 w-80 mb-4">
                <FaSearch className="text-gray-500 mr-2" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="outline-none w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* DataGrid Display */}
            <div style={{ height: 400, width: "100%" }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    pageSize={5}
                    disableSelectionOnClick
                />
            </div>
        </div>
    );
};

export default SearchableDataGrid;
