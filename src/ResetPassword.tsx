import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "./const/BaseUrl";

interface ResetPasswordProps {
  loginId: string | null; // 👈 received as a prop from parent
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ loginId }) => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [strength, setStrength] = useState({ level: 0, text: "", color: "" });

  // 🔹 Password validation rules
  const rules = [
    { regex: /.{8,}/, message: "At least 8 characters" },
    { regex: /[A-Z]/, message: "At least one uppercase letter" },
    { regex: /[a-z]/, message: "At least one lowercase letter" },
    { regex: /[0-9]/, message: "At least one number" },
    { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  ];

  // 🔹 Evaluate password strength dynamically
  const evaluateStrength = (password: string) => {
    let passed = 0;
    rules.forEach((rule) => {
      if (rule.regex.test(password)) passed++;
    });

    const level = (passed / rules.length) * 100;

    if (level === 0) return { level, text: "", color: "" };
    else if (level <= 40) return { level, text: "Weak", color: "bg-red-500" };
    else if (level <= 80) return { level, text: "Medium", color: "bg-yellow-500" };
    else return { level, text: "Strong", color: "bg-green-500" };
  };

  // 🔹 Basic validation logic
  const validatePasswordStrength = (password: string) => {
    const failedRules = rules.filter((rule) => !rule.regex.test(password));
    if (failedRules.length === 0) return { valid: true, message: "Strong password 💪" };
    return {
      valid: false,
      message: `Weak password. Missing: ${failedRules
        .map((r) => r.message)
        .join(", ")}`,
    };
  };

  useEffect(() => {
    setStrength(evaluateStrength(newPassword));
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!oldPassword) {
      setMessage("❌ Old password is required.");
      return;
    }

    // 🔒 Prevent same old/new password
    if (oldPassword === newPassword) {
      setMessage("❌ New password cannot be the same as old password.");
      return;
    }

    // ✅ Check password strength
    const { valid, message: strengthMsg } = validatePasswordStrength(newPassword);
    if (!valid) {
      setMessage(`⚠️ ${strengthMsg}`);
      return;
    }

    // ✅ Match confirmation
    if (newPassword !== confirmPassword) {
      setMessage("⚠️ Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseUrl}/resetpassword?ploginid=${loginId}&pNewpassword=${newPassword}`
      );

      if (response.status === 200) {
        //setMessage(response.data.message || "Password reset successfully!");
        setMessage((response.data as any).message || "Password reset successfully!");
        setNewPassword("");
        setConfirmPassword("");
        navigate("/Login");
      } else {
        setMessage(
          (response.data as any).message || "Password reset failed. Please try again."
        );
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔒 Reset Password</h2>
        <p style={styles.subtitle}>Please enter your login ID and new password below.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Login ID</label>
            <input
              type="text"
              value={loginId ?? ""}
              required
              style={{
                ...styles.input,
                backgroundColor: loginId ? "#f3f3f3" : "white",
                color: loginId ? "#666" : "black",
              }}
              readOnly={!!loginId}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter new password"
            />

            {/* 🔹 Strength Meter */}
            {newPassword && (
              <div style={{ marginTop: "6px" }}>
                <div style={{ width: "100%", height: "6px", backgroundColor: "#ddd", borderRadius: "4px" }}>
                  <div
                    style={{
                      width: `${strength.level}%`,
                      height: "6px",
                      borderRadius: "4px",
                      backgroundColor:
                        strength.text === "Strong"
                          ? "green"
                          : strength.text === "Medium"
                            ? "orange"
                            : "red",
                      transition: "width 0.3s ease",
                    }}
                  ></div>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#333", marginTop: "4px" }}>
                  Strength: <strong>{strength.text}</strong>
                </p>
              </div>
            )}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Confirm new password"
            />
          </div>

          {message && (
            <p
              style={{
                color: message.includes("success") ? "green" : "red",
                fontWeight: 500,
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            style={{
              ...styles.button,
              backgroundColor: loading ? "#5c91e6" : "#2b7be3",
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/Login")}
            style={styles.backButton}
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

// 🎨 Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#fff",
    padding: "40px 30px",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  title: { color: "#1565c0", fontSize: "1.6rem", marginBottom: "5px" },
  subtitle: { color: "#555", fontSize: "0.9rem", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { textAlign: "left" },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#333",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    outline: "none",
    fontSize: "0.9rem",
  },
  button: {
    backgroundColor: "#2b7be3",
    color: "#fff",
    padding: "10px 0",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: "1rem",
    transition: "background-color 0.3s ease",
  },
  backButton: {
    backgroundColor: "transparent",
    color: "#2b7be3",
    border: "none",
    padding: "8px 0",
    fontSize: "0.9rem",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default ResetPassword;
