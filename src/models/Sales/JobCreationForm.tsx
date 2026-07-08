import React, { useState, useEffect } from 'react';
import "./styles/JobCreationForm.css";
import axios from "axios";
import { baseUrl } from "../../const/BaseUrl";
import SelectControl from "../../components/resusablecontrols/SelectControl";
import TextControl from "../../components/resusablecontrols/TextControl";
import Button from "../../components/resusablecontrols/Button";

type BillingType = 'Fixed' | 'TimeAndMaterial';

interface EnquiryOption {
  id: string;
  label: string;
}

interface POOption {
  id: string;
  number: string;
}

interface FormState {
  billingType: BillingType;
  enquiry: string;
  poNumber: string;
  boardRef: string;
  billingDate: string;
  jobNumber: string;
}

interface PODetails {
  totalAmount: number;
  totalHours: number;
  balanceHours: number;
}

const JobCreationForm: React.FC = () => {
  const [formState, setFormState] = useState<FormState>({
    billingType: 'Fixed',
    enquiry: '',
    poNumber: '',
    boardRef: '',
    billingDate: '',
    jobNumber: '',
  });

  const [enquiries, setEnquiries] = useState<EnquiryOption[]>([]);
  const [poNumbers, setPoNumbers] = useState<POOption[]>([]);
  const [poDetails, setPoDetails] = useState<PODetails>({
    totalAmount: 0,
    totalHours: 0,
    balanceHours: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch enquiries on component mount
  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Fetch PO numbers when enquiry changes
  useEffect(() => {
    if (formState.enquiry) {
      fetchPONumbers();
      setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });
      setFormState(prev => ({
        ...prev,
        poNumber: '',
        jobNumber: '',
        billingDate: '',
        boardRef: '',
      }));
    }
  }, [formState.enquiry]);

  // Fetch PO details when PO number changes
  useEffect(() => {
    if (formState.poNumber) {
      fetchPODetails();
      generateJobNumber();
    }
  }, [formState.poNumber]);

  const fetchEnquiries = async () => {
    try {
      setError(null);
      const response = await axios.get(`${baseUrl}/api/Sales/RealisedEnquiries`);
      console.log('Fetched enquiries:', response.data);
      setEnquiries(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching enquiries');
    }
  };

  const fetchPONumbers = async () => {
    try {
      setError(null);
      const response = await axios.get(`${baseUrl}/api/Sales/PONumbersByEnquiry/${formState.enquiry}`);
      setPoNumbers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching PO numbers');
    }
  };

  const fetchPODetails = async () => {
    try {
      setError(null);
      const response = await axios.get(`${baseUrl}/api/Sales/PODetailsAsync/${formState.poNumber}`);
      setPoDetails(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching PO details');
    }
  };

  const generateJobNumber = async () => {
    try {
      const response = await axios.post(`${baseUrl}/api/Sales/GenerateJobNumber`, {
        enquiry: formState.enquiry,
        billingType: formState.billingType,
      });
      setFormState(prev => ({
        ...prev,
        jobNumber: response.data.jobNumber,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating job number');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBillingTypeChange = (type: BillingType) => {
    setFormState(prev => ({
      ...prev,
      billingType: type,
      boardRef: '',
      billingDate: '',
    }));
    setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });
  };

  const validateForm = (): boolean => {
    if (!formState.enquiry) {
      setError('Please select an enquiry');
      return false;
    }
    if (!formState.poNumber) {
      setError('Please select a PO number');
      return false;
    }
    if (formState.billingType === 'TimeAndMaterial' && !formState.billingDate) {
      setError('Please select a billing date');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(`${baseUrl}/api/Sales/CreateJob`, {
        billingType: formState.billingType,
        enquiry: formState.enquiry,
        poNumber: formState.poNumber,
        boardRef: formState.boardRef,
        billingDate: formState.billingDate,
        jobNumber: formState.jobNumber,
        poAmount: poDetails.totalAmount,
        poHours: poDetails.totalHours,
      });

      setSuccess(`Job created successfully! Job Number: ${response.data.jobNumber}`);

      // Reset form
      setFormState({
        billingType: 'Fixed',
        enquiry: '',
        poNumber: '',
        boardRef: '',
        billingDate: '',
        jobNumber: '',
      });
      setPoDetails({ totalAmount: 0, totalHours: 0, balanceHours: 0 });

      // Optionally redirect after success
      setTimeout(() => {
        window.location.href = `/jobs/${response.data.jobNumber}`;
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating job');
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormState({
      billingType: 'Fixed',
      enquiry: '',
      poNumber: '',
      boardRef: '',
      billingDate: '',
      jobNumber: '',
    });
    setError(null);
    setSuccess(null);
  };

  // Convert EnquiryOption to SelectControl format
  const enquiryOptions = enquiries.map(enq => ({
    value: enq.id,
    label: enq.label,
  }));

  // Convert POOption to SelectControl format
  const poOptions = poNumbers.map(po => ({
    value: po.id,
    label: po.number,
  }));

  return (
    <div className="job-creation-container">
      <div className="job-creation-wrapper">
        {/* Header */}
        <div className="job-creation-header">
          <h1>Create New Project Job</h1>
          <p>Select billing type and provide project details</p>
        </div>

        {/* Billing Type Selector */}
        <div className="billing-type-selector">
          <button
            className={`billing-type-btn ${formState.billingType === 'Fixed' ? 'active' : ''}`}
            onClick={() => handleBillingTypeChange('Fixed')}
            disabled={loading}
          >
            <span className="btn-icon">💼</span>
            <div className="btn-content">
              <h3>Fixed-Cost</h3>
              <p>Fixed pricing model</p>
            </div>
          </button>
          <button
            className={`billing-type-btn ${formState.billingType === 'TimeAndMaterial' ? 'active' : ''}`}
            onClick={() => handleBillingTypeChange('TimeAndMaterial')}
            disabled={loading}
          >
            <span className="btn-icon">⏱️</span>
            <div className="btn-content">
              <h3>Time & Material</h3>
              <p>Hourly billing model</p>
            </div>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="job-creation-form">
          {/* Alert Messages */}
          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">{error}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <span className="alert-icon">✓</span>
              <span className="alert-message">{success}</span>
              <button
                type="button"
                className="alert-close"
                onClick={() => setSuccess(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Form Grid */}
          <div className="form-grid">
            {/* Enquiry Number */}
            <div className="form-group">
              <SelectControl
                name="enquiry"
                label="Enquiry Number"
                value={formState.enquiry}
                options={enquiryOptions}
                onChange={handleInputChange}
                required
                fullWidth
                disabled={loading}
              />
            </div>

            {/* PO Number */}
            <div className="form-group">
              <SelectControl
                name="poNumber"
                label="PO Number"
                value={formState.poNumber}
                options={poOptions}
                onChange={handleInputChange}
                required
                fullWidth
                disabled={!formState.enquiry || loading}
              />
            </div>

            {/* Job Number (Read-only) */}
            <div className="form-group">
              <TextControl
                name="jobNumber"
                value={formState.jobNumber}
                disabled
                placeholder="Auto-generated"
                fullWidth
              />
            </div>

            {/* Billing Date (Time & Material Only) */}
            {formState.billingType === 'TimeAndMaterial' && (
              <div className="form-group">
                <TextControl
                  name="billingDate"
                  type="date"
                  value={formState.billingDate}
                  onChange={handleInputChange}
                  disabled={loading}
                  fullWidth
                />
              </div>
            )}

            {/* Board Ref (Fixed Cost Only) */}
            {formState.billingType === 'Fixed' && (
              <div className="form-group">
                <TextControl
                  name="boardRef"
                  value={formState.boardRef}
                  onChange={handleInputChange}
                  placeholder="Board Reference (Optional)"
                  disabled={loading}
                  fullWidth
                />
              </div>
            )}
          </div>

          {/* PO Details Summary */}
          {formState.poNumber && (
            <div className="po-details-card">
              <h3>Purchase Order Summary</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Total PO Amount:</span>
                  <span className="detail-value">
                    {poDetails.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total PO Hours:</span>
                  <span className="detail-value">
                    {poDetails.totalHours.toFixed(2)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Balance Hours:</span>
                  <span className="detail-value highlight">
                    {poDetails.balanceHours.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="form-actions">
            <Button
              label="Clear Form"
              onClick={handleClearForm}
              variant="outlined"
              disabled={loading}
            />
            <Button
              label={loading ? 'Creating Job...' : 'Create Job'}
              onClick={handleSubmit}
              type="submit"
              disabled={loading || !formState.enquiry || !formState.poNumber}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCreationForm;
