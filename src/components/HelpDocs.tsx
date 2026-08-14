import React from "react";
import { FaFileWord } from "react-icons/fa";
import type { HelpDoc } from "./HelpDocsText";

type Props = {
  docs?: HelpDoc[];
  onLinkClick?: () => void;
};

export default function HelpDocs({ docs = [], onLinkClick }: Props) {
  const styles = {
    container: {
      padding: "10px",
      boxSizing: "border-box",
      fontFamily: "system-ui, Arial",
      width: "100%",
    } as React.CSSProperties,

    headerTitle: {
      marginBottom: "4px",
      color: "#2ea8d1",
      fontWeight: 600,
    } as React.CSSProperties,

    headerDesc: {
      color: "#666",
      fontSize: "14px",
      marginBottom: "10px",
    } as React.CSSProperties,

    list: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    } as React.CSSProperties,

    item: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "rgba(31,42,55,0.95)",
      borderRadius: "10px",
      padding: "10px 12px",
      border: "1px solid #e6e6e6",
      textDecoration: "none",
      color: "#f8fafc",
    } as React.CSSProperties,

    itemIcon: {
      fontSize: "1.3rem",
      color: "#2ea8d1",
      flexShrink: 0,
    } as React.CSSProperties,

    itemName: {
      fontWeight: 600,
      fontSize: "0.9rem",
    } as React.CSSProperties,

    itemDesc: {
      fontSize: "0.78rem",
      color: "#c7d2da",
    } as React.CSSProperties,

    empty: {
      color: "#666",
      fontSize: "14px",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div>
        <h2 style={styles.headerTitle}>Help</h2>
        <p style={styles.headerDesc}>Guides and documentation</p>
      </div>

      {docs.length === 0 ? (
        <p style={styles.empty}>No help documents available.</p>
      ) : (
        <div style={styles.list}>
          {docs.map((doc) => (
            <a
              key={doc.path}
              href={doc.path}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.item}
              onClick={onLinkClick}
            >
              <FaFileWord style={styles.itemIcon} />
              <div>
                <div style={styles.itemName}>{doc.name}</div>
                <div style={styles.itemDesc}>{doc.description}</div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
