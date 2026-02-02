import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { baseUrl } from "../../const/BaseUrl";
import '../../components/resusablecontrols/styles/Print.css';
import logo from '../../const/Images/Sienna-Ecad-logo.jpg';

interface QuoteHeader {
  quoteNo: string;
  versionNo: number;
  boardRef: string;
  enquiryNo: string;
  customerName: string;
  customerAddress: string;
  customerContactPerson: string;
  rfxNo: string;
  createdByName: string;
  createdByEmail: string;
}

interface QuoteItem {
  slNo: number;
  layout: string;
  quantity: number;
  unitRate: number;
  lineTotal: number;
}

interface QuoteReportResponse {
  header: QuoteHeader;
  items: QuoteItem[];
  subTotal: number;
  grandTotal: number;
  termsAndConditions: string;
  name: string;
}

// type Props = {
//   quoteNo: string;
//   versionNo: number;
//   enquiryNo: string;
// };

const ViewQuoteReport: React.FC = () => {
  const { quoteNo, versionNo, enquiryNo } = useParams<{ quoteNo: string; versionNo: string; enquiryNo: string; }>();
  const [data, setData] = useState<QuoteReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quoteNo || !versionNo || !enquiryNo) return;
    const versionNoNum = Number(versionNo);
    if (Number.isNaN(versionNoNum)) return;

    setLoading(true);

    axios
      .get<QuoteReportResponse>(
        `${baseUrl}/api/Sales/ViewQuotationReport/${quoteNo}/${versionNoNum}/${enquiryNo}`
      )
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
      })
      .then(() => setLoading(false));
  }, [quoteNo, versionNo, enquiryNo]);

  if (loading) return <p>Loading quotation...</p>;
  if (!data) return <p>No quotation data found.</p>;

  const { header, items, grandTotal, termsAndConditions } = data;

  return (
    <div className="quote-wrapper">
      <div className="quote-report">

        {/* PRINT BUTTON */}
        <div className="no-print print-btn">
          <button onClick={() => window.print()}>🖨 Print</button>
        </div>

        {/* HEADER */}
        <div className="header">
          <div className="logo">
            <img src={logo} alt="Company Logo" />
          </div>

          <div className="company-info">
            <p><b>SIENNA ECAD Technologies Private Ltd.</b></p>
            <p>#683, 1st Floor, 15th Cross</p>
            <p>J.P. Nagar 2nd Phase,</p>
            <p>Bengaluru – 560 078,</p>
            <p>India</p>
            <p>Tel : 080 68190700</p>
            <p>Email : sales@siennaecad.com</p>
            <p><b>GST NO :</b> 29AAACE4885A1ZP</p>
          </div>
        </div>

        <h2 className="title">QUOTATION</h2>

        {/* CUSTOMER + DOC INFO */}
        <div className="info-section">
          <div className="to-section">
            <p><b>To:</b></p>
            <p><b>{header.customerName}</b></p>
            <p style={{ wordBreak: "break-word" }}>{header.customerAddress}</p>
            <p><i>Attn: {header.customerContactPerson}</i></p>
            <p>{header.rfxNo}</p>
          </div>

          <div className="doc-section">
            <p><b>Form No:</b> R/PP – 02/03/02</p>
            <p><b>Ref No:</b> QTE251111_25-26</p>
            <p><b>Date:</b>   {new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}</p>
          </div>
        </div>

        {/* TABLE */}
        <table className="items-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} style={{ textAlign: "left" }}>Board Reference: {header.boardRef}</td>
            </tr>
            {items.map(i => (
              <tr key={i.slNo}>
                <td>{i.slNo}</td>
                <td>{i.layout}</td>
                <td>{i.quantity} Number</td>
                <td>{i.unitRate.toLocaleString()}</td>
                <td>{i.lineTotal.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} style={{ textAlign: "right", fontWeight: "bold" }}>Total</td>
              <td style={{ textAlign: "center", fontWeight: "bold" }}>{grandTotal.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <h4>Terms & Conditions</h4>
        <p style={{ whiteSpace: "pre-line" }}>{termsAndConditions}</p>
        <br />
        <p><b>FOR SIENNA ECAD TECHNOLOGIES PVT LTD</b></p>
        <br />
        <div className="quote-footer">
          <p><b>{header.createdByName}</b></p>
          <p>{header.createdByEmail}</p>
        </div>
      </div>
    </div>
  );
};

export default ViewQuoteReport;