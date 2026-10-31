'use client';

function getApiBaseUrl(): string {
  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:4000';
}

export interface ApiError {
  error?: string;
  code?: string;
  message?: string;
  details?: Array<{ field: string; issue: string }>;
}

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
}

export interface TokenStore {
  access_token: string | null;
  refresh_token: string | null;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function storeToken(access: string, refresh: string | null) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<ApiResponse<T>> {
  const token = getToken();
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err: ApiError = json?.data || json;
    const error = new Error(err?.message || err?.error || `Request failed: ${res.status}`) as Error & {
      code?: string;
      status?: number;
    };
    error.code = err?.code;
    error.status = res.status;
    throw error;
  }

  return json as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('GET', path, undefined, headers),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PATCH', path, body, headers),
  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('DELETE', path, undefined, headers),
};

export const tokenStore = {
  get: getToken,
  set: storeToken,
  clear: clearToken,
  has: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },
};
