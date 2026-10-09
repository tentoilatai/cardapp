import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-surface-strong p-8 rounded-[24px] flex flex-col items-center gap-4 max-w-sm w-full">
          <div className="w-12 h-12 rounded-full border-3 border-[#E27AA1] border-t-transparent animate-spin" />
          <p className="text-sm font-semibold text-[#826B76]">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
