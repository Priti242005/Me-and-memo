import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGoogleAuthUrl } from '../services/authService';
import './auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, authError, setAuthError } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    setAuthError(null);

    const trimmed = emailOrUsername.trim();
    if (!trimmed) {
      setLocalError('Email or username is required.');
      return;
    }
    if (!password) {
      setLocalError('Password is required.');
      return;
    }

    try {
      setSubmitting(true);
      const isEmail = trimmed.includes('@');
      const payload = isEmail
        ? { email: trimmed, password }
        : { username: trimmed, password };

      await login(payload);
      navigate('/');
    } catch (err) {
      setLocalError(err?.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card auth-form">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">
          Sign in to MeAndMemo to share posts and reels.
        </p>

        <label className="auth-field">
          <span className="auth-label">Email or Username</span>
          <input
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="auth-input"
            placeholder="you@example.com or username"
            autoComplete="username"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="auth-input"
            placeholder="........"
            autoComplete="current-password"
          />
        </label>

        {localError || authError ? (
          <p className="auth-message error">
            {localError || authError?.message || String(authError)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="auth-button primary"
        >
          {submitting ? 'Signing in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => {
            window.location.href = getGoogleAuthUrl();
          }}
          className="auth-button secondary"
        >
          Continue with Google
        </button>

        <div className="auth-row">
          <button
            type="button"
            className="auth-link"
            onClick={() => navigate('/login-otp')}
          >
            Login with OTP
          </button>
          <button
            type="button"
            className="auth-link"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot Password?
          </button>
        </div>

        <div className="auth-footer">
          Don&apos;t have an account?
          <span
            className="auth-link"
            onClick={() => navigate('/signup')}
            role="button"
            tabIndex={0}
          >
            Sign up
          </span>
        </div>
      </form>
    </div>
  );
}
