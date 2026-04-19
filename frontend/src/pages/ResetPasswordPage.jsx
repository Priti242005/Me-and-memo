import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';

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
    <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold mb-2">Reset password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Enter the OTP from your email and choose a new password.
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
              disabled={loading || done}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">OTP</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="123456"
              inputMode="numeric"
              disabled={loading || done}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">New password</span>
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading || done}
            />
          </label>

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          ) : null}
          {done ? (
            <div className="text-sm text-green-700 dark:text-green-300">
              Password updated. You can now log in.
            </div>
          ) : null}

          {!done ? (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          ) : (
            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 transition"
              onClick={() => navigate('/login')}
            >
              Go to login
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

