import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FaRobot, FaStar, FaTrash } from "react-icons/fa";
import styled, { keyframes } from "styled-components";
import { fetchDefaultActionCards, type DashboardActionCard } from "../const/DashboardActionCards";
import { baseUrl } from "../const/BaseUrl";
import { useFavourites } from "./FavouritesContext";

interface TeamMemberApi {
  teamMemID: string;
  teamMemName: string;
  teamMemEmailId: string;
  teamMemJobTiTle: string;
  teamMemCostcenter: string;
  teamDescription?: string;
  age?: string;
  cellnumber?: string;
}

interface EmployeeProfile {
  iDno: string;
  costcenter: string;
  reporttoperson: string;
  teamdescription: string;
  reporteeCount: number;
  teamMembers?: TeamMemberApi[];
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

const ActionCard = styled.div<{ $isFavourite?: boolean; $gradient?: string; $disabled?: boolean }>`
  width: 190px;
  height: 68px;
  border-radius: 14px;
  padding: 8px 10px;
  cursor: ${({ $disabled }) => ($disabled ? "default" : "pointer")};
  border: 1px solid #e5e7eb;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ $gradient }) => $gradient};
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;

  &:hover {
    transform: ${({ $disabled }) => ($disabled ? "none" : "translateY(-3px)")};
    box-shadow: ${({ $disabled }) =>
      $disabled ? "0 4px 10px rgba(0, 0, 0, 0.08)" : "0 6px 16px rgba(0, 0, 0, 0.12)"};
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
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
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
  margin-left: 60px;
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
  gap: 10px;
  flex-wrap: wrap;
`;

const DefaultCardsStatus = styled.p`
  margin: 0;
  font-size: 12px;
  color: #6b7280;
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
  align-items: flex-start;
  gap: 10px;
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 8px 10px 8px 8px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
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
  background: linear-gradient(135deg, #1e3a8a, #0ea5e9);
  animation: ${floatAnim} 3s ease-in-out infinite;
`;

const HelpBotInput = styled.input`
  border: none;
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  width: 100%;
  border-radius: 999px;
  padding: 10px 12px;
  font-size: 15px;

  &::placeholder {
    color: #9ca3af;
  }
`;

const HelpBotContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 240px;
  max-width: 280px;
`;

const ChatMessages = styled.div`
  color: white;
  font-size: 12px;
  max-height: 200px;
  max-width: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ChatMessageRow = styled.div<{ $role: "user" | "bot" }>`
  text-align: ${({ $role }) => ($role === "user" ? "right" : "left")};
  margin-bottom: 4px;
`;

const ChatBubble = styled.span<{ $role: "user" | "bot" }>`
  background: ${({ $role }) => ($role === "user" ? "#2563eb" : "#374151")};
  padding: 4px 8px;
   font-size: 15px;   
  border-radius: 8px;
  display: inline-block;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  max-width: 100%;
`;

const HomeDashboard = () => {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [defaultCards, setDefaultCards] = useState<DashboardActionCard[]>([]);
  const [defaultCardsLoading, setDefaultCardsLoading] = useState(true);
  const [helpText, setHelpText] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const { favouriteLinks, removeFavourite } = useFavourites();
  const navigate = useNavigate();
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const designationId = sessionStorage.getItem("SessionDesigID") || "";

  const normalizeProfile = (raw: unknown): EmployeeProfile | null => {
    if (!raw) return null;
    const source = Array.isArray(raw) ? raw[0] : raw;
    if (!source || typeof source !== "object") return null;

    const profileData = source as Partial<EmployeeProfile> & {
      teamMembers?: TeamMemberApi[];
      reporteeCount?: number | string;
    };
    const members: TeamMemberApi[] = profileData.teamMembers ?? [];
    const count = Number(profileData.reporteeCount ?? 0);

    return {
      iDno: profileData.iDno ?? "",
      costcenter: profileData.costcenter ?? "",
      reporttoperson: profileData.reporttoperson ?? "",
      teamdescription: profileData.teamdescription ?? "",
      reporteeCount: Number.isNaN(count) ? 0 : count,
      teamMembers: members,
    };
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${baseUrl}/EmployeeDetails/${loginId}`);
        const data = await res.json();
        setProfile(normalizeProfile(data));
      } catch (error) {
        console.error("Failed to fetch team members", error);
      }
    };

    void fetchProfile();
  }, [loginId]);

  useEffect(() => {
    let cancelled = false;

    const loadDefaultCards = async () => {
      try {
        if (!cancelled) {
          setDefaultCards([]);
          setDefaultCardsLoading(true);
        }

        const cards = await fetchDefaultActionCards();
        if (!cancelled) {
          setDefaultCards(cards);
        }
      } catch (error) {
        console.error("Failed to fetch default page cards", error);
      } finally {
        if (!cancelled) {
          setDefaultCardsLoading(false);
        }
      }
    };

    void loadDefaultCards();

    return () => {
      cancelled = true;
    };
  }, [designationId]);

  const handleRemoveFavourite = async (event: MouseEvent<HTMLButtonElement>, pageId: number) => {
    event.stopPropagation();

    try {
      await removeFavourite(pageId);
    } catch (error) {
      console.error("Failed to remove favourite", error);
    }
  };

  const sendMessage = async () => {
    if (!helpText.trim()) return;

    const userMsg = helpText;
    setChat(prev => [...prev, { role: "user", text: userMsg }]);
    setHelpText("");

    try {
      const res = await fetch(`${baseUrl}/api/Chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.text();
      setChat(prev => [...prev, { role: "bot", text: data }]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <DashboardLayout>
        <DefaultCardsGrid>
          {defaultCardsLoading && <DefaultCardsStatus>Loading default pages...</DefaultCardsStatus>}
          {!defaultCardsLoading && defaultCards.length === 0 && (
            <DefaultCardsStatus>No default pages configured.</DefaultCardsStatus>
          )}
          {defaultCards.map(card => {
            const isTeamCard =
              card.key === "team" ||
              card.route.toLowerCase().includes("meetmyteam") ||
              card.title.toLowerCase().includes("team");
            const isTeamCardDisabled = isTeamCard && (profile?.reporteeCount ?? 0) === 0;
            const badge = isTeamCard ? `${profile?.reporteeCount ?? 0} Members` : undefined;

            return (
              <ActionCard
                key={card.key}
                onClick={() => {
                  if (isTeamCardDisabled) return;
                  navigate(card.route);
                }}
                $gradient={card.gradient}
                $disabled={isTeamCardDisabled}
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

        <FavouritesSection>
          <FavouritesTitle>My Favourites</FavouritesTitle>
          <FavouritesCardsGrid>
            {favouriteLinks.map(fav => (
              <ActionCard
                key={fav.pageid}
                onClick={() => navigate(`/Home/${fav.route}`)}
                $gradient="linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.72) 100%)"
              >
                <FavouriteRemove
                  onClick={event => void handleRemoveFavourite(event, fav.pageid)}
                  aria-label={`Remove ${fav.pagename} from favourites`}
                >
                  <FaTrash />
                </FavouriteRemove>
                <CardIcon>
                  <FaStar color="#f59e0b" />
                </CardIcon>
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
          <HelpBotContent>
            <ChatMessages>
              {chat.map((message, index) => (
                <ChatMessageRow key={index} $role={message.role}>
                  <ChatBubble $role={message.role}>
                    {message.text}
                  </ChatBubble>
                </ChatMessageRow>
              ))}
            </ChatMessages>
            <HelpBotInput
              value={helpText}
              onChange={event => setHelpText(event.target.value)}
              placeholder="Ask me anything SEEMS related..."
              onKeyDown={event => {
                if (event.key === "Enter") {
                  void sendMessage();
                }
              }}
            />
          </HelpBotContent>
        </HelpBotBox>
      </HelpBotWrapper>
    </>
  );
};

export default HomeDashboard;
