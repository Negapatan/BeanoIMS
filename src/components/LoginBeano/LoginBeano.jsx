import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './LoginBeano.css';
import loginBg from '../../assets/loginbg.jpg';

const LoginBeano = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(usernameOrEmail, password);
      // Force navigation after successful login
      navigate('/dashboard/inventory', { replace: true });
    } catch (error) {
      setError(error.message || 'Failed to sign in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ '--login-bg': `url(${loginBg})` }}>
      <div className="top-bar">
        <h2>Welcome to Beano Management System</h2>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        <input
          type="text"
          placeholder="Username or Email"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value.trim())}
          disabled={loading}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="auth-link-container">
          <span>Don't have an account? </span>
          <Link to="/signup" className="signup-link">Create one here</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginBeano; 