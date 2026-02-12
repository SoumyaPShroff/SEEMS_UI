import React from "react";
import styled from "styled-components";

interface StandardPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

const PageRoot = styled.div`
  padding: 32px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
`;

const TitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
`;

const SubTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
`;

const FiltersCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StandardPageCard = styled.div`
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
`;

export default function StandardPageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
}: StandardPageLayoutProps) {
  return (
    <PageRoot>
      <HeaderRow>
        <TitleBlock>
          <Title>{title}</Title>
          {subtitle ? <SubTitle>{subtitle}</SubTitle> : null}
        </TitleBlock>
        {actions}
      </HeaderRow>

      <ContentArea>
        {filters ? <FiltersCard>{filters}</FiltersCard> : null}
        {children}
      </ContentArea>
    </PageRoot>
  );
}
