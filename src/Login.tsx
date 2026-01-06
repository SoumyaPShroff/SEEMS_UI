import React, { useState, useEffect } from 'react';
import { baseUrl } from './const/BaseUrl';
import { useNavigate } from 'react-router-dom';
import logo1 from './const/Images/Sienna-Ecad-logo.jpg'
import logo2 from './const/Images/Sienna-Ecad-logo2.jpg'
import "../src/mainstyles/Login.css";
import { Link } from "react-router-dom";
import axios from "axios";

interface ILogin {
  userId: string | null; // Add userId to the interface
  setUserId: (id: string | null) => void;
}

const LoginPage: React.FC<ILogin> = ({ setUserId }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<React.ReactNode>(null);
  const [SessionUserID, setSessionUserID] = useState(sessionStorage.getItem('SessionUserID'));
  const navigate = useNavigate();

  //const [strength, setStrength] = useState({ level: 0, text: "", color: "" });

  // 🔹 Password validation rules
  // const rules = [
  //   { regex: /.{8,}/, message: "At least 8 characters" },
  //   { regex: /[A-Z]/, message: "At least one uppercase letter" },
  //   { regex: /[a-z]/, message: "At least one lowercase letter" },
  //   { regex: /[0-9]/, message: "At least one number" },
  //   { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
  // ];

  // // 🔹 Evaluate password strength dynamically
  // const evaluateStrength = (password: string) => {
  //   let passed = 0;
  //   rules.forEach((rule) => {
  //     if (rule.regex.test(password)) passed++;
  //   });

  //   const level = (passed / rules.length) * 100;

  //   if (level === 0) return { level, text: "", color: "" };
  //   else if (level <= 40) return { level, text: "Weak", color: "bg-red-500" };
  //   else if (level <= 80) return { level, text: "Medium", color: "bg-yellow-500" };
  //   else return { level, text: "Strong", color: "bg-green-500" };
  // };

  // // 🔹 Basic validation logic
  // const validatePasswordStrength = (password: string) => {
  //   const failedRules = rules.filter((rule) => !rule.regex.test(password));
  //   if (failedRules.length === 0) return { valid: true, message: "Strong password 💪" };
  //   return {
  //     valid: false,
  //     message: `Weak password. Missing: ${failedRules
  //       .map((r) => r.message)
  //       .join(", ")}`,
  //   };
  // };

  // useEffect(() => {
  //   setStrength(evaluateStrength(password));
  // }, [password]);

  //allow mouse key event and keyboard(enter)
  const handleLogin = async (e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e?.preventDefault();
    setLoginError('');
    if (!loginId.trim() || !password) {
      setLoginError('Please enter both Login ID and Password.');
      return;
    }
    // // ✅ Check password strength
    // const { valid, message: strengthMsg } = validatePasswordStrength(password);
    // if (!valid) {
    //   setLoginError(`⚠️ ${strengthMsg}`);
    //   return;
    // }

    try {
    //  const response = await fetch(`${baseUrl}/VerifyLoginUser/${loginId}/${password}`); // insecure - avoid GET for sensitive data - not exposing the password in URL
      const response = await fetch(`${baseUrl}/VerifyLoginUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId,
          password,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result != null) {
          setUserId(result.loginId);
          sessionStorage.setItem('SessionUserID', result.loginId);
          setSessionUserID(result.loginId);
          const responseName = await axios.get<string>(`${baseUrl}/UserName/${loginId}`);
          sessionStorage.setItem('SessionUserName', responseName.data);
          const resDesgnName = await axios.get<string>(`${baseUrl}/UserDesignation/${loginId}`);
          const resDesgnID = await axios.get<string>(`${baseUrl}/RoleDesignID/${resDesgnName.data}`);
          sessionStorage.setItem('SessionDesigID', resDesgnID.data);
          navigate('/Home');
        } else {
          setLoginError(<span className="error-message">Login failed. Please check your credentials.</span>);
        }
      } else if (response.status === 401) {
        const errorResult = await response.json();
        setLoginError(<span className="error-message">{errorResult.message || 'Invalid credentials. Please try again.'}</span>);
      } else {
        setLoginError(<span className="warning-message">Login failed. Please check your credentials.</span>);
      }
    } catch (error) {
      setLoginError(<span className="error-message">Login failed. Please check your credentials.</span>);
    }
    finally {
    setPassword(""); // clear sensitive data
  }
  };

  useEffect(() => {
    setLoginId('');
    setPassword('');
  }, []);

  useEffect(() => {
    if (SessionUserID) {
    }
  }, [SessionUserID]);

  return (
    <div className="AppWrapper">
      {/* Application Title Outside LoginContainer */}
      <h1 className="AppTitle">SEEMS</h1>
      <h2 className="SubTitle">Sienna ECAD Enterprise Management System</h2>
      <div className="LoginContainer">
        <div className="LoginBox">
          {/* Left Side - Login Form */}
          <div className="LoginForm">
            <div className="InputField">
              <label htmlFor="loginId">Login ID:</label>
              <input
                type="text"
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter your SEEMS ID"
              />
            </div>
            <div className="InputField">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                placeholder="Enter your password"
              />
            </div>
            {/* 🔹 Strength Meter
            {password && (
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
            )} */}


            {loginError && <p className="error-message">{loginError}</p>}

            <button className="LoginButton" onClick={handleLogin}>Login</button>

            <div className="LinkContainer">
              <Link to="/ResetPassword"
                state={{ loginId }}
                onClick={(e) => {
                  if (!loginId.trim()) {
                    e.preventDefault(); //block navigation
                    setLoginError(<span className="error-message">Please enter your Login ID to reset password.</span>);
                  }
                }}
              >Reset Password</Link>
              <Link to="/ForgotPassword"
                state={{ loginId }}
                onClick={(e) => {
                  if (!loginId.trim()) {
                    e.preventDefault(); //block navigation
                    setLoginError(<span className="error-message">Please enter your Login ID to reset password.</span>);
                  }
                }}>Forgot Password</Link>
            </div>
          </div>

          {/* Right Side - Logo Panel */}
          <div className="LogoPanel">
            <img src={logo1} alt="Sienna ECAD Logo" className="LogoImage" />
            <br />
            <img src={logo2} alt="secondlogo" className="LogoImage" style={{ width: "200px", height: "60px" }} />
          </div>
        </div>
      </div>
    </div>
  );

}
export default LoginPage;