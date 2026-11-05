import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { LoadingState } from '../components/ui/States';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="mx-auto max-w-2xl p-8"><LoadingState rows={4} /></div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="mx-auto max-w-2xl p-8"><LoadingState rows={3} /></div>;
  return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
}
