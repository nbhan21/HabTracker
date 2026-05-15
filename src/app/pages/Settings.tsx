import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, Check, AlertCircle } from 'lucide-react';

export const Settings = () => {
  const { user, isConfigured } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load display name from auth user metadata (primary source)
  useEffect(() => {
    if (!user) return;

    // Display name from auth metadata
    const currentDisplayName = (user as any)?.displayName || '';
    setDisplayName(currentDisplayName);
    setMessage(null);
  }, [user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isConfigured) return;

    setSaving(true);
    setMessage(null);

    try {
      const trimmedName = displayName.trim();

      // Step 1: Update display name in auth user metadata
      const { error: authError } = await supabase?.auth.updateUser({
        data: { display_name: trimmedName },
      }) || {};

      if (authError) {
        throw new Error(`Auth update failed: ${authError.message}`);
      }

      // Step 2: Sync to database users table
      // This is non-critical - if it fails, auth is still updated
      const { error: dbError } = await supabase
        ?.from('users')
        .update({ 
          display_name: trimmedName, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id) || {};

      // Log db error but don't fail - auth metadata is primary source
      if (dbError) {
        console.warn('Database sync warning (non-critical):', dbError);
      }

      setMessage({ 
        type: 'success', 
        text: 'Profile updated successfully!' 
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save profile';
      setMessage({ type: 'error', text: errorMsg });
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white mb-2">Settings</h1>
          <p className="text-[14px] text-[#737686] dark:text-[#8b949e]">
            Supabase not configured. Settings are only available when logged in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[32px] font-[700] tracking-[-0.02em] text-[#0b1c30] dark:text-white mb-2">Settings</h1>
        <p className="text-[14px] text-[#737686] dark:text-[#8b949e]">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-[#161b22] rounded-[16px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-6">
        <div>
          <h2 className="text-[18px] font-[600] text-[#0b1c30] dark:text-white mb-4">Profile</h2>

          {/* Status Messages */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-[#e6f4ff] dark:bg-[#0d3b66] border border-[#91caff] dark:border-[#177ddc]'
                  : 'bg-[#fff1f0] dark:bg-[#58181c] border border-[#ffccc7] dark:border-[#ff7875]'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-5 h-5 text-[#0b7a0b] dark:text-[#95de64]" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#a4001c] dark:text-[#ff7875]" />
              )}
              <p
                className={`text-[14px] ${
                  message.type === 'success'
                    ? 'text-[#0b7a0b] dark:text-[#95de64]'
                    : 'text-[#a4001c] dark:text-[#ff7875]'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* User Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-2 uppercase">
                Email
              </label>
              <div className="px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] text-[#737686] dark:text-[#8b949e]">
                {user?.email || 'N/A'}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[12px] font-[600] tracking-wider text-[#434655] dark:text-[#8b949e] mb-2 uppercase">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name (shown in greeting)"
                disabled={loading || saving}
                className="w-full px-3 py-2 bg-[#f8f9ff] dark:bg-[#21262d] border border-[#c3c6d7] dark:border-[#30363d] rounded-lg text-[14px] dark:text-white focus:outline-none focus:border-[#004ac6] dark:focus:border-[#a5c0ff] focus:ring-1 focus:ring-[#004ac6] dark:focus:ring-[#a5c0ff] disabled:opacity-50"
              />
              <p className="text-[12px] text-[#737686] dark:text-[#8b949e] mt-1">
                Used for personalized greeting on dashboard
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || saving}
                className="flex items-center gap-2 bg-[#004ac6] text-white px-4 py-2 rounded-lg text-[14px] font-[500] hover:bg-[#003ea8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
