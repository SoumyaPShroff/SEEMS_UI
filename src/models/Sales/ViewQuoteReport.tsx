// import React, { useEffect, useState } from "react";
// import axios from "axios";

// interface QuoteHeader {
//   quoteNo: string;
//   customer: string;
//   address: string;
//   contactName: string;
//   date: string;
//   closingDate?: string;
//   currency: string;
//   currencySymbol: string;
// }

// interface QuoteItem {
//   serialNo: number;
//   boardRef?: string;
//   description: string;
//   quantity: number;
//   unitRate: number;
//   total: number;
//   taxLabel: string;
//   taxAmount: number;
//   amountInclTax: number;
// }

// interface SalesInfo {
//   name: string;
//   designation: string;
//   email: string;
//   phone: string;
// }

// interface QuoteReportResponse {
//   header: QuoteHeader;
//   items: QuoteItem[];
//   terms: string;
//   sales: SalesInfo;
// }
 
// type Props = {
//   quoteNo: number;
// };

//const ViewQuoteReport: React.FC<Props> = ({ quoteNo }) => {

const ViewQuoteReport: React.FC = () => {
  return null;
  // const [data, setData] = useState<QuoteReportResponse | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   axios
  //     .get<QuoteReportResponse>(`/api/quotes/${quoteNo}`)
  //     .then(res => setData(res.data))
  //     .finally(() => setLoading(false));
  // }, [quoteNo]);

  // const downloadPdf = () => {
  //   window.open(`/api/quotes/${quoteNo}/pdf`, "_blank");
  // };

  // if (loading) return <p>Loading quotation...</p>;
  // if (!data) return <p>No data found</p>;

  // const { header, items, terms, sales } = data;

  // return (
  //   <div className="quote-report">
  //     {/* ACTION BUTTONS */}
  //     <div className="no-print" style={{ textAlign: "right" }}>
  //       <button onClick={() => window.print()}>Print</button>
  //       <button onClick={downloadPdf} style={{ marginLeft: 10 }}>
  //         Download PDF
  //       </button>
  //     </div>

  //     {/* HEADER */}
  //     <div className="quote-header">
  //       <h2 style={{ textAlign: "center" }}>QUOTATION</h2>

  //       <div className="row">
  //         <div className="col-left">
  //           <b>To:</b>
  //           <p>{header.customer}</p>
  //           <p>{header.address}</p>
  //           <p><b>Attn:</b> {header.contactName}</p>
  //         </div>

  //         <div className="col-right">
  //           <p><b>Quote No:</b> {header.quoteNo}</p>
  //           <p><b>Date:</b> {header.date}</p>
  //           {header.closingDate && (
  //             <p><b>Closing Date:</b> {header.closingDate}</p>
  //           )}
  //         </div>
  //       </div>
  //     </div>

  //     {/* ITEMS TABLE */}
  //     <table className="quote-table">
  //       <thead>
  //         <tr>
  //           <th>S.No</th>
  //           <th>Description</th>
  //           <th>Qty</th>
  //           <th>Unit Rate ({header.currencySymbol})</th>
  //           <th>Total</th>
  //           <th>Tax</th>
  //           <th>Amount Incl. Tax</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {items.map((item, index) => (
  //           <tr key={index}>
  //             <td>{item.serialNo}</td>
  //             <td>
  //               {item.boardRef && <b>{item.boardRef}<br /></b>}
  //               {item.description}
  //             </td>
  //             <td>{item.quantity}</td>
  //             <td>{item.unitRate.toFixed(2)}</td>
  //             <td>{item.total.toFixed(2)}</td>
  //             <td>{item.taxLabel}</td>
  //             <td>{item.amountInclTax.toFixed(2)}</td>
  //           </tr>
  //         ))}
  //       </tbody>
  //     </table>

  //     {/* TERMS */}
  //     <div className="section">
  //       <h4>Terms & Conditions</h4>
  //       <div
  //         dangerouslySetInnerHTML={{ __html: terms }}
  //       />
  //     </div>

  //     {/* SIGNATURE */}
  //     <div className="section">
  //       <p><b>For TECHNOLOGIES PVT LTD</b></p>
  //       <p><b>{sales.name}</b></p>
  //       <p>{sales.designation}</p>
  //       <p>Email: {sales.email}</p>
  //       <p>Phone: {sales.phone}</p>
  //     </div>
  //   </div>
  // );
};
export default ViewQuoteReport;

