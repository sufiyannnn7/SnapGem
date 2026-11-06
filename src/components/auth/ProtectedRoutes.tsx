import React, { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, user, profile } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Evaluation:', {
    'Current Route': location.pathname,
    'Current User ID': user?.id || 'none',
    'Fetched Role': profile?.role || 'none',
    isLoading,
    isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Redirect Target:', '/admin/login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isAdmin, isAuthenticated, isLoading, user, profile } = useAuth();
  const location = useLocation();

  const currentRoute = location.pathname;
  const currentUserId = user?.id || 'none';
  const fetchedRole = profile?.role || 'none';

  console.log('Current Route:', currentRoute);
  console.log('Current User ID:', currentUserId);
  console.log('Fetched Role:', fetchedRole);
  console.log('isAdmin:', isAdmin);

  // CRITICAL REQUIREMENT: Do NOT redirect until authentication AND profile loading finishes!
  if (isLoading || (isAuthenticated && !profile)) {
    console.log('[AdminRoute] Auth/Profile loading in progress... waiting before evaluating access.');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('Redirect Target:', '/admin/login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    console.log('Redirect Target:', '/admin/access-denied');
    return <Navigate to="/admin/access-denied" replace />;
  }

  console.log('Redirect Target: NONE (Access Granted to /admin/dashboard)');
  return <>{children}</>;
};
