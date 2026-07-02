import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { loggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) navigate('/login');
  }, [loggedIn]);

  if (!loggedIn) return null;

  return children;
}

export default ProtectedRoute;