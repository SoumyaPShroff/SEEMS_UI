import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaUsers, FaLaptop, FaClipboardList, FaClock } from "react-icons/fa";
import MyProfileBanner from  "../components/MyProfileBanner";
import { color } from "framer-motion";
/* ================= STYLES ================= */

const PageTitle = styled.h2`
  margin-bottom: 16px;
  color: #1f2937;
`;

const InfoCard = styled.div`
  background: #ffffff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 32px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
`;

const InfoItem = styled.div`
  font-size: 14px;
  color: #374151;

  span {
    display: block;
    font-weight: 600;
    color: #111827;
  }
`;

const ActionCard = styled.div`
 background: linear-gradient(
  135deg,
  #f8fafc 0%,
  #90ced5 45%,
  #ecfeff 100%
);
  border-radius: 16px;
  padding: 28px;
  cursor: pointer;
  border: 1px solid #e5e7eb;

  box-shadow:
    0 4px 10px rgba(0,0,0,0.05),
    0 1px 2px rgba(0,0,0,0.04);

  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-6px);
    border-color: #4fb695;

    box-shadow:
      0 14px 30px rgba(35,69,141,0.18),
      0 6px 12px rgba(79,182,149,0.25);
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

const CardTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
`;

const CardDesc = styled.p`
  font-size: 14px;
  line-height: 1.4;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  padding : 40px;
  margin-top: 200px;
`;

/* ================= COMPONENT ================= */

const HomeDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
<MyProfileBanner />

      {/* ===== Action Cards ===== */}
      <Cards>
        <ActionCard onClick={() => navigate("/Home/MyTeam")}>
            <Badge>4 Members</Badge>
          <CardIcon><FaUsers /></CardIcon>
          <CardTitle>My Team</CardTitle>
          <CardDesc>View your team members and details</CardDesc>
          <CardDesc style={{ color: "#d52424" }}>Coming Soon - Feature under development </CardDesc>
        </ActionCard>

        <ActionCard onClick={() => navigate("/Home/AddITRequest")}>
          <CardIcon><FaLaptop /></CardIcon>
          <CardTitle>Raise IT Request</CardTitle>
          <CardDesc>Request IT support or assets</CardDesc>
            <CardDesc style={{ color: "#d52424" }}>Coming Soon - Feature under development </CardDesc>
        </ActionCard>

        <ActionCard onClick={() => navigate("/Home/AddSeemsRequest")}>
          <CardIcon><FaClipboardList /></CardIcon>
          <CardTitle>Raise SEEMS Request</CardTitle>
          <CardDesc>Submit SEEMS related requests</CardDesc>
            <CardDesc style={{ color: "#d52424" }}>Coming Soon - Feature under development </CardDesc>
        </ActionCard>

        <ActionCard onClick={() => navigate("/Home/Timesheet")}>
          <CardIcon><FaClock /></CardIcon>
          <CardTitle>My Timesheet</CardTitle>
          <CardDesc>Fill and manage your timesheet</CardDesc>
            <CardDesc style={{ color: "#d52424" }}>Coming Soon - Feature under development </CardDesc>
        </ActionCard>
      </Cards>
    </>
  );
};

export default HomeDashboard;
