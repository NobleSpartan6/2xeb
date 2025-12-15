import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, session } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-12 h-12 bg-[#0A0A0A] border border-[#262626] grid place-items-center mx-auto">
              <span className="text-[#2563EB] font-bold text-lg font-space-grotesk">EB</span>
            </div>
          </div>
          <p className="text-sm text-[#737373] font-mono">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but not admin - redirect with error
  if (!isAdmin) {
    return <Navigate to="/admin/login" state={{ error: 'unauthorized' }} replace />;
  }

  // Authorized - render children
  return <>{children}</>;
};

export default ProtectedRoute;
