import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './auth.css';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { setTokenDirect, refreshUser } = useAuth();
  const [error, setError] = useState('');
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    let cancelled = false;

    async function finishLogin() {
      try {
        setTokenDirect(token);
        await refreshUser(token);
        if (!cancelled) {
          navigate('/', { replace: true });
        }
      } catch {
        if (!cancelled) {
          setError('We could not finish signing you in. Please try again.');
          navigate('/login', { replace: true });
        }
      }
    }

    finishLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser, setTokenDirect]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title" style={{ marginBottom: 12 }}>Almost There</h1>
        <p className="auth-subtitle">
          {error || 'Logging you in and restoring your feed...'}
        </p>
      </div>
    </div>
  );
}
