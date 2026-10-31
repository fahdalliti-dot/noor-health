'use client';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return '';
  return 'http://localhost:4000';
}

export interface ApiError {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
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
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const status = res.status;

  if (status === 204) {
    return { data: null, error: null, status };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      data: null,
      error: { error: 'Failed to parse response JSON', statusCode: status },
      status,
    };
  }

  if (!res.ok) {
    const err = json as ApiError;
    return {
      data: null,
      error: {
        error: err.error || 'Request failed',
        message: err.message,
        statusCode: status,
      },
      status,
    };
  }

  return { data: json as T, error: null, status };
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
