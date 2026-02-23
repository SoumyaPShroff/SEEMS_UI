import React, { useEffect, useState } from "react";
import enquiryService from "../services/enquiryService";
import { useSearchParams, useNavigate } from "react-router-dom";

const EnquiryStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const enquiryNo = searchParams.get("enquiryno");

  const [statusOptions, setStatusOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [reason, setReason] = useState("");
  const [tentativeDate, setTentativeDate] = useState("");
  const [enquiryType, setEnquiryType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnquiry();
  }, []);

  const loadEnquiry = async () => {
    const res = await enquiryService.getEnquiryStatus(enquiryNo);
    setStatusOptions(res.allowedStatuses);
    setEnquiryType(res.enquiryType);
    setLoading(false);
  };

  const handleSubmit = async () => {
    await enquiryService.updateStatus({
      enquiryNo,
      status,
      billingDate,
      remarks,
      reason,
      tentativeDate
    });

    navigate("/view-enquiries");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h3 className="text-center">Status of the Enquiry</h3>

      <div className="card p-4 mt-4">
        <div className="mb-3">
          <label>Status</label>
          <select
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select</option>
            {statusOptions.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {enquiryType === "ONSITE" && status === "Realised" && (
          <div className="mb-3">
            <label>Billing Date</label>
            <input
              type="date"
              className="form-control"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
            />
          </div>
        )}

        {["Rejected By Customer", "Rejected By US", "Cancelled", "Hold", "Confirmed"].includes(status) && (
          <div className="mb-3">
            <label>Reason</label>
            <textarea
              className="form-control"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        )}

        {status === "Realised" && (
          <div className="mb-3">
            <label>Remarks</label>
            <textarea
              className="form-control"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        )}

        {status === "Confirmed" && (
          <div className="mb-3">
            <label>Tentative Start Date</label>
            <input
              type="date"
              className="form-control"
              value={tentativeDate}
              onChange={(e) => setTentativeDate(e.target.value)}
            />
          </div>
        )}

        <button className="btn btn-primary mt-3" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default EnquiryStatus;