import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function OAuthSuccessPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get('token') || '';

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-[calc(100svh-56px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900/30 border border-gray-200/70 dark:border-gray-800 rounded-2xl p-6 text-center">
        <div className="text-lg font-semibold">Signing you in...</div>
        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Please wait.
        </div>
      </div>
    </div>
  );
}

