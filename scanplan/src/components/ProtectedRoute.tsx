import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/backendApi';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />;
}
