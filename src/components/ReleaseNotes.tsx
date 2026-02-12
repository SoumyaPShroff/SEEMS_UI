import React from "react";

type ReleaseNote = {
  version: string;
  date: string;
  changes: string[];
};

type Props = {
  notes?: ReleaseNote[];
};

export default function ReleaseNotes({ notes = [] }: Props) {
  const styles = {
    container: {
      padding: "10px",
      boxSizing: "border-box",
      fontFamily: "system-ui, Arial",
      overflowX: "hidden",
      width: "100%",
      height: "100%",
    } as React.CSSProperties,

    headerTitle: {
      marginBottom: "4px",
      color: "#2ea8d1",
      fontWeight: 600
    } as React.CSSProperties,

    headerDesc: {
      color: "#666",
      fontSize: "14px",
    } as React.CSSProperties,

    list: {
      display: "flex",
      flexDirection: "row",
    } as React.CSSProperties,

    card: {
      background: "rgba(31,42,55,0.95)",
      borderRadius: "10px",
      padding: "15px 8px",
      border: "1px solid #e6e6e6",
      boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
      width: "100%",
      height: "100%",
    } as React.CSSProperties,

    topRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
      flexWrap: "wrap",
      gap: "8px",
    } as React.CSSProperties,

    version: {
      fontWeight: 600,
      color: "#2ea8d1",
    } as React.CSSProperties,

    date: {
      fontSize: "13px",
      color: "#888",
    } as React.CSSProperties,

    changes: {
      paddingLeft: "18px",
      margin: 0,
      overflowWrap: "anywhere",
    } as React.CSSProperties,

    changeItem: {
      margin: "6px 0",
      wordBreak: "break-word",
      whiteSpace: "normal",
    } as React.CSSProperties,
  };

  return (
    <div style={styles.container}>
      <div>
        <h2 style={styles.headerTitle}>🚀 Product Updates</h2>
        <p style={styles.headerDesc}>Latest improvements and fixes</p>
      </div>

      <div style={styles.list}>
        {notes.map((note, index) => (
          <div key={index} style={styles.card}>
            <div style={styles.topRow}>
              <span style={styles.version}>{note.version}</span>
              <span style={styles.date}>{note.date}</span>
            </div>

            <ul style={styles.changes}>
              {note.changes.map((c, i) => (
                <li key={i} style={styles.changeItem}>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
