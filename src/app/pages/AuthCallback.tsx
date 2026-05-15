import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../store/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      // User authenticated successfully, redirect to dashboard
      navigate('/?from_auth=true');
    } else if (!loading && !user) {
      // Auth failed or session not established, redirect to login
      navigate('/login');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#0d1117]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#004ac6] dark:text-[#a5c0ff]" />
        <p className="text-[14px] text-[#737686] dark:text-[#8b949e]">
          Completing sign in...
        </p>
      </div>
    </div>
  );
};
