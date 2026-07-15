/**
 * TEST COMPONENT - Use this to verify JobCreationForm loads
 *
 * Import this instead of JobCreationForm to test:
 * import TestJobCreationComponent from './TEST_COMPONENT';
 */

import React from 'react';

const TestJobCreationComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>✅ Test Component Loaded Successfully!</h2>
      <p>If you see this message, the component CAN load.</p>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Next Steps:</h3>
        <ol>
          <li>Check browser console for CSS errors</li>
          <li>If no CSS errors, replace this with JobCreationForm</li>
          <li>If CSS errors, check path: <code>./styles/JobCreationForm.css</code></li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd' }}>
        <h3>Test API Connectivity:</h3>
        <TestAPIConnection />
      </div>
    </div>
  );
};

const TestAPIConnection: React.FC = () => {
  const [apiStatus, setApiStatus] = React.useState<string>('Testing...');
  const apiUrl = process.env.REACT_APP_API_URL || 'NOT SET';

  React.useEffect(() => {
    const testAPI = async () => {
      try {
        const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const response = await fetch(`${url}/api/enquiries/realised`);

        if (response.ok) {
          const data = await response.json();
          setApiStatus(`✅ API Connected! Got ${data.length} enquiries`);
        } else {
          setApiStatus(`❌ API returned status ${response.status}`);
        }
      } catch (error) {
        setApiStatus(`❌ Cannot connect to API: ${String(error)}`);
      }
    };

    testAPI();
  }, []);

  return (
    <div>
      <p><strong>API URL:</strong> {apiUrl}</p>
      <p><strong>Status:</strong> {apiStatus}</p>
    </div>
  );
};

export default TestJobCreationComponent;
