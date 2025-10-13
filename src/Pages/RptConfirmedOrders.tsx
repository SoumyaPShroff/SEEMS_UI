import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { baseUrl } from "../const/BaseUrl";
import './ReportData.css';

const RptConfirmedOrders = () => {
  const [domOffData, setDomOffData] = useState([]);
  const [domOnData, setDomOnData] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGridData();
  }, []);

  const fetchGridData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [domOffResponse, domOnResponse, exportResponse] = await Promise.all([
        axios.get(`${baseUrl}/getConfirmedOrdersDomOffshore`),
        axios.get(`${baseUrl}/getConfirmedOrdersDomOnsite`),
        axios.get(`${baseUrl}/getConfirmedOrdersExport`),
      ]);

      setDomOffData(domOffResponse.data);
      setDomOnData(domOnResponse.data);
      setExportData(exportResponse.data);

      const total = calculateGrandTotal(domOffResponse.data, domOnResponse.data, exportResponse.data);
      setGrandTotal(total);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrandTotal = (domOff, domOn, exportData) => {
    return [...domOff, ...domOn, ...exportData].reduce((total, item) => total + (item.amount || 0), 0);
  };

  const handleExport = (data, fileName) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  return (
    <div className="rpt-container">
      <h2 style={{ textAlign: "left" }}>Confirmed Orders</h2>
      <h3 className="count">Grand Total: ₹{grandTotal.toLocaleString('en-IN')}</h3>

      {error && <div className="error-message">{error}</div>}
      {isLoading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          <Section title="Domestic Offshore" data={domOffData} onExport={() => handleExport(domOffData, 'DomesticOffshore')} />
          <Section title="Domestic Onsite" data={domOnData} onExport={() => handleExport(domOnData, 'DomesticOnsite')} />
          <Section title="Export" data={exportData} onExport={() => handleExport(exportData, 'ExportData')} />
        </>
      )}
    </div>
  );
};

const Section = ({ title, data, onExport }) => (
  <div className="section">
    <h3>{title}</h3>
    <table className="styled-table">
      <thead>
        <tr>
          <th>Enquiry No</th>
          <th>Quantity</th>
          <th>Currency</th>
          <th>Unit Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => (
          <tr key={index}>
            <td>{item.Enquiryno}</td>
            <td>{item.Quantity}</td>
            <td>{item.Currency || 'N/A'}</td>
            <td>{item.UnitRate}</td>
            <td>{item.Amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <button className="export-button" onClick={onExport}>Export Data</button>
  </div>
);

export default RptConfirmedOrders;