import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const { setTokenDirect } = useAuth();
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

    try {
      setTokenDirect(token);
      navigate('/', { replace: true });
    } catch {
      setError('We could not finish signing you in. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [navigate, setTokenDirect]);

  return (
    <div style={{ color: 'white', padding: '20px' }}>
      {error || 'Logging you in...'}
    </div>
  );
}
