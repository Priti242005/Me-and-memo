import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedLayout() {
  const { token, loading } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  return <Outlet />;
}
