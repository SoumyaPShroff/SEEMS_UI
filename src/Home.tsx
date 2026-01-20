import { useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Support from "./models/Support";
import RptBillingPlanner from './models/General/Reports/billingplanner/RptBillingPlanner';
import SalesDashboard from './models/Sales/SalesDashboard';
import ViewAllEnquiries from './models/Sales/ViewAllEnquiries';
import AddEnquiry from  './models/Sales/AddEnquiry';
import OffshoreEnquiry from './models/Sales/OffshoreEnquiry';
import ViewEnquiryReport from './models/Sales/ViewEnquiryReport';
import ViewPOEnqData from './models/Sales/ViewPOEnqData';
import OnsiteEnquiry from './models/Sales/OnsiteEnquiry';
import AddQuotation from './models/Sales/AddQuotation';
import RptQuoteDetails from './models/Sales/RptQuoteDetails';

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
                <Route path="/RptBillingPlanner" element={<RptBillingPlanner />} />
                <Route path="/SalesDashboard" element={<SalesDashboard />} />
                <Route path="/ViewAllEnquiries" element={<ViewAllEnquiries />} />
                <Route path="/AddEnquiry" element={<AddEnquiry />} />
                <Route path="/OffshoreEnquiry/:enquiryNo" element={<OffshoreEnquiry />} />
                <Route path="/OnsiteEnquiry/:enquiryNo" element={<OnsiteEnquiry />} />
                <Route path="/ViewEnquiryReport" element={<ViewEnquiryReport />} />
                <Route path="/ViewPOEnqData" element={<ViewPOEnqData />} />
                <Route path="/AddQuotation/:enquiryNo/:quoteNo?" element={<AddQuotation />} /> 
                <Route path="/RptQuoteDetails" element={<RptQuoteDetails />} />
                <Route path="/support" element={<Support />} />
            </Routes>
        </>
    );
}

export default Home;
