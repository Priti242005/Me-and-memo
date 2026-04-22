import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../pages/auth.css';

export default function ProtectedLayout() {
  const { token, loading } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title" style={{ marginBottom: 12 }}>Loading</h1>
          <p className="auth-subtitle">
            Preparing your account, stories, and feed...
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
