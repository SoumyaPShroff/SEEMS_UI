import React, { useEffect } from 'react';
import Sidebar from "./components/Sidebar";
import { Routes, Route } from "react-router-dom";
import Support from "./Pages/Support";
import SeemsHomeSubMenu from './Pages/SeemsHomeSubMenu';
import ManagerDashboardSubMenu from './Pages/ManagerDashboardSubMenu';
import Blank from './Pages/Blank';
import RptBillingPlanner from './Pages/RptBillingPlanner';
 
const Home = () => {
    const sessionUserID = sessionStorage.getItem('SessionUserID');

    useEffect(() => {
        if (!sessionUserID) {
            window.location.href = '/Login';
        }
    }, [sessionUserID]);

    if (!sessionUserID) return null; // Prevent rendering if not logged in

    return (
        <>
            <Sidebar sessionUserID={sessionUserID} />
            <Routes>
                <Route path="/" element={<Blank />} />
                <Route path="/SeemsHomeSubMenu" element={<SeemsHomeSubMenu />} />
                <Route path="/RptBillingPlanner" element={<RptBillingPlanner/>} />
                <Route path="/ManagerDashboardSubMenu" element={<ManagerDashboardSubMenu />} />
                <Route path="/support" element={<Support />} />
                <Route path="*" element={<Blank />} />
            </Routes>
        </>
    );
}

export default Home;