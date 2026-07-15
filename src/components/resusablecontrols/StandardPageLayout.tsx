import React from "react";
import styled, { css } from "styled-components";

type PageVariant = "default" | "blue";

interface StandardPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
  variant?: PageVariant;
}

const PageRoot = styled.div<{ $variant?: PageVariant }>`
  padding: 32px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  ${({ $variant }) =>
    $variant === "blue" &&
    css`
      background: radial-gradient(circle at top right, #ecf4ff 0%, #f7fbff 42%, #eef6ff 100%);
    `}
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

const Title = styled.h1<{ $variant?: PageVariant }>`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${({ $variant }) => ($variant === "blue" ? "#0f4ea6" : "#0f172a")};
  letter-spacing: -0.3px;
`;

const SubTitle = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #64748b;
`;

const FiltersCard = styled.div<{ $variant?: PageVariant }>`
  background: ${({ $variant }) =>
    $variant === "blue" ? "linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%)" : "#ffffff"};
  border: 1px solid ${({ $variant }) => ($variant === "blue" ? "#d3e3fa" : "#e2e8f0")};
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const StandardPageCard = styled.div<{ $variant?: PageVariant }>`
  background: ${({ $variant }) =>
    $variant === "blue" ? "linear-gradient(180deg, #f8fbff 0%, #f2f8ff 100%)" : "#ffffff"};
  border: 1px solid ${({ $variant }) => ($variant === "blue" ? "#d5e3f8" : "#e2e8f0")};
  border-radius: 10px;
  overflow: hidden;
  ${({ $variant }) =>
    $variant === "blue" &&
    css`
      box-shadow: 0 14px 28px rgba(39, 95, 169, 0.08);
    `}
`;

export default function StandardPageLayout({
  title,
  subtitle,
  actions,
  filters,
  children,
  variant = "default",
}: StandardPageLayoutProps) {
  return (
    <PageRoot $variant={variant}>
      <HeaderRow>
        <TitleBlock>
          <Title $variant={variant}>{title}</Title>
          {subtitle ? <SubTitle>{subtitle}</SubTitle> : null}
        </TitleBlock>
        {actions}
      </HeaderRow>

      <ContentArea>
        {filters ? <FiltersCard $variant={variant}>{filters}</FiltersCard> : null}
        {children}
      </ContentArea>
    </PageRoot>
  );
}
