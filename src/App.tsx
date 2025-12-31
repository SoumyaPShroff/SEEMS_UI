import React, { useState, useEffect } from 'react';
import LoginPage from './Login';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResetPassword from './ResetPassword';
import ForgotPassword from './ForgotPassword';
import Blank from './Pages/Blank';
import Support from "./Pages/Support";
import SeemsHomeSubMenu from './Pages/SeemsHomeSubMenu';
import RptBillingPlanner from './Pages/SalesReports/RptBillingPlanner';
import SalesDashboard from './Pages/SalesReports/SalesDashboard';
import ViewAllEnquiries from './Pages/SalesReports/ViewAllEnquiries';
import AddEnquiry from './Pages/AddEnquiry';
import OffshoreEnquiry from './Pages/OffshoreEnquiry';
import ViewEnquiryReport from './Pages/SalesReports/ViewEnquiryReport';
import ViewPOEnqData from './Pages/SalesReports/ViewPOEnqData';
import OnsiteEnquiry from './Pages/OnsiteEnquiry';
import AddQuotation from './Pages/AddQuotation';

const App: React.FC = () => {
  const [userId, setUserId] = useState(sessionStorage.getItem('SessionUserID'));

  useEffect(() => {
    const id = sessionStorage.getItem("SessionUserID");
    setUserId(id);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Redirect root to /login if userId is not set, otherwise to /home */}
        <Route path="/" element={<Navigate to={userId ? "/Home" : "/Login"} replace />} />

        {/* Login Route */}
        <Route path="/Login" element={<LoginPage userId={userId} setUserId={setUserId} />} />

        {/* Home Route */}
        {/* <Route path="/Home/*" element={userId ? <Home /> : <Navigate to="/Login" replace />} /> */}
        {/* Home Layout */}
        <Route
          path="/Home"
          element={userId ? <Home setUserId={setUserId} /> : <Navigate to="/Login" replace />}
        >
          {/* <Route index element={<Home />} /> */}
          <Route path="RptBillingPlanner" element={<RptBillingPlanner />} />
          <Route path="SeemsHomeSubMenu" element={<SeemsHomeSubMenu />} />
          <Route path="SalesDashboard" element={<SalesDashboard />} />
          <Route path="ViewAllEnquiries" element={<ViewAllEnquiries />} />
          <Route path="AddEnquiry" element={<AddEnquiry />} />
          <Route path="support" element={<Support />} />


          {/* Absolute routes */}
          <Route path="OffshoreEnquiry/:enquiryNo" element={<OffshoreEnquiry />} />
          <Route path="OnsiteEnquiry/:enquiryNo" element={<OnsiteEnquiry />} />
          <Route path="ViewEnquiryReport" element={<ViewEnquiryReport />} />
          <Route path="ViewPOEnqData" element={<ViewPOEnqData />} />
          <Route path="AddQuotation/:enquiryNo" element={<AddQuotation />} />
        </Route>
        {/* Password + Blank */}
        <Route path="/ResetPassword" element={<ResetPassword />} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/blank" element={<Blank />} />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </Router>

  );
};
export default App;