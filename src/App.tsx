import React, { useState, useEffect } from 'react';
import LoginPage from './Login';
import Home from './Home';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ResetPassword from './ResetPassword';
import ForgotPassword from './ForgotPassword';
import Blank from './models/Blank';
import Support from "./models/Support";
import RptBillingPlanner from './models/General/Reports/billingplanner/RptBillingPlanner';
import SalesDashboard from './models/Sales/SalesDashboard';
import ViewAllEnquiries from './models/Sales/ViewAllEnquiries';
import AddEnquiry from "./models/Sales/AddEnquiry";
import OffshoreEnquiry from './models/Sales/OffshoreEnquiry';
import ViewEnquiryReport from './models/Sales/ViewEnquiryReport';
import ViewPOEnqData from './models/Sales/ViewPOEnqData';
import OnsiteEnquiry from './models/Sales/OnsiteEnquiry';
import AddQuotation from './models/Sales/AddQuotation';
import ViewQuoteDetails from './models/Sales/ViewQuoteDetails';
import Feasibility from './models/Sales/Feasibility';
import ViewQuoteReport from "./models/Sales/ViewQuoteReport";

const App: React.FC = () => {
  const [userId, setUserId] = useState(sessionStorage.getItem('SessionUserID'));
  useEffect(() => {
    const syncUser = () => {
      setUserId(sessionStorage.getItem("SessionUserID"));
    };

    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, []);


  return (
    <Router>
      <Routes>
        {/* Redirect root to /login if userId is not set, otherwise to /home */}
        <Route path="/" element={<Navigate to={userId ? "/Home" : "/Login"} replace />} />

        {/* Login Route */}
        <Route path="/Login" element={<LoginPage userId={userId} setUserId={setUserId} />} />

        {/* Home Layout */}
        <Route
          path="/Home"
          // element={userId ? <Home setUserId={setUserId} /> : <Navigate to="/Login" replace />}
           element={userId ? <Home userId={userId} setUserId={setUserId} /> : <Navigate to="/Login" replace />} // passing serverUserID as prop

        >
          {/* <Route index element={<Home />} /> */}
          <Route path="RptBillingPlanner" element={<RptBillingPlanner />} />
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
          <Route path="ViewQuoteDetails" element={<ViewQuoteDetails />} /> 
          <Route path="ViewQuoteReport/:quoteNo/:versionNo/:enquiryNo" element={<ViewQuoteReport />} />
          <Route path="Feasibility/:enquiryno" element={<Feasibility />} />
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



