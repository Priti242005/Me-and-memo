import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getGoogleAuthUrl } from '../services/authService';

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
    <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold mb-2">Login</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Sign in to MeAndMemo to share posts and reels.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Email or Username</span>
            <input
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="you@example.com or username"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {localError || authError ? (
            <div className="text-sm text-red-600 dark:text-red-300">
              {localError || authError?.message || String(authError)}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = "https://me-and-memo.onrender.com/auth/google";
            }}
            className="w-full py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
          >
            Continue with Google
          </button>

          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <button
              type="button"
              className="text-pink-600 dark:text-pink-300 font-medium hover:underline"
              onClick={() => navigate('/login-otp')}
            >
              Login with OTP
            </button>
            <button
              type="button"
              className="text-pink-600 dark:text-pink-300 font-medium hover:underline"
              onClick={() => navigate('/forgot-password')}
            >
              Forgot Password?
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Don&apos;t have an account?{' '}
          <span
            className="text-pink-600 dark:text-pink-300 cursor-pointer font-medium hover:underline"
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

