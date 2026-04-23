import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';
import './auth.css';

export default function SignupPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
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
      const params = new URLSearchParams({
        email: res.email || email.trim(),
      });
      if (res?.message) params.set('message', res.message);
      if (res?.otp) params.set('otp', res.otp);
      navigate(`/verify-email?${params.toString()}`);
    } catch (err) {
      setLocalError(err?.response?.data?.message || 'Signup failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card auth-form">
        <h1 className="auth-title">Sign up</h1>
        <p className="auth-subtitle">
          Join MeAndMemo and continue with the original polished experience.
        </p>

        <label className="auth-field">
          <span className="auth-label">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
            placeholder="Your name"
            autoComplete="name"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="auth-input"
            placeholder="yourname"
            autoComplete="username"
          />
        </label>

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
          <span className="auth-label">Password</span>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="auth-input"
            placeholder="........"
            autoComplete="new-password"
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Profile Picture URL (optional)</span>
          <input
            value={profilePic}
            onChange={(e) => setProfilePic(e.target.value)}
            className="auth-input"
            placeholder="https://..."
          />
        </label>

        <label className="auth-field">
          <span className="auth-label">Bio (optional)</span>
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="auth-input"
            placeholder="Tell people about yourself..."
            maxLength={160}
          />
        </label>

        {localError ? <p className="auth-message error">{localError}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="auth-button primary"
        >
          {submitting ? 'Creating...' : 'Create account & send OTP'}
        </button>

        <div className="auth-footer">
          Already have an account?
          <span
            className="auth-link"
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
