import React, { useState , useEffect} from "react";
import axios from "axios";
import { baseUrl } from "./const/BaseUrl";
import "./styles.css";
import { useNavigate , useLocation} from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
   const navigate = useNavigate();
  const location = useLocation();
    // Try to read loginId from router state or sessionStorage
  const loginIdFromState = (location.state as { loginId?: string })?.loginId ?? "";
  const [loginId, setLoginId] = useState<string>(loginIdFromState || "");

    // Load from sessionStorage if not in state
  useEffect(() => {
    if (!loginIdFromState) {
      const sessionId = sessionStorage.getItem("SessionUserID");
      if (sessionId) setLoginId(sessionId);
    }
  }, [loginIdFromState]);

  // Keep sessionStorage in sync
  useEffect(() => {
    if (loginId) {
      sessionStorage.setItem("SessionUserID", loginId);
    }
  }, [loginId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await axios.get(`${baseUrl}/forgotpassword?ploginid=${loginId}`)

      if (response.status === 200) {
        setMessage(
          response.data.message ||
          "✅ Password reset email has been sent to your registered email."
        );
      } else {
        setMessage(
          response.data.message || "⚠️ Unable to send email. Please try again."
        );
      }
    } catch (error: any) {
      setMessage(
        error.response?.data?.message ||
        "❌ Error while sending reset link. Try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="title">🔑 Forgot Password</h2>
        <p className="subtitle">
          For your Login ID, we will locate your account and send a password reset link to your registered email.
        </p>

        <form onSubmit={handleSubmit} className="form">
          {/* Login ID */}
          <div className="inputGroup">
            <label className="label">Login ID</label>
            <input
              type="text"
              value={loginId}
              required
              readOnly={!!loginId}
              className="input"
              style={{
                backgroundColor: loginId ? "#f3f3f3" : "white",
                color: loginId ? "#666" : "black",
              }}
            />
          </div>

          {/* Message */}
          {message && (
            <p
              style={{
                color: message.startsWith("✅") ? "green" : "red",
                fontWeight: 500,
                textAlign: "center",
                marginBottom: "10px",
              }}
            >
              {message}
            </p>
          )}

          {/* Submit Button */}
          <button type="submit" className="button" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Password"}
          </button>

          {/* Back to Login */}
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

export default ForgotPassword;
