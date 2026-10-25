'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore } from './api';

export interface AuthContextType {
  login: (emailOrSessionId: string, passwordOrTotp: string) => Promise<any>;
  verify2fa: (sessionId: string, totpCode: string) => Promise<any>;
  user: {
    id: string;
    clinic_id: string;
    role: string;
    is_clinic_admin: boolean;
    full_name?: string;
    email?: string;
  } | null;
  pending2faSession: string;
  setPending2faSession: (session: string) => void;
  challengeToken: string;
  setChallengeToken: (token: string) => void;
  isLoading: boolean;
  logout: () => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const AuthContext = createContext<AuthContextType>({
  login: async () => {},
  verify2fa: async () => {},
  user: null,
  pending2faSession: '',
  setPending2faSession: () => {},
  challengeToken: '',
  setChallengeToken: () => {},
  isLoading: false,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending2faSession, setPending2faSession] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);

  function logout() {
    tokenStore.clear();
    setUser(null);
    router.push('/auth/login');
  }

  function storeAuthSession(result: any) {
    if (result?.access_token) {
      tokenStore.set(result.access_token, result.refresh_token ?? null);
    }
    if (result?.user) {
      setUser(result.user);
    }
  }

    const verify2fa = async (sessionId: string, totpCode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, totp_code: totpCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || json?.message || 'Verification failed');
      }
      const data = json?.data || json;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_2fa_session');
        localStorage.removeItem('challenge_token');
      }
      storeAuthSession(data);
      router.push('/agenda');
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrSessionId: string, passwordOrTotp: string) => {
    // If called with a session ID for 2FA verification
    if (!emailOrSessionId.includes('@')) {
      return verify2fa(emailOrSessionId, passwordOrTotp);
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrSessionId, password: passwordOrTotp }),
      });
      const json = await res.json();
      const result = json?.data || json;

      if (result.status === 'two_factor_required') {
        setPending2faSession(result.session_id);
        setChallengeToken(result.challenge_token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_2fa_session', result.session_id);
          localStorage.setItem('challenge_token', result.challenge_token);
        }
        router.push('/auth/2fa-verify');
        return result;
      }

      storeAuthSession(result);
      router.push('/agenda');
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // On mount: rehydrate token + fetch current user
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Fetch the current user to hydrate context
    fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json) => {
        const data = json?.data || json;
        if (data?.id) {
          setUser({
            id: data.id,
            clinic_id: data.clinic_id,
            role: data.role,
            is_clinic_admin: data.is_clinic_admin,
          });
        } else {
          tokenStore.clear();
        }
      })
      .catch(() => tokenStore.clear());
  }, []);

  return (
    <AuthContext.Provider
      value={{
        login,
        verify2fa,
        user,
        logout,
        pending2faSession,
        setPending2faSession,
        challengeToken,
        setChallengeToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
