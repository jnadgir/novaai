import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { loggedIn, authLoading } = useAuth();

  if (authLoading) return null;

  if (!loggedIn) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;