    // This would be a separate component, e.g., ResetPassword.jsx
    import React, { useState, useEffect } from 'react';
    import { useParams, useNavigate } from 'react-router-dom';

    function ResetPassword() {
      const { token } = useParams(); // Get token from URL params
      const navigate = useNavigate();
      const [newPassword, setNewPassword] = useState('');
      const [confirmPassword, setConfirmPassword] = useState('');
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');

      const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        try {
          const response = await fetch('/api/reset-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage(data.message);
            // Optionally redirect to login after successful reset
            navigate('/login');
          } else {
            setError(data.error || 'Password reset failed.');
          }
        } catch (err) {
          setError('Network error. Please try again.');
        }
      };

      return (
        <div>
          <h2>Reset Password</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Set New Password</button>
          </form>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      );
    }

    export default ResetPassword;