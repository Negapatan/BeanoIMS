import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Signup.css';
import loginBg from '../../assets/loginbg.jpg';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      const normalizedEmail = formData.email?.toLowerCase();
      
      await signup(normalizedEmail, formData.password);
      setSuccess(true);
      setLoading(false); // Disable loading state to show success message
      
      // Wait for 2 seconds to show the success message
      setTimeout(() => {
        navigate('/login', { replace: true }); // Simple redirect without state
      }, 2000);

    } catch (error) {
      setError(error.message || 'Failed to create account');
      console.error('Signup error:', error);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim() // Trim whitespace from inputs
    }));
    setError(''); // Clear error when user types
  };

  return (
    <div className="login-container" style={{ '--login-bg': `url(${loginBg})` }}>
      <div className="top-bar">
        <h2>Create Your Account</h2>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">
          Account created successfully! Redirecting to login...
        </div>}
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
          minLength={6}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
        <div className="auth-link-container">
          <span>Already have an account? </span>
          <Link to="/login" className="login-link">Login here</Link>
        </div>
      </form>
    </div>
  );
};

export default Signup; 