import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

// Wraps all pages that need a logged-in user
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-message">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
