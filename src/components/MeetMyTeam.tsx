import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FaEnvelope } from "react-icons/fa";
import type { GridColDef } from "@mui/x-data-grid";
import { baseUrl } from "../const/BaseUrl";
import CustomerDataGrid2 from "./resusablecontrols/CustomerDataGrid2";

export interface TeamMember {
  id: string | number;
  name: string;
  title: string;
  costcenter: string;
  email: string;
  teamDescription?: string;
  age?: number;
  cellnumber?: string;
}

interface MeetMyTeamProps {
  members?: TeamMember[];
}

interface TeamMemberApi {
  teamMemID?: string | number;
  teamMemName?: string;
  teamMemEmailId?: string;
  teamMemJobTiTle?: string;
  teamMemCostcenter?: string;
  teamDescription?: string;
  age?: number;
  cellnumber?: string;
}

const mapApiMember = (m: TeamMemberApi, index: number): TeamMember => ({
  id: m.teamMemID ?? `member-${index}`,
  name: m.teamMemName ?? "",
  title:  m.teamMemJobTiTle ?? "",
  costcenter: m.teamMemCostcenter ?? "",
  email: m.teamMemEmailId ?? "",
  teamDescription: m.teamDescription  ?? "",
  age: m.age,
  cellnumber: m.cellnumber  ?? "",
});

const MeetMyTeam: React.FC<MeetMyTeamProps> = ({ members = [] }) => {
  const [fetchedMembers, setFetchedMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    if (members.length > 0) return;

    const loginId = sessionStorage.getItem("SessionUserID") || "guest";
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${baseUrl}/EmployeeDetails/${loginId}`);
        const data = await res.json();
        const source = Array.isArray(data) ? data[0] : data;
        const apiMembers: TeamMemberApi[] = source?.teamMembers ?? source?.teamMember ?? [];
        setFetchedMembers(apiMembers.map(mapApiMember));
      } catch (error) {
        console.error("Failed to fetch team members", error);
        setFetchedMembers([]);
      }
    };

    fetchMembers();
  }, [members]);

  const effectiveMembers = members.length > 0 ? members : fetchedMembers;

  const columns = useMemo<GridColDef[]>(
    () => [
      { field: "name", headerName: "Name", width: effectiveMembers.length > 5 ? 200 : 300},
      { field: "title", headerName: "Title", width: 280 },
      { field: "costcenter", headerName: "Cost Center", width: 120 },
      {
        field: "email",
        headerName: "Email",
        width: 280,
        renderCell: (params) => {
          const email = String(params.value ?? "");
          return (
            <a
              href={email ? `mailto:${email}` : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#0b63d1",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <FaEnvelope />
              {email}
            </a>
          );
        },
      },

      { field: "teamDescription", headerName: "Team Description", width: effectiveMembers.length > 5 ? 300 : 400 },
      { field: "age", headerName: "Age", width: 80, type: "number" },
      { field: "cellnumber", headerName: "Cell Number", width: 150 },
    ],
    []
  );

  return (
  <div style={{ width: "100%", height: "100%", padding: "36px 24px", border: "1px solid #d7e6ff", boxShadow: "0 20px 40px rgba(13, 60, 132, 0.12)" }}>
      <CustomerDataGrid2
        title="Meet My Team"
        rows={effectiveMembers}
        columns={columns}
        rowHeight={35}
        gridHeight={400}
        searchableFields={["name", "title", "costcenter", "email", "teamDescription", "age", "cellnumber"]}
        placeholder="Search"
      />
  </div>
  );
};

export default MeetMyTeam;
