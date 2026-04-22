import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import './auth.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const presetEmail = query.get('email') || '';

  const [email, setEmail] = useState(presetEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required.');
    if (!otp.trim()) return setError('OTP is required.');
    if (!newPassword) return setError('New password is required.');

    try {
      setLoading(true);
      await resetPassword({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card auth-form">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter the OTP from your email and choose a new password.
        </p>

        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || done}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">OTP</span>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="auth-input"
            placeholder="123456"
            inputMode="numeric"
            disabled={loading || done}
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">New password</span>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            className="auth-input"
            placeholder="........"
            autoComplete="new-password"
            disabled={loading || done}
          />
        </label>

        {error ? <p className="auth-message error">{error}</p> : null}
        {done ? (
          <p className="auth-message success">
            Password updated. You can now log in.
          </p>
        ) : null}

        {!done ? (
          <button
            type="submit"
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        ) : (
          <button
            type="button"
            className="auth-button primary"
            onClick={() => navigate('/login')}
          >
            Go to login
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
