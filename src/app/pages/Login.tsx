import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../store/AuthContext';
import { Mail, AlertCircle, Loader2 } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading, error, signInWithMagicLink, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if returning from magic link callback
    const returnedFromAuth = searchParams.get('from_auth');
    if (returnedFromAuth) {
      setSubmitted(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter your email');
      return;
    }

    try {
      await signInWithMagicLink(email);
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send magic link');
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#0d1117] p-4">
        <div className="bg-white dark:bg-[#161b22] rounded-[16px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] max-w-md w-full">
          <div className="flex items-center gap-3 mb-6 text-[#ba1a1a] dark:text-[#ffb4ab]">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-[18px] font-[600]">Supabase Not Configured</h2>
          </div>
          <p className="text-[14px] text-[#434655] dark:text-[#8b949e] mb-4">
            The app needs Supabase environment variables to work. Check `.env` file and restart the dev server.
          </p>
          <details className="text-[12px] text-[#737686] dark:text-[#8b949e]">
            <summary className="cursor-pointer font-[600] mb-2">Setup steps</summary>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Create Supabase project</li>
              <li>Copy Project URL and anon key</li>
              <li>Add to `.env` file</li>
              <li>Restart dev server</li>
            </ol>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff] dark:bg-[#0d1117] p-4">
      <div className="bg-white dark:bg-[#161b22] rounded-[16px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] max-w-md w-full space-y-6">
        <div>
          <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white">
            HabTracker
          </h1>
          <p className="text-[14px] text-[#737686] dark:text-[#8b949e] mt-1">
            Sign in to your habits & productivity tracker
          </p>
        </div>

        {submitted && !user && (
          <div className="bg-[#eff4ff] dark:bg-[#004ac6]/10 border border-[#e5eeff] dark:border-[#30363d] rounded-lg p-4">
            <p className="text-[14px] text-[#0b1c30] dark:text-white">
              ✓ Magic link sent to <strong>{email}</strong>
            </p>
            <p className="text-[12px] text-[#737686] dark:text-[#8b949e] mt-2">
              Check your email inbox for the login link. It expires in 24 hours.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-[12px] text-[#004ac6] dark:text-[#a5c0ff] hover:underline mt-3"
            >
              Try another email
            </button>
          </div>
        )}

        {!submitted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="bg-[#ffdad6] dark:bg-[#93000a] border border-[#ffb4ab] dark:border-[#ffb4ab] rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#ba1a1a] dark:text-[#ffb4ab] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#ba1a1a] dark:text-[#ffb4ab]">
                  {error || localError}
                </p>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-1.5 uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#004ac6] text-white px-4 py-2.5 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#c3c6d7]/30 dark:border-[#30363d]">
          <p className="text-[12px] text-[#737686] dark:text-[#8b949e] text-center">
            No password needed. We'll send you a secure link to your email.
          </p>
        </div>
      </div>
    </div>
  );
};
