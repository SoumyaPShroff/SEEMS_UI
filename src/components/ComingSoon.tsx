import { useNavigate } from "react-router-dom";
import comingSoonImg  from "../const/Images/ComingSoon.jpg";
import underDevImg  from  "../const/Images/UnderDevelopment.jpg";

const ComingSoon = () => {
    const navigate = useNavigate();
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "70vh",
      fontSize: "22px",
      fontWeight: 600
    }}>
      <img
        src={comingSoonImg}
        alt="Coming Soon"
        style={{ width: "260px", height: "auto" }}
      />

      <img
        src={underDevImg}
        alt="Under Development"
        style={{ width: "260px", height: "auto" }}
      />
      <button
        onClick={() => navigate("/Home")}
        style={{
          padding: "10px 24px",
          fontSize: "14px",
          fontWeight: 600,
          borderRadius: "999px",
          border: "none",
          cursor: "pointer",
          background: "linear-gradient(135deg,#23458d,#4fb695)",
          color: "#fff",
          boxShadow: "0 6px 14px rgba(35,69,141,0.3)",
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
};

export default ComingSoon;
