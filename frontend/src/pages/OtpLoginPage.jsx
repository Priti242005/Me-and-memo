import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendLoginOtp, verifyLoginOtp } from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import './auth.css';

export default function OtpLoginPage() {
  const navigate = useNavigate();
  const { setTokenDirect } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSend(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required.');
    try {
      setLoading(true);
      await sendLoginOtp(email.trim());
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Email is required.');
    if (!otp.trim()) return setError('OTP is required.');
    try {
      setLoading(true);
      const data = await verifyLoginOtp({ email: email.trim(), otp: otp.trim() });
      if (data?.token) {
        await setTokenDirect(data.token);
      }
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={step === 1 ? handleSend : handleVerify} className="auth-card auth-form">
        <h1 className="auth-title">Login with OTP</h1>
        <p className="auth-subtitle">
          {step === 1
            ? 'Enter your email to receive a login OTP.'
            : 'Enter the OTP sent to your email. It expires in 5 minutes.'}
        </p>

        <label className="auth-field">
          <span className="auth-label">Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading || step === 2}
          />
        </label>

        {step === 2 ? (
          <label className="auth-field">
            <span className="auth-label">OTP</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="auth-input"
              placeholder="123456"
              inputMode="numeric"
              disabled={loading}
            />
          </label>
        ) : null}

        {error ? <p className="auth-message error">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="auth-button primary"
        >
          {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Verify & Login'}
        </button>

        {step === 2 ? (
          <button
            type="button"
            disabled={loading}
            className="auth-button secondary"
            onClick={() => {
              setStep(1);
              setOtp('');
            }}
          >
            Use a different email
          </button>
        ) : null}

        <button
          type="button"
          className="auth-button secondary"
          onClick={() => navigate('/login')}
        >
          Back to password login
        </button>
      </form>
    </div>
  );
}
