
import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import { Outlet } from "react-router-dom";
import styled from "styled-components";

interface HomeProps {
  userId: string | null;
  setUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const PageContent = styled.div<{ collapsed: boolean }>`
  margin-left: ${({ collapsed }) => (collapsed ? "72px" : "240px")};
  margin-top: 80px;
  transition: margin-left 0.25s ease;
  min-height: calc(100vh - 80px);
  background: white; /* professional light background */
`;

const Home: React.FC<HomeProps> = ({ userId, setUserId }) => {
  const [collapsed, setCollapsed] = useState(true);
  if (!userId) return null;

  return (
    <>
      <Sidebar
        sessionUserID={userId}
        setUserId={setUserId}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Child routes render here */}
      <PageContent collapsed={collapsed}>
        <Outlet />
      </PageContent>
      {/* <Outlet /> */}
    </>
  );
};

export default Home;
