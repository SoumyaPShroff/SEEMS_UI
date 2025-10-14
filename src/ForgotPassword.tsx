    import React, { useState } from 'react';

    function ForgotPassword() {
      const [email, setEmail] = useState('');
      const [message, setMessage] = useState('');
      const [error, setError] = useState('');

      const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
          // Send email to backend for password reset initiation
          const response = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          const data = await response.json();

          if (response.ok) {
            setMessage(data.message); // e.g., "Password reset link sent to your email."
          } else {
            setError(data.error || 'Something went wrong.');
          }
        } catch (err) {
          setError('Network error. Please try again.');
        }
      };

      return (
        <div>
          <h2>Forgot Password</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit">Reset Password</button>
          </form>
          {message && <p style={{ color: 'green' }}>{message}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      );
    }

    export default ForgotPassword;