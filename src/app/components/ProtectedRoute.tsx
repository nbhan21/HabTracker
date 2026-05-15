import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../store/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#0d1117]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#004ac6] dark:text-[#a5c0ff]" />
          <p className="text-[14px] text-[#737686] dark:text-[#8b949e]">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase not configured, allow access to continue with localStorage only
  if (!isConfigured) {
    return <Outlet />;
  }

  // If Supabase is configured but user not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render protected content
  return <Outlet />;
};
