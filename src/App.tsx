import React, { useState } from 'react';
import LoginPage from './Login';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  const [userId, setUserId] = useState(sessionStorage.getItem('SessionUserID'));

  return (
    <Router>
      <Routes>
        {/* Redirect root to /login if userId is not set, otherwise to /home */}
        {/* is configured to handle all sub-routes correctly.  use of /* if you navigate to /Home/dashboard or /Home/settings etc matches any nested components under it*/}
        <Route path="/" element={<Navigate to={userId ? "/Home/*" : "/Login"} replace />} />

        {/* Login Route */}
        <Route path="/Login" element={<LoginPage userId={userId} setUserId={setUserId} />} />

        {/* Home Route */}
        <Route path="/Home/*" element={userId ? <Home /> : <Navigate to="/Login" replace />} />
        
      </Routes>
            {/* <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} /> */}
    </Router>
  );
};
export default App;