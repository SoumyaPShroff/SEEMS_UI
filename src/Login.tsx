import React, { useState, useEffect } from 'react';
import Home from './Home';
import { baseUrl } from './const/BaseUrl';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import logo1 from './const/Images/Sienna-Ecad-logo.jpg'
import logo2 from './const/Images/Sienna-Ecad-logo2.jpg'
import './Login.css';

interface ILogin {
  userId: string | null; // Add userId to the interface
  setUserId: (id: string | null) => void;
}

interface LoginPageProps {
  userId: string | null; // Define the type for the userId prop
  setUserId: (id: string | null) => void; // Define the type for the setUserId prop
}

const LoginPage: React.FC<ILogin> = ({ setUserId }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [encodedPassword, setEncodedPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [SessionUserID, setSessionUserID] = useState(sessionStorage.getItem('SessionUserID'));
  const navigate = useNavigate();

  //allow mouse key event and keyboard(enter)
  const handleLogin = async (e?: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLInputElement>) => {
    e?.preventDefault();
    setLoginError('');

    try {
       const response = await fetch(`${baseUrl}/verifyloginuser?ploginid=${username}&ppassword=${password}`);
      if (response.ok) {
        const result = await response.json();
        if (result != null) {
          setUserId(result.loginId);
          sessionStorage.setItem('SessionUserID', result.loginId);
          setSessionUserID(result.loginId);
          navigate('/Home');
        } else {
          setLoginError('Login failed. Please check your credentials.');
        }
      } else if (response.status === 401) {
        const errorResult = await response.json();
        setLoginError(errorResult.message || 'Invalid credentials. Please try again.');
      } else {
        setLoginError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setLoginError('Login failed. Please check your credentials.');
    }
  };

  useEffect(() => {
    setUsername('');
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
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        <div className="InputField">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your password"
          />
        </div>

        {loginError && <p className="error-message">{loginError}</p>}

        <button className="LoginButton" onClick={handleLogin}>Login</button>

        <div className="LinkContainer">
          <a href="#">Reset Password</a>
          <a href="#">Forgot Password</a>
        </div>
      </div>

      {/* Right Side - Logo Panel */}
      <div className="LogoPanel">
        <img src={logo1} alt="Sienna ECAD Logo" className="LogoImage"  />
        <br />
        <img src={logo2} alt="secondlogo" className="LogoImage" style={{ width: "200px", height: "60px" }} />
      </div>
    </div>
  </div>
  </div>
);

}
export default LoginPage;
