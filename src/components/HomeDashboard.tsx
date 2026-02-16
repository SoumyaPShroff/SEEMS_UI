import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { FaTrash, FaStar, FaRobot } from "react-icons/fa";
import { baseUrl } from "../const/BaseUrl"
import { useFavourites } from "./FavouritesContext";
import { actionCards } from "../const/DashboardActionCards";
import MeetMyTeam from "../components/MeetMyTeam";
import type { TeamMember } from "../components/MeetMyTeam";

interface TeamMemberApi {
  teamMemID: string;
  teamMemName: string;
  teamMemEmailId: string;
  teamMenJobTiTle: string;
  teamMemCostcenter: string;
  teamMemGender?: string;
  teamMemgender?: string;
  gender?: string;
}

interface EmployeeProfile {
  iDno: string;
  costcenter: string;
  reporttoperson: string;
  teamdescription: string;
  reporteeCount: number;
  teamMembers?: TeamMemberApi[];
}

/* ================= STYLES ================= */

const ActionCard = styled.div<{ $isFavourite?: boolean; $gradient?: string }>`
  width: 190px;
  height: 68px;
  border-radius: 14px;
  padding: 8px 10px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  position: relative;

  display: flex;
  align-items: center;
  gap: 10px;

  background: ${({ $gradient }) => $gradient};
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);

  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.12);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ecfeff;
  color: #0369a1;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  font-weight: 500;
`;

const CardIcon = styled.div`
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 13px;
  color: white;

  background: linear-gradient(135deg, #1e3a8a, #0ea5e9);
  border-radius: 50%;

  box-shadow: 0 4px 10px rgba(0,0,0,0.18);
`;

const CardTitle = styled.h4<{ $isFavourite?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: ${({ $isFavourite }) => ($isFavourite ? "#422006" : "#1f2937")};
`;

const CardDesc = styled.p<{ $isFavourite?: boolean }>`
  font-size: 11px;
  line-height: 1.25;
  margin: 2px 0 0;
  color: ${({ $isFavourite }) => ($isFavourite ? "#78350f" : "#6b7280")};
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
`;

const DashboardLayout = styled.div`
   display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 40px;
  margin-left:60px;

`;

const FavouritesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
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

const FavouritesCardsGrid = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const FavouriteRemove = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: transparent;
  color: #beb5b5;
  padding: 4px;
  cursor: pointer;

  &:hover {
    color: #b45309;
  }
`;

/* ================= HELP BOT ================= */

/* ================= HELP BOT INPUT ================= */

const floatAnim = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const HelpBotWrapper = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 999;
`;

const HelpBotBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  background: rgba(17,24,39,0.95);
  backdrop-filter: blur(10px);
  border-radius: 999px;
  padding: 8px 10px 8px 8px;

  box-shadow: 0 6px 18px rgba(0,0,0,0.18);
`;

const HelpBotIcon = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  color: white;
  font-size: 20px;
  cursor: default;

  background: linear-gradient(135deg,#1e3a8a,#0ea5e9);
  animation: ${floatAnim} 3s ease-in-out infinite;
`;

const HelpBotInput = styled.input`
  border: none;
  outline: none;
  background: transparent;
  color: white;

  width: 220px;
  font-size: 13px;

  &::placeholder {
    color: #9ca3af;
  }
`;


/* ================= COMPONENT ================= */

const HomeDashboard = () => {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const { favouriteLinks, removeFavourite } = useFavourites();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const [helpText, setHelpText] = useState("");
  const navigate = useNavigate();
  const [showTeam, setShowTeam] = useState(false);

  const normalizeProfile = (raw: any): EmployeeProfile | null => {
    if (!raw) return null;
    const source = Array.isArray(raw) ? raw[0] : raw;
    if (!source) return null;

    const members: TeamMemberApi[] = source.teamMembers ?? source.teamMember ?? [];
    const count = Number(source.reporteeCount ?? members.length ?? 0);

    return {
      iDno: source.iDno ?? "",
      costcenter: source.costcenter ?? "",
      reporttoperson: source.reporttoperson ?? "",
      teamdescription: source.teamdescription ?? "",
      reporteeCount: Number.isNaN(count) ? 0 : count,
      teamMembers: members,
    };
  };
  
  const mappedMembers: TeamMember[] =
    profile?.teamMembers?.map((member) => ({
     id: member.teamMemID,
      name: member.teamMemName,
      title: member.teamMenJobTiTle,
      email: member.teamMemEmailId,
      costcenter: member.teamMemCostcenter,
      gender: member.teamMemGender || member.teamMemgender || member.gender || "",
    })) ?? [];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${baseUrl}/EmployeeDetails/${loginId}`);
        const data = await res.json();
        setProfile(normalizeProfile(data));
      } catch (error) {
        console.error("Failed to fetch team memebers", error);
      } finally {
      }
    };

    fetchProfile();
  }, [loginId]);

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
          {actionCards.map(card => {
            const badge =
              card.key === "team"
                ? `${profile?.reporteeCount ?? mappedMembers.length ?? 0} Members`
                : undefined;
    const handleClick = () => {
      if (card.key === "team") {
        setShowTeam(prev => !prev); // Toggle team section
      } else {
        navigate(card.route);
      }
    };
            return (
              <ActionCard
                key={card.key}
               // onClick={() => navigate(card.route)}
                onClick={handleClick}
                $gradient={card.gradient}
              >
                {badge && <Badge>{badge}</Badge>}
                <CardIcon>{card.icon}</CardIcon>
                <CardBody>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDesc>{card.desc}</CardDesc>
                </CardBody>
              </ActionCard>
            );
          })}
        </DefaultCardsGrid>
        {/* {mappedMembers.length > 0 && <MeetMyTeam members={mappedMembers} />} */}
        {showTeam && (<MeetMyTeam members={mappedMembers} />)}
        {/* FAVOURITES */}
        <FavouritesSection>
          <FavouritesTitle>My Favourites</FavouritesTitle>
          <FavouritesCardsGrid>
            {favouriteLinks.map(fav => (
              <ActionCard
                key={fav.pageid}
                onClick={() => navigate(`/Home/${fav.route}`)}
                //80deea
                $gradient="linear-gradient(135deg,  #whitemoon 0%, #163033 100%)"
              >
                <FavouriteRemove
                  onClick={(e) => handleRemoveFavourite(e, fav.pageid)}
                  aria-label={`Remove ${fav.pagename} from favourites`}
                >
                  <FaTrash />
                </FavouriteRemove>
                <CardIcon><FaStar color="#f59e0b" /></CardIcon>
                <CardBody>
                  <CardTitle>{fav.pagename}</CardTitle>
                  <CardDesc>Open favourite page</CardDesc>
                </CardBody>
              </ActionCard>
            ))}
          </FavouritesCardsGrid>
        </FavouritesSection>
      </DashboardLayout>
      <HelpBotWrapper>
        <HelpBotBox>
          <HelpBotIcon>
            <FaRobot />
          </HelpBotIcon>

          <HelpBotInput
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            placeholder="Ask me anything..."
          />
        </HelpBotBox>
      </HelpBotWrapper>
    </>
  );
};

export default HomeDashboard;
