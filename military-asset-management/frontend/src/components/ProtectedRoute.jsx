import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { token, user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-[var(--accent-red)] mb-4">403 Forbidden</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            You do not have the required clearance level to access this section.
          </p>
          <a href="/" className="btn-primary">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
