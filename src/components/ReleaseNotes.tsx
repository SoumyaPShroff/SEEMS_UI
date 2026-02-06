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
      maxWidth: "700px",
      margin: "30px auto",
      padding: "20px",
      fontFamily: "system-ui, Arial",
    } as React.CSSProperties,

    headerTitle: {
      marginBottom: "4px",
    } as React.CSSProperties,

    headerDesc: {
      color: "#666",
      fontSize: "14px",
    } as React.CSSProperties,

    list: {
      marginTop: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    } as React.CSSProperties,

    card: {
      background: "#ffffff",
      borderRadius: "10px",
      padding: "16px 18px",
      border: "1px solid #e6e6e6",
      boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
    } as React.CSSProperties,

    topRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    } as React.CSSProperties,

    version: {
      fontWeight: 600,
      color: "#1f3c88",
    } as React.CSSProperties,

    date: {
      fontSize: "13px",
      color: "#888",
    } as React.CSSProperties,

    changes: {
      paddingLeft: "18px",
      margin: 0,
    } as React.CSSProperties,

    changeItem: {
      margin: "6px 0",
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
