import React, { useState } from "react";

interface SearchBarProps {
  onSearchSubmit: (val: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchSubmit }) => {
  const [localSearch, setLocalSearch] = useState("");

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearchSubmit(localSearch.trim());
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 15px",
        backgroundColor: "#f4f4f9",
        borderBottom: "1px solid #ccc",
        flexWrap: "wrap",
      }}
    >
      <label style={{ fontWeight: "bold" }}>Search:</label>
      <input
        type="text"
        placeholder="Search for any field..."
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={handleKeyPress}
        style={{
          padding: "6px 10px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          width: "200px",
        }}
      />
    </div>
  );
};

export default SearchBar;
