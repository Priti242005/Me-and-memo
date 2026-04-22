import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import './auth.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required.');

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send reset OTP.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card auth-form">
        <h1 className="auth-title">Forgot password</h1>
        <p className="auth-subtitle">
          Enter your email and we&apos;ll send you an OTP to reset your password.
        </p>

        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || sent}
          />
        </label>

        {error ? <p className="auth-message error">{error}</p> : null}
        {sent ? (
          <p className="auth-message success">
            OTP sent. Continue to reset password.
          </p>
        ) : null}

        {!sent ? (
          <button
            type="submit"
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Sending...' : 'Send reset OTP'}
          </button>
        ) : (
          <button
            type="button"
            className="auth-button primary"
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
          >
            Reset password
          </button>
        )}

        <button
          type="button"
          className="auth-button secondary"
          onClick={() => navigate('/login')}
        >
          Back to login
        </button>
      </form>
    </div>
  );
}
