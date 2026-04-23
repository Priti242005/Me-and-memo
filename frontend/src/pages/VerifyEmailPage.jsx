import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import './auth.css';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const { setTokenDirect } = useAuth();
  const query = useQuery();
  const presetEmail = query.get('email') || '';
  const presetMessage = query.get('message') || '';
  const presetOtp = query.get('otp') || '';

  const [email, setEmail] = useState(presetEmail);
  const [otp, setOtp] = useState(presetOtp);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) return setError('Email is required.');
    if (!otp.trim()) return setError('OTP is required.');

    try {
      setSubmitting(true);
      const data = await verifyEmail({ email: email.trim(), otp: otp.trim() });
      if (data?.token) {
        await setTokenDirect(data.token);
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Verification failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleVerify} className="auth-card auth-form">
        <h1 className="auth-title">Verify your email</h1>
        <p className="auth-subtitle">
          Enter the 6-digit OTP we sent to your email. It expires in 5 minutes.
        </p>
        {presetMessage ? <p className="auth-message success">{presetMessage}</p> : null}
        {presetOtp ? (
          <p className="auth-message success">
            Demo OTP: <strong>{presetOtp}</strong>
          </p>
        ) : null}

        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
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
          />
        </label>

        {error ? <p className="auth-message error">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="auth-button primary"
        >
          {submitting ? 'Verifying...' : 'Verify'}
        </button>

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
