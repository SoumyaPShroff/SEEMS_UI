import { useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Support from "./Pages/Support";
import SeemsHomeSubMenu from './Pages/SeemsHomeSubMenu';
import RptBillingPlanner from './Pages/SalesReports/RptBillingPlanner';
import SalesDashboard from './Pages/SalesReports/SalesDashboard';
 import ViewAllEnquiries from './Pages/SalesReports/ViewAllEnquiries';
 import AddEnquiry from './Pages/AddEnquiry';
 import OffshoreEnquiry from './Pages/OffshoreEnquiry';
 import ViewEnquiryReport from './Pages/SalesReports/ViewEnquiryReport';

const Home = () => {
    const sessionUserID = sessionStorage.getItem('SessionUserID');

    useEffect(() => {
        if (!sessionUserID) {
            window.location.href = '/Login';
        }
    }, [sessionUserID]);

    // if (!sessionUserID) return null; // Prevent rendering if not logged in
    if (!sessionUserID) {
        console.log("No session found — redirecting to login...");
        return null;
    }

    return (
        <>
            <Sidebar sessionUserID={sessionUserID} />
            <Routes>
                <Route path="/SeemsHomeSubMenu" element={<SeemsHomeSubMenu />} />
                <Route path="/RptBillingPlanner" element={<RptBillingPlanner />} />
                <Route path="/SalesDashboard" element={<SalesDashboard />} />
                <Route path="/ViewAllEnquiries" element={<ViewAllEnquiries />} />
                <Route path="/AddEnquiry" element={<AddEnquiry />} />
                <Route path="/OffshoreEnquiry/:enquiryNo" element={<OffshoreEnquiry />} />
                <Route path="/ViewEnquiryReport" element={<ViewEnquiryReport />} />
                <Route path="/support" element={<Support />} />
            </Routes>
        </>
    );
}

export default Home;