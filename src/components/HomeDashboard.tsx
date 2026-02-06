import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { FaUsers, FaLaptop, FaClipboardList, FaClock, FaTrash } from "react-icons/fa";
import { baseUrl } from "../const/BaseUrl"
import { useFavourites } from "./FavouritesContext";
import type { SidebarItem } from "./SideBarData";

interface EmployeeProfile {
  iDno: string;
  costcenter: string;
  reporttoperson: string;
  teamdescription: string;
  reporteeCount: number;
}

/* ================= STYLES ================= */

const ActionCard = styled.div<{ $isFavourite?: boolean; $gradient?: string }>`
  width: 180px;
  height: 140px;

  border-radius: 14px;
  padding: 10px 12px; 
  cursor: pointer;
  border: 1px solid #e5e7eb;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
 
  background: ${({ $gradient }) => $gradient};
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);

  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 18px;
  right: 18px;
  background: #ecfeff;
  color: #0369a1;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 500;
`;

const CardIcon = styled.div`
 width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 16px;
  color: white;

  background: linear-gradient(135deg, #1e3a8a, #0ea5e9);
  border-radius: 50%;

  box-shadow: 0 4px 10px rgba(0,0,0,0.18);
`;
 
const CardTitle = styled.h4<{ $isFavourite?: boolean }>`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
  color: ${({ $isFavourite }) => ($isFavourite ? "#422006" : "#1f2937")};
`;

const CardDesc = styled.p<{ $isFavourite?: boolean }>`
  font-size: 14px;
  line-height: 1.4;
  color: ${({ $isFavourite }) => ($isFavourite ? "#78350f" : "#6b7280")};
`;

const DashboardLayout = styled.div`
   display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  margin-left : 200px;

`;

// const FavouritesPanel = styled.div`
//   background: linear-gradient(135deg, #e0f7fa 0%, #80deea 100%);
//   border-radius: 18px;
//   padding: 10px;
//   align-self: start;                   /* height adjust automicatically*/
//   display: flex;
//   flex-direction: column;
//   gap: 2px;
//   width: 200px;
//   margin-top: 10px;
// `;

const FavouritesPanel = styled.div`
  // background: linear-gradient(
  //   135deg,
  //   #fff8dc 0%,     /* light champagne */
  //   #f7d774 35%,    /* soft gold */
  //   #e6b85c 65%,    /* classic gold */
  //   #c9972b 100%    /* deep gold */
  // );
  background: linear-gradient(135deg, #e0f7fa 0%, #80deea 100%);
  border-radius: 18px;
  padding: 10px;
  align-self: start;   /* height adjust automatically */
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 200px;
  margin-top: 10px;
`;

const FavouritesTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #e55322;
`;

const DefaultCardsGrid = styled.div`
  display: flex;
  gap:10px;
  flex-wrap: wrap;
`;

const FavouriteLink = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  font-size: 14px;
  padding: 6px 4px;
  border-bottom: 1px solid #fde68a;
  cursor: pointer;

  color:  #1d4ed8; ;
  font-weight: 500;

  &:hover {
    color: rgb(43, 174, 23);
    transform: translateX(4px);
  }
`;
/* ================= COMPONENT ================= */

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  //addFavourite
  const { favouriteLinks, removeFavourite } = useFavourites();
  // const menu = useSideBarData();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${baseUrl}/EmployeeDetails/${loginId}`);
        const data: EmployeeProfile[] = await res.json();
        setProfile(data[0] ?? null);
      } catch (error) {
        console.error("Failed to fetch team memebers", error);
      } finally {
      }
    };

    fetchProfile();
  }, [loginId]);

  const flattenMenu = (items: SidebarItem[]): SidebarItem[] => {
    return items.reduce((acc, item) => {
      if (item.pageId && item.route) {
        acc.push(item);
      }
      if (item.subNav) {
        acc.push(...flattenMenu(item.subNav));
      }
      return acc;
    }, [] as SidebarItem[]);
  };

  const handleRemoveFavourite = async (e: React.MouseEvent, pageId: number) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      await removeFavourite(pageId);
    } catch (error) {
      console.error("Failed to remove favourite", error);
    }
  };

  return (
    <>
      {/* ===== Action Cards ===== */}
      <DashboardLayout>
        <DefaultCardsGrid>
          {/* My Team */}
          <ActionCard onClick={() => navigate("/Home/ComingSoon")} $gradient="linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)">
            <Badge>{profile?.reporteeCount ?? 0} Members</Badge>
            <CardIcon><FaUsers /></CardIcon>
            <CardTitle>My Team</CardTitle>
            <CardDesc>View your team members and details</CardDesc>
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")} $gradient="linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)">
            <CardIcon><FaLaptop /></CardIcon>
            <CardTitle>Raise IT Request</CardTitle>
            <CardDesc>Request IT support or assets</CardDesc>
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")} $gradient="linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)">
            <CardIcon><FaClipboardList /></CardIcon>
            <CardTitle>Raise SEEMS Request</CardTitle>
            <CardDesc>Submit SEEMS related requests</CardDesc>
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")} $gradient="linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)">
            <CardIcon><FaClock /></CardIcon>
            <CardTitle>My Timesheet</CardTitle>
            <CardDesc>Fill and manage your timesheet</CardDesc>
          </ActionCard>

          {/* Other default cards */}
        </DefaultCardsGrid>
        {/* ⭐ FAVOURITES */}
        <FavouritesPanel>
          <FavouritesTitle>⭐ My Favourites</FavouritesTitle>

          {favouriteLinks.map(fav => (
            <FavouriteLink
              key={fav.pageid}
              onClick={() => navigate(`/Home/${fav.route}`)}
            >
              <span>• {fav.pagename}</span>

              <FaTrash
                onClick={(e) => handleRemoveFavourite(e, fav.pageid)}
                style={{ fontSize: "12px", color: "#d18484" }}
              />
            </FavouriteLink>
          ))}
        </FavouritesPanel>
      </DashboardLayout>
    </>
  );
};

export default HomeDashboard;
