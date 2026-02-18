import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { FaEnvelope } from "react-icons/fa";
import type { GridColDef } from "@mui/x-data-grid";
import CustomDataGrid from "./resusablecontrols/CustomDataGrid";
import SearchControl from "./resusablecontrols/SearchControl";
import { baseUrl } from "../const/BaseUrl";

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

const Section = styled.section`
  width: 100%;
  height: 100%;
  padding: 24px 20px;
  border-radius: 12px;
  background: linear-gradient(145deg, #f6fbff, #eaf3ff);
  border: 1px solid #d7e6ff;
  box-shadow: 0 20px 40px rgba(13, 60, 132, 0.12);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  column-gap: 24px;
  row-gap: 10px;
  background: linear-gradient(135deg, #e8f1ff, #dbeafe);
  border: 1px solid #c7d8f7;
  border-radius: 8px;
  padding: 10px 12px;
`;

const Title = styled.h2`
  font-family: Arial, sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #0d3c84;
  margin: 0;
`;

const SearchWrap = styled.div`
  margin-left: auto;
  margin-right: 10px;
  width: 220px;
  max-width: 100%;
`;

const mapApiMember = (m: TeamMemberApi, index: number): TeamMember => ({
  id: m.teamMemID ?? `member-${index}`,
  name: m.teamMemName ?? "",
  title: m.teamMemJobTiTle ?? "",
  costcenter: m.teamMemCostcenter ?? "",
  email: m.teamMemEmailId ?? "",
  teamDescription: m.teamDescription ?? m.teamdescription ?? "",
  age: m.age,
  cellnumber: m.cellnumber ?? m.cellNo ?? m.teamMemCellNumber ?? "",
});

const MeetMyTeam: React.FC<MeetMyTeamProps> = ({ members = [] }) => {
  const [search, setSearch] = useState("");
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

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return effectiveMembers;

    return effectiveMembers.filter((m) =>
      `${m.name} ${m.title} ${m.costcenter} ${m.email} ${m.teamDescription ?? ""} ${m.age ?? ""} ${m.cellnumber ?? ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [effectiveMembers, search]);

  const columns = useMemo<GridColDef[]>(() => {
    const baseCols: GridColDef[] = [
      { field: "name", headerName: "Name", width: 220 },
      { field: "title", headerName: "Title", width: 250 },
      { field: "costcenter", headerName: "Cost Center", width: 130 },
      {
        field: "email",
        headerName: "Email",
        width: 270,
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
    ];

    if (filteredMembers.some((m) => (m.teamDescription || "").trim() !== "")) {
      baseCols.push({ field: "teamDescription", headerName: "Team Description", width: 220 });
    }
    if (filteredMembers.some((m) => m.age != null)) {
      baseCols.push({ field: "age", headerName: "Age", width: 90, type: "number" });
    }
    if (filteredMembers.some((m) => (m.cellnumber || "").trim() !== "")) {
      baseCols.push({ field: "cellnumber", headerName: "Phone Number", width: 150 });
    }

    return baseCols;
  }, [filteredMembers]);

  return (
    <Section>
      <Header>
        <Title>My Team Dashboard</Title>
        <SearchWrap>
          <SearchControl value={search} onChange={setSearch} width="100%" />
        </SearchWrap>
      </Header>
      <CustomDataGrid rows={filteredMembers} columns={columns} rowHeight={32} gridheight={400} />
    </Section>
  );
};

export default MeetMyTeam;


//       Card component UI ----------------------
// import React from "react";
// import styled, { keyframes } from "styled-components";
// import { FaUserTie, FaEnvelope, FaUser, FaUserAlt } from "react-icons/fa";

// export interface TeamMember {
//   id: string | number;
//   name: string;
//   title: string;
//   costcenter: string;
//   email: string;
//   gender?: string;
// }

// interface MeetMyTeamProps {
//   members?: TeamMember[];
// }

// const fadeUp = keyframes`
//   from {
//     opacity: 0;
//     transform: translateY(16px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// `;

// const Section = styled.section`
//   width: 100%;
//   border-radius: 22px;
//   padding: 10px;
//   background:
//     radial-gradient(120% 90% at 0% 0%, rgba(61, 129, 245, 0.2) 0%, rgba(61, 129, 245, 0) 60%),
//     radial-gradient(110% 90% at 100% 100%, rgba(34, 211, 238, 0.2) 0%, rgba(34, 211, 238, 0) 58%),
//     linear-gradient(140deg, #f6fbff 0%, #edf6ff 52%, #e5f2ff 100%);
//   border: 1px solid #d2e6ff;
//   box-shadow: 0 14px 28px rgba(24, 79, 161, 0.12);
// `;

// const Title = styled.h2`
//   margin: 0 0 14px;
//   font-family: "Poppins", "Segoe UI", sans-serif;
//   font-size: 1.45rem;
//   font-weight: 700;
//   color: #0d3c84;
//   letter-spacing: 0.02em;
//   text-align: center;
// `;

// const Grid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
//   gap: 10px;
// `;

// const MemberCard = styled.article<{ $index: number; $isFemale: boolean }>`
//   position: relative;
//   border-radius: 13px;
//   overflow: hidden;
//   padding: 5px;
//   border: 1px solid ${({ $isFemale }) => ($isFemale ? "#f9b4d6" : "#cde1ff")};

//   background: ${({ $isFemale }) =>
//     $isFemale
//       ? "linear-gradient(140deg, #fff0f6 0%, #ffe4f1 100%)"
//       : "linear-gradient(140deg, rgba(255,255,255,0.96) 0%, rgba(240,248,255,0.95) 100%)"};

//   box-shadow: 0 8px 20px
//     ${({ $isFemale }) => ($isFemale ? "rgba(231, 84, 158, 0.18)" : "rgba(18, 68, 145, 0.11)")};

//   animation: ${fadeUp} 0.45s ease both;
//   animation-delay: ${({ $index }) => `${$index * 0.07}s`};
//   transition: transform 0.2s ease, box-shadow 0.2s ease;

//   &:hover {
//     transform: translateY(-4px);
//     box-shadow: 0 12px 26px
//       ${({ $isFemale }) => ($isFemale ? "rgba(231, 84, 158, 0.28)" : "rgba(18, 68, 145, 0.18)")};
//   }
// `;

// const Top = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 9px;
// `;

// const AvatarWrap = styled.div<{ $isFemale: boolean }>`
//   position: relative;
//   width: 46px;
//   height: 46px;
//   border-radius: 50%;
//   overflow: hidden;
//   border: 2px solid ${({ $isFemale }) => ($isFemale ? "#f9b4d6" : "#9ec6ff")};
//   background: ${({ $isFemale }) =>
//     $isFemale
//       ? "linear-gradient(135deg, #e7549e, #ff9ec8)"
//       : "linear-gradient(135deg, #0f4ea6, #16a3d3)"};
//   flex: 0 0 auto;
// `;

// const AvatarIcon = styled.span`
//   width: 100%;
//   height: 100%;
//   display: grid;
//   place-items: center;
//   color: #ffffff;
//   font-size: 1.45rem;
//   font-weight: 700;
//   font-family: "Poppins", "Segoe UI", sans-serif;
// `;

// const Name = styled.h3`
//   margin: 0;
//   color: #0d3c84;
//   font-size: 0.92rem;
//   font-family: "Poppins", "Segoe UI", sans-serif;
// `;

// const Role = styled.p`
//   margin: 3px 0 0;
//   color: #2f5f9e;
//   font-size: 0.78rem;
//   font-family: "Poppins", "Segoe UI", sans-serif;
// `;

// const Divider = styled.div`
//   height: 1px;
//   margin: 9px 0 8px;
//   background: linear-gradient(90deg, #b8d6ff 0%, #dbeafe 100%);
// `;

// const Detail = styled.p`
//   margin: 3px 0;
//   display: flex;
//   align-items: center;
//   gap: 6px;
//   font-size: 0.76rem;
//   color: #365f94;
//   font-family: "Poppins", "Segoe UI", sans-serif;
//   overflow-wrap: anywhere;
// `;

// const EmailLink = styled.a`
//   color: #0b63d1;
//   text-decoration: underline;
//   text-underline-offset: 2px;

//   &:hover {
//     color: #084ea5;
//   }
// `;

// const EmptyState = styled.p`
//   margin: 0;
//   font-family: "Poppins", "Segoe UI", sans-serif;
//   font-size: 0.9rem;
//   color: #365f94;
// `;

// const avatarIcons = [ FaUser, FaUserAlt];
// const isFemaleGender = (gender?: string) =>
//   String(gender || "")
//     .trim()
//     .toLowerCase() === "female";

// const shouldShowTieIcon = (title?: string) => {
//   const t = String(title || "").toLowerCase();
//   return t.includes("manager") || t.includes("agm") || t.includes("operations");
// };

// const MeetMyTeam: React.FC<MeetMyTeamProps> = ({ members = [] }) => {
//   return (
//     <Section>
//       <Title>Meet My Team</Title>
//       {members.length === 0 && <EmptyState>No team members available.</EmptyState>}
//       <Grid>
//         {members.map((member, index) => {
//           const isFemale = isFemaleGender(member.gender);
//           return (
//           <MemberCard key={member.id} $index={index} $isFemale={isFemale}>
//             <Top>
//               <AvatarWrap $isFemale={isFemale}>
//                 <AvatarIcon>
//                   {React.createElement(
//                     shouldShowTieIcon(member.title)
//                       ? FaUserTie
//                       : avatarIcons[index % avatarIcons.length]
//                   )}
//                 </AvatarIcon>
//               </AvatarWrap>
//               <div>
//                 <Name>{member.name}</Name>
//                 <Role>
//                   {member.title}
//                 </Role>
//               </div>
//             </Top>
//             <Divider />
//             <Detail>
//               Cost Center: {member.costcenter}
//             </Detail>
//             <Detail>
//               <FaEnvelope />
//               <EmailLink href={`mailto:${member.email}`}>{member.email}</EmailLink>
//             </Detail>
//           </MemberCard>
//           );
//         })}
//       </Grid>
//     </Section>
//   );
// };

// export default MeetMyTeam;
