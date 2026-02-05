import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styled from "styled-components";
import { FaUsers, FaLaptop, FaClipboardList, FaClock, FaTrash } from "react-icons/fa";
import { baseUrl } from "../const/BaseUrl"
import { useFavourites } from "./FavouritesContext";
//import { useSideBarData } from "./SideBarData";
import type { SidebarItem } from "./SideBarData";

interface EmployeeProfile {
  iDno: string;
  costcenter: string;
  reporttoperson: string;
  teamdescription: string;
  reporteeCount: number;
}

/* ================= STYLES ================= */

const ActionCard = styled.div<{ $isFavourite?: boolean }>`
  width: 200px;
  height: 200px;

  border-radius: 16px;
  padding: 10px;
  cursor: pointer;
  border: 1px solid #e5e7eb;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 6px;

  position: relative; /* needed for Badge */

  background: ${({ $isFavourite }) =>
    $isFavourite
      ? "linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)"
      : "linear-gradient(135deg, #f8fafc 0%, #90ced5 45%, #ecfeff 100%)"};

  box-shadow: ${({ $isFavourite }) =>
    $isFavourite
      ? "0 0 0 2px rgba(245,158,11,0.5), 0 10px 24px rgba(245,158,11,0.35)"
      : "0 4px 10px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)"};

  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-6px);
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
  width: 54px;
  height: 54px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  background: linear-gradient(135deg, #23458d, #4fb695);
  color: #ffffff;
  font-size: 22px;

  box-shadow: 0 6px 14px rgba(35,69,141,0.35);
  margin-bottom: 16px;
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
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 32px;
  padding: 40px;
`;

const FavouritesPanel = styled.div`
  background: #fff7ed;
  border-radius: 18px;
  padding: 10px;
  border: 1px solid #fde68a;

  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 200px;
`;

const FavouritesTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
`;

const DefaultCardsGrid = styled.div`
  display: flex;
  gap:10px;
`;

const FavouriteCard = styled.div`
  height: 30px;
  border-radius: 14px;
  padding: 6px 6px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: linear-gradient(135deg, #fde68a, #f59e0b);
  cursor: pointer;

  &:hover {
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

  // const availableFaves = useMemo(() => {
  //   const allPages = flattenMenu(menu);
  //   const favIds = favouriteLinks.map(f => f.pageid);

  //   return allPages.filter(page => page.pageId && !favIds.includes(page.pageId));
  // }, [menu, favouriteLinks]);

  const handleRemoveFavourite = async (e: React.MouseEvent, pageId: number) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      await removeFavourite(pageId);
    } catch (error) {
      console.error("Failed to remove favourite", error);
    }
  };

  // const handleAddFavourite = async (e: React.MouseEvent, page: SidebarItem) => {
  //   e.stopPropagation();
  //   if (page.pageId && page.route) {
  //     await addFavourite(page.pageId, page.title, page.route);
  //     setShowAddFav(false); // close dropdown after adding
  //   }
  // };

  return (
    <>
      {/* ===== Action Cards ===== */}
      <DashboardLayout>
        {/* ⭐ FAVOURITES */}
        <FavouritesPanel>
          <FavouritesTitle>⭐ My Favourites</FavouritesTitle>

          {favouriteLinks.map(fav => (
            <FavouriteCard
              key={fav.pageid}
              onClick={() => navigate(`/Home/${fav.route}`)}
            >
              <span>{fav.pagename}</span>
              <FaTrash
                onClick={(e) => handleRemoveFavourite(e, fav.pageid)}
                style={{ color: "#d18484" }}
              />
            </FavouriteCard>
          ))}
        </FavouritesPanel>

        <DefaultCardsGrid>
          {/* My Team */}
          <ActionCard onClick={() => navigate("/Home/ComingSoon")}>
            <Badge>{profile?.reporteeCount ?? 0} Members</Badge>
            <CardIcon><FaUsers /></CardIcon>
            <CardTitle>My Team</CardTitle>
            <CardDesc>View your team members and details</CardDesc>
            {/* <CardDesc style={{ color: "#d52424" }}>Coming Soon</CardDesc> */}
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")}>
            <CardIcon><FaLaptop /></CardIcon>
            <CardTitle>Raise IT Request</CardTitle>
            <CardDesc>Request IT support or assets</CardDesc>
            {/* <CardDesc style={{ color: "#d52424" }}>Coming Soon</CardDesc> */}
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")}>
            <CardIcon><FaClipboardList /></CardIcon>
            <CardTitle>Raise SEEMS Request</CardTitle>
            <CardDesc>Submit SEEMS related requests</CardDesc>
            {/* <CardDesc style={{ color: "#d52424" }}>Coming Soon</CardDesc> */}
          </ActionCard>

          <ActionCard onClick={() => navigate("/Home/ComingSoon")}>
            <CardIcon><FaClock /></CardIcon>
            <CardTitle>My Timesheet</CardTitle>
            <CardDesc>Fill and manage your timesheet</CardDesc>
            {/* <CardDesc style={{ color: "#d52424" }}>Coming Soon - Feature under development </CardDesc> */}
          </ActionCard>

          {/* Other default cards */}
        </DefaultCardsGrid>
      </DashboardLayout>
    </>
  );
};

export default HomeDashboard;
