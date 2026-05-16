import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/react';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  getToken: () => Promise<string | null>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isLoaded, signOut: clerkSignOut, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

  const user = useMemo<AuthUser | null>(() => {
    if (!clerkUser) return null;

    const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress || '';
    const metadataDisplayName = (clerkUser.unsafeMetadata as Record<string, unknown> | undefined)?.displayName;
    const displayName =
      typeof metadataDisplayName === 'string' && metadataDisplayName.trim()
        ? metadataDisplayName
        : clerkUser.fullName || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined;

    return {
      id: clerkUser.id,
      email,
      displayName,
    };
  }, [clerkUser]);

  const signOut = async () => {
    setError(null);
    setLoading(true);

    try {
      await clerkSignOut({ redirectUrl: '/' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateDisplayName = async (displayName: string) => {
    if (!clerkUser) {
      throw new Error('No authenticated user');
    }

    setError(null);
    setLoading(true);

    try {
      const existingMetadata = (clerkUser.unsafeMetadata as Record<string, unknown> | undefined) || {};
      await clerkUser.update({
        unsafeMetadata: {
          ...existingMetadata,
          displayName,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !isLoaded || loading,
        error,
        signOut,
        updateDisplayName,
        getToken,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
