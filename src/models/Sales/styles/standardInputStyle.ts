import type { CSSProperties } from "react";

export const standardInputStyle: CSSProperties = {
  width: "100%",
  height: 34,
  border: "1px solid #cfd8e3",
  borderRadius: 6,
  padding: "0 10px",
  fontSize: 13,
  boxSizing: "border-box",
  backgroundColor: "#fff",
  marginTop: 2,
};

export const getStandardInputStyle = (
  overrides?: CSSProperties
): CSSProperties => ({
  ...standardInputStyle,
  ...(overrides ?? {}),
});

