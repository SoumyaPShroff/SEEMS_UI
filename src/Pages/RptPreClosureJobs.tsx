import React, { useEffect, useState } from "react";
import axios from "axios";
import { baseUrl } from "../const/BaseUrl";
import * as XLSX from "xlsx";
import './ReportData.css';

interface PreClosureData {
  Jobnumber: number;
  JobName: string;
  Customer: string;
  Costcenter: string;
  ProjectManager: string;
  StartDate: string;
  EndDate: string;
  EnquiryNo: string;
  Billability: string;
  ProjectMode: string;
  BillingType: string;
  Status: string;
  NonBillableHrs: string;
}

const RptPreClosureJobs: React.FC = () => {
  const [data, setData] = useState<PreClosureData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}/getPreclosureJobs`);
        setData(response.data);
      } catch (err: any) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "An error occurred while fetching data");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data); // Convert data to a worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PreClosureJobs");
    XLSX.writeFile(workbook, "PreClosureJobs.xlsx"); // Export as a file
  };

  return (
    <div className="rpt-container">
      <div className="button-container">
        <button className="export-button" onClick={exportToExcel}>
          Export to Excel
        </button>
      </div>
      <div className="count">
        Total Preclosure Jobs: {data.length}
      </div>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Jobnumber</th>
            <th>JobName</th>
            <th>Customer</th>
            <th>Costcenter</th>
            <th>ProjectManager</th>
            <th>StartDate</th>
            <th>EndDate</th>
            <th>EnquiryNo</th>
            <th>Billability</th>
            <th>ProjectMode</th>
            <th>BillingType</th>
            <th>Status</th>
            <th>NonBillableHrs</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.Jobnumber}>
              <td>{item.Jobnumber}</td>
              <td>{item.JobName}</td>
              <td>{item.Customer}</td>
              <td>{item.Costcenter}</td>
              <td>{item.ProjectManager}</td>
              <td>{item.StartDate}</td>
              <td>{item.EndDate}</td>
              <td>{item.EnquiryNo}</td>
              <td>{item.Billability}</td>
              <td>{item.ProjectMode}</td>
              <td>{item.BillingType}</td>
              <td>{item.Status}</td>
              <td>{item.NonBillableHrs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RptPreClosureJobs;