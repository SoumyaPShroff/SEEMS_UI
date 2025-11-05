import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "./const/BaseUrl";
import "./Styles/ResetForgotPswd.css"

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [strength, setStrength] = useState({ level: 0, text: "", color: "" });

  // Read from navigation state (from Link)
  const loginIdFromState = (location.state as { loginId?: string })?.loginId ?? "";

  const [loginId, setLoginId] = useState<string>(loginIdFromState || "");

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
    // If not from navigation, try to get from sessionStorage
    if (!loginIdFromState) {
      const sessionId = sessionStorage.getItem("SessionUserID");
      if (sessionId) setLoginId(sessionId);
    }

    // Optional: store loginId back into session storage
    if (loginIdFromState) {
      sessionStorage.setItem("SessionUserID", loginIdFromState);
    }
  }, [loginIdFromState]);

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
      //  const response = await axios.post(`${baseUrl}/ResetPassword?ploginid=${loginId}&pNewpassword=${newPassword}`
      const response = await axios.post(`${baseUrl}/ResetPassword/${loginId}/${newPassword}`
      );

      if (response.status === 200) {
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
    <div className="container">
      <div className="card">
        <h2 className="title">🔒 Reset Password</h2>
        <p className="subtitle">
          Please enter your login ID and new password below.
        </p>

        <form onSubmit={handleSubmit} className="form">
          {/* Login ID */}
          <div className="inputGroup">
            <label className="label">Login ID</label>
            <input
              type="text"
              value={loginId}
              readOnly={!!loginId}
              required
              className="input"
              style={{
                backgroundColor: loginId ? "#f3f3f3" : "white",
                color: loginId ? "#666" : "black",
              }}
            />
          </div>

          {/* Old Password */}
          <div className="inputGroup">
            <label className="label">Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="input"
              placeholder="Enter old password"
            />
          </div>

          {/* New Password */}
          <div className="inputGroup">
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
              className="input"
            />

            {/* Strength Meter */}
            {newPassword && (
              <div style={{ marginTop: "6px" }}>
                <div
                  style={{
                    width: "100%",
                    height: "6px",
                    backgroundColor: "#ddd",
                    borderRadius: "4px",
                  }}
                >
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
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#333",
                    marginTop: "4px",
                  }}
                >
                  Strength: <strong>{strength.text}</strong>
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="inputGroup">
            <label className="label">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
              className="input"
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

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <button
            type="button"
            className="backButton"
            onClick={() => navigate("/Login")}
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};
export default ResetPassword;
