import { useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Support from "./Pages/Support";
import SeemsHomeSubMenu from './Pages/SeemsHomeSubMenu';
import RptBillingPlanner from './Pages/GeneralReports/RptBillingPlanner';
import SalesDashboard from './Pages/SalesDesign/SalesDashboard';
import ViewAllEnquiries from './Pages/SalesDesign/ViewAllEnquiries';
import AddEnquiry from  './Pages/SalesDesign/AddEnquiry';
import OffshoreEnquiry from './Pages/SalesDesign/OffshoreEnquiry';
import ViewEnquiryReport from './Pages/SalesDesign/ViewEnquiryReport';
import ViewPOEnqData from './Pages/SalesDesign/ViewPOEnqData';
import OnsiteEnquiry from './Pages/SalesDesign/OnsiteEnquiry';
import AddQuotation from './Pages/SalesDesign/AddQuotation';

interface HomeProps {
    userId: string | null;  //new
    setUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const Home: React.FC<HomeProps> = ({ userId, setUserId }) => {
const sessionUserID = userId; // updated to use prop

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
            <Sidebar sessionUserID={sessionUserID}
                setUserId={setUserId}
            />
            <Routes>
                <Route path="/SeemsHomeSubMenu" element={<SeemsHomeSubMenu />} />
                <Route path="/RptBillingPlanner" element={<RptBillingPlanner />} />
                <Route path="/SalesDashboard" element={<SalesDashboard />} />
                <Route path="/ViewAllEnquiries" element={<ViewAllEnquiries />} />
                <Route path="/AddEnquiry" element={<AddEnquiry />} />
                <Route path="/OffshoreEnquiry/:enquiryNo" element={<OffshoreEnquiry />} />
                <Route path="/OnsiteEnquiry/:enquiryNo" element={<OnsiteEnquiry />} />
                <Route path="/ViewEnquiryReport" element={<ViewEnquiryReport />} />
                <Route path="/ViewPOEnqData" element={<ViewPOEnqData />} />
                <Route path="/AddQuotation/:enquiryNo" element={<AddQuotation />} />
                <Route path="/support" element={<Support />} />
            </Routes>
        </>
    );
}

export default Home;
