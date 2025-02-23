import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './ForgotPassword.css';
import loginBg from '../../assets/loginbg.jpg';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions');
    } catch (error) {
      setError('Failed to reset password. Please check your email address.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container" style={{ '--login-bg': `url(${loginBg})` }}>
      <div className="top-bar">
        <h2>Reset Password</h2>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email Address"
          required
          autoComplete="email"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Reset Password'}
        </button>
        <div className="auth-link-container">
          <Link to="/login" className="back-to-login">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword; 