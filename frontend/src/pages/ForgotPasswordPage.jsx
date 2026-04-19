import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/authService';

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
    <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold mb-2">Forgot password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Enter your email and we’ll send you an OTP to reset your password.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading || sent}
            />
          </label>

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          ) : null}
          {sent ? (
            <div className="text-sm text-green-700 dark:text-green-300">
              OTP sent. Continue to reset password.
            </div>
          ) : null}

          {!sent ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
            >
              {loading ? 'Sending...' : 'Send reset OTP'}
            </button>
          ) : (
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 transition"
              onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
            >
              Reset password
            </button>
          )}

          <button
            type="button"
            className="w-full py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
            onClick={() => navigate('/login')}
          >
            Back to login
          </button>
        </div>
      </form>
    </div>
  );
}

