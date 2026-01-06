import { useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Support from "./models/Support";
import SeemsHomeSubMenu from './models/SeemsHomeSubMenu';
import RptBillingPlanner from './models/GeneralReports/billingplanner/RptBillingPlanner';
import SalesDashboard from './models/SalesDesign/SalesDashboard';
import ViewAllEnquiries from './models/SalesDesign/ViewAllEnquiries';
import AddEnquiry from  './models/SalesDesign/AddEnquiry';
import OffshoreEnquiry from './models/SalesDesign/OffshoreEnquiry';
import ViewEnquiryReport from './models/SalesDesign/ViewEnquiryReport';
import ViewPOEnqData from './models/SalesDesign/ViewPOEnqData';
import OnsiteEnquiry from './models/SalesDesign/OnsiteEnquiry';
import AddQuotation from './models/SalesDesign/AddQuotation';

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
