import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(''); // URL (optional)
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) return setLocalError('Name is required.');
    if (!username.trim()) return setLocalError('Username is required.');
    if (!email.trim()) return setLocalError('Email is required.');
    if (!password) return setLocalError('Password is required.');

    try {
      setSubmitting(true);
      const res = await signup({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        bio: bio.trim(),
        profilePic: profilePic.trim(),
      });
      navigate(`/verify-email?email=${encodeURIComponent(res.email || email.trim())}`);
    } catch (err) {
      setLocalError(err?.response?.data?.message || 'Signup failed.');
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
        <h1 className="text-2xl font-bold mb-2">Create account</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Join MeAndMemo — share moments and memories.
        </p>

        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="yourname"
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="you@example.com"
              autoComplete="email"
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
              autoComplete="new-password"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              Profile Picture URL (optional)
            </span>
            <input
              value={profilePic}
              onChange={(e) => setProfilePic(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="https://..."
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Bio (optional)</span>
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900/30 outline-none"
              placeholder="Tell people about yourself..."
              maxLength={160}
            />
          </label>

          {localError ? (
            <div className="text-sm text-red-600 dark:text-red-300">
              {localError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-500 disabled:opacity-60 transition"
          >
            {submitting ? 'Creating...' : 'Create account & send OTP'}
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <span
            className="text-pink-600 dark:text-pink-300 cursor-pointer font-medium hover:underline"
            onClick={() => navigate('/login')}
            role="button"
            tabIndex={0}
          >
            Login
          </span>
        </div>
      </form>
    </div>
  );
}

