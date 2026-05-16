import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../store/AuthContext';
import { AlertCircle, ArrowRight, Sparkles, UserCircle2 } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';

export const Login = () => {
  const navigate = useNavigate();
  const { user, loading, error, isConfigured } = useAuth();
  const hasSession = Boolean(user);

  useEffect(() => {
    if (hasSession) {
      navigate('/');
    }
  }, [hasSession, navigate]);

  if (hasSession) {
    return <Navigate to="/" replace />;
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(0,74,198,0.12),_transparent_40%),linear-gradient(180deg,_#f8f9ff_0%,_#eef3ff_100%)] dark:bg-[#0d1117] p-4">
        <div className="bg-white/95 dark:bg-[#161b22] rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.14)] max-w-md w-full border border-[#dfe7ff] dark:border-[#30363d]">
          <div className="flex items-center gap-3 mb-6 text-[#ba1a1a] dark:text-[#ffb4ab]">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-[18px] font-[600]">Clerk Not Configured</h2>
          </div>
          <p className="text-[14px] text-[#434655] dark:text-[#8b949e] mb-4">
            Set <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> before starting the app.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(0,74,198,0.12),_transparent_40%),linear-gradient(180deg,_#f8f9ff_0%,_#eef3ff_100%)] dark:bg-[#0d1117] p-4">
      <div className="bg-white/95 dark:bg-[#161b22] rounded-[28px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.14)] max-w-3xl w-full border border-[#dfe7ff] dark:border-[#30363d] overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#004ac6] via-[#7fb2ff] to-[#b7cffd]" />
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e5eeff] dark:bg-[#004ac6]/20 text-[#004ac6] dark:text-[#a5c0ff] text-[12px] font-[700] tracking-[0.16em] uppercase">
              <Sparkles className="w-4 h-4" />
              Clerk Auth
            </div>
            <div>
              <h1 className="text-[38px] md:text-[52px] leading-[0.95] font-[800] tracking-[-0.04em] text-[#0b1c30] dark:text-white">
                HabTracker
              </h1>
              <p className="text-[15px] md:text-[16px] text-[#434655] dark:text-[#8b949e] mt-4 max-w-lg">
                Sign in with Clerk, keep Supabase as the database, and continue tracking habits without the email rate-limit loop.
              </p>
            </div>

            <Show when="signed-in" fallback={null}>
              <div className="flex items-center gap-3 rounded-2xl border border-[#dfe7ff] dark:border-[#30363d] bg-[#f8f9ff] dark:bg-[#21262d] p-4">
                <div className="h-11 w-11 rounded-full bg-white dark:bg-[#161b22] border border-[#dfe7ff] dark:border-[#30363d] flex items-center justify-center text-[#004ac6] dark:text-[#a5c0ff]">
                  <UserCircle2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-[600] text-[#0b1c30] dark:text-white truncate">
                    {user?.displayName || user?.email || 'Signed in'}
                  </div>
                  <div className="text-[12px] text-[#737686] dark:text-[#8b949e]">
                    You can jump straight into the dashboard.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 rounded-full bg-[#004ac6] px-4 py-2 text-[13px] font-[600] text-white hover:bg-[#003ea8] transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Show>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[#004ac6]/10 via-transparent to-[#c8dbff]/40 blur-2xl" />
            <div className="relative rounded-[24px] border border-[#dfe7ff] dark:border-[#30363d] bg-[#fdfdff] dark:bg-[#0f141a] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.08)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-[700] uppercase tracking-[0.16em] text-[#737686] dark:text-[#8b949e]">Start here</p>
                  <h2 className="text-[22px] font-[700] tracking-[-0.03em] text-[#0b1c30] dark:text-white">Choose your entry point</h2>
                </div>
                <UserButton />
              </div>

              <Show when="signed-out" fallback={null}>
                <div className="space-y-3">
                  {error && (
                    <div className="rounded-xl border border-[#ffb4ab] bg-[#ffdad6] p-3 text-[#ba1a1a] text-[13px]">
                      {error}
                    </div>
                  )}

                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-xl bg-[#004ac6] px-4 py-3 text-[14px] font-[700] text-white hover:bg-[#003ea8] transition-colors"
                    >
                      Sign in
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="w-full rounded-xl border border-[#c8dbff] bg-white px-4 py-3 text-[14px] font-[700] text-[#0b1c30] hover:bg-[#f8f9ff] transition-colors dark:bg-[#161b22] dark:text-white dark:border-[#30363d] dark:hover:bg-[#21262d]"
                    >
                      Create account
                    </button>
                  </SignUpButton>
                </div>
              </Show>

              <Show when="signed-in" fallback={null}>
                <div className="rounded-xl border border-[#c8dbff] bg-[#eff4ff] p-4 text-[14px] text-[#0b1c30] dark:bg-[#004ac6]/10 dark:text-white">
                  Your Clerk session is active.
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
