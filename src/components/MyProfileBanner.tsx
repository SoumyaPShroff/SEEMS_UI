import { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { baseUrl } from "../const/BaseUrl"

const FlashWrapper = styled(motion.div)`
  position: fixed;
  top: 90px;          /* below top nav */
  right: 14px;
  z-index: 800;

  background: linear-gradient(
    135deg,
    rgba(35,69,141,0.95),
    rgba(79,182,149,0.95)
  );

  color: #ffffff;
  border-radius: 14px;
  padding: 18px 12px;
  min-width: 260px;

  box-shadow:
    0 20px 40px rgba(0,0,0,0.35),
    inset 0 0 0 1px rgba(255,255,255,0.15);
`;

const Name = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const Detail = styled.div`
  font-size: 15px;
  opacity: 0.9;
  margin-top: 4px;
`;

const Divider = styled.div`
  height: 1px;
  background: rgba(255,255,255,0.25);
  margin: 10px 0;
`;

const MyProfileBanner = () => {
  const loginId = sessionStorage.getItem("SessionUserID") || "guest";
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${baseUrl}/EmployeeDetails/${loginId}`);
        const data = await res.json();
        setProfile(data[0]);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return null; // or a loader
  if (!profile) return null;

  return (
    <FlashWrapper initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Detail>ID: {profile.iDno}</Detail>
      <Detail>Cost Center: {profile.costcenter}</Detail>
      <Divider />
      <Detail>Reporting To:  {profile.reporttoperson}</Detail>
      <Detail>Team: {profile.teamdescription}</Detail>
    </FlashWrapper>
  );
};

export default MyProfileBanner;
