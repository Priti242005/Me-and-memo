import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { setTokenDirect } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function completeOAuthLogin() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        await setTokenDirect(token);

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

    completeOAuthLogin();

    return () => {
      cancelled = true;
    };
  }, [navigate, setTokenDirect]);

  return (
    <div style={{ color: 'white', padding: '20px' }}>
      {error || 'Logging you in...'}
    </div>
  );
}
