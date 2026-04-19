import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendLoginOtp, verifyLoginOtp } from '../services/authService';

export default function OtpLoginPage() {
  const navigate = useNavigate();
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
      if (data?.token) localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4">
      <form
        onSubmit={step === 1 ? handleSend : handleVerify}
        className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6"
      >
        <h1 className="text-2xl font-bold mb-2">Login with OTP</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {step === 1
            ? 'Enter your email to receive a login OTP.'
            : 'Enter the OTP sent to your email. It expires in 5 minutes.'}
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
              disabled={loading || step === 2}
            />
          </label>

          {step === 2 ? (
            <label className="block">
              <span className="text-sm font-medium">OTP</span>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
                placeholder="123456"
                inputMode="numeric"
                disabled={loading}
              />
            </label>
          ) : null}

          {error ? (
            <div className="text-sm text-red-600 dark:text-red-300">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
          >
            {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Verify & Login'}
          </button>

          {step === 2 ? (
            <button
              type="button"
              disabled={loading}
              className="w-full py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
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
            className="w-full py-2.5 rounded-xl border border-gray-200/80 dark:border-gray-800 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800/40 transition"
            onClick={() => navigate('/login')}
          >
            Back to password login
          </button>
        </div>
      </form>
    </div>
  );
}

