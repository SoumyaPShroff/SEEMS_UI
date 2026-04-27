import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../../../../../const/BaseUrl";

interface SalesManagerTarget {
  id: number; // Assuming 'id' is always a number for the target entry itself
  salesrespid: string | number | null | undefined; // Allow null/undefined for robustness
  designtargetvalue: number; 
  vadtptargetvalue: number;   
  totaltargetvalue: number;    
}

interface Props {
  managers: { name: string; id: string | number }[];
}

const SalesManagerTargetTable: React.FC<Props> = ({ managers }) => {
  const [targets, setTargets] = useState<SalesManagerTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchedManagerNames, setFetchedManagerNames] = useState<Record<string | number, string>>({});
  const [loadingManagerNames, setLoadingManagerNames] = useState(true);

  useEffect(() => {
    const fetchTargetsAndManagerNames = async () => {
      try {
        // Fetch targets data
        const targetsResponse = await axios.get<SalesManagerTarget[]>(`${baseUrl}/api/Sales/SalesManagersTargets`);
        setTargets(targetsResponse.data || []); // Ensure targets is an array

        // Extract unique salesrespid from fetched targets
        const uniqueSalesRespIds = Array.from(new Set(
          targetsResponse.data
            .map(t => t.salesrespid)
            .filter((id): id is string | number => id !== null && id !== undefined)
        ));

        // If no unique IDs, we can stop here for names
        if (uniqueSalesRespIds.length === 0) {
          setLoadingManagerNames(false);
          return;
        }

        // Fetch names for each unique salesrespid
        const namesPromises = uniqueSalesRespIds.map(async (id) => {
          try {
            const response = await axios.get<string>(`${baseUrl}/UserName/${id}`);
            return { id, name: response.data }; // API returns plain string
          } catch (error) {
            console.error(`Error fetching name for salesrespid ${id}:`, error);
            return { id, name: `Error: ${id}` }; // Fallback name if API fails
          }
        });

        const namesResults = await Promise.all(namesPromises);
        const newFetchedNames: Record<string | number, string> = {};
        namesResults.forEach((item) => {
          newFetchedNames[item.id] = item.name;
        });
        setFetchedManagerNames(newFetchedNames);

      } catch (error) {
        console.error("Error fetching data for SalesManagerTargetTable:", error);
      } finally {
        setLoading(false);
        setLoadingManagerNames(false);
      }
    };
    fetchTargetsAndManagerNames();
  }, []);

  const getManagerName = (id: string | number | null | undefined) => {
    if (id === null || id === undefined) {
      return "N/A"; // Handle null/undefined salesrespid explicitly
    }

    if (fetchedManagerNames[id]) {
      return fetchedManagerNames[id];
    }

    const managerFromProps = managers.find((m) => String(m.id) === String(id));
    if (managerFromProps) {
      return managerFromProps.name;
    }
    return `Unknown (${id})`; // Fallback if name is not found from API or props
  };

  // ✅ Removed division by 100,000 assuming values from API are already in Lakhs
  const formatLakhs = (val: number) => `${(Number(val) || 0)} L`;

  return (
    <div
      style={{
        marginTop: "8px",
        overflowX: "auto",
        maxHeight: "200px",
        overflowY: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <table
        style={{
          width: "98%",
          margin: "0 auto",
          borderCollapse: "collapse",
          fontSize: "11px",
          textAlign: "center",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th style={thStyle}>Sales Person</th>
            <th style={thStyle}>Design Target</th>
            <th style={thStyle}>VA/DTP Target</th>
            <th style={thStyle}>Total Target</th>
          </tr>
        </thead>
        <tbody>
          {loading || loadingManagerNames ? (
            <tr>
              <td colSpan={4} style={tdStyle}>Loading targets and manager names...</td>
            </tr>
          ) : targets.length === 0 ? (
            <tr>
              <td colSpan={4} style={tdStyle}>No sales manager targets found.</td>
            </tr>
          ) : (
            targets.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{getManagerName(row.salesrespid)}</td>
                <td style={tdStyle}>{formatLakhs(row.designtargetvalue)}</td>
                <td style={tdStyle}>{formatLakhs(row.vadtptargetvalue)}</td>
                <td style={{ ...tdStyle, fontWeight: "bold", color: "#1976d2" }}>
                  {formatLakhs(row.totaltargetvalue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// ✅ Small reusable styles
const thStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "4px 6px",
  fontWeight: "bold",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "3px 6px",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};
export default SalesManagerTargetTable;
