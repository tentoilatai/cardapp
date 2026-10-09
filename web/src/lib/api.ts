import { handleLocalRequest } from './localRouter';
import { localDb } from './localDb';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const method = options.method || 'GET';
  let body: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = options.body;
    }
  }

  // 1. If local standalone mode is enabled (default for mobile local app), handle locally
  if (localDb.isLocalModeEnabled() || (typeof window !== 'undefined' && (window as any).Capacitor)) {
    try {
      const localResult = await handleLocalRequest<T>(url, method, body);
      if (localResult !== null) {
        return localResult;
      }
    } catch (e: any) {
      if (e?.message === 'Unauthorized') {
        if (!window.location.pathname.startsWith('/login') && url !== '/api/auth/me') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        throw new ApiError(401, 'Chưa đăng nhập');
      }
      throw new ApiError(400, e?.message || 'Lỗi xử lý dữ liệu cục bộ');
    }
  }

  // 2. Otherwise attempt remote network fetch with automatic fallback if offline
  const headers = new Headers(options.headers || {});
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      if (!window.location.pathname.startsWith('/login') && url !== '/api/auth/me') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    if (!response.ok) {
      let errorDetail = `Lỗi ${response.status}`;
      let data: any = null;
      try {
        data = await response.json();
        if (data?.detail) errorDetail = data.detail;
        else if (data?.title) errorDetail = data.title;
        else if (data?.message) errorDetail = data.message;
      } catch {
        try {
          const text = await response.text();
          if (text) errorDetail = text;
        } catch {
          // ignore
        }
      }
      throw new ApiError(response.status, errorDetail, data);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('spreadsheetml') || contentType.includes('octet-stream') || contentType.includes('csv'))) {
      return (await response.blob()) as unknown as T;
    }

    return response.json();
  } catch (err: any) {
    // If network error occurred (e.g. server offline), fallback to localDb seamlessly
    if (err instanceof TypeError || err?.name === 'TypeError' || err?.message?.includes('Failed to fetch')) {
      const localResult = await handleLocalRequest<T>(url, method, body);
      if (localResult !== null) {
        return localResult;
      }
    }
    throw err;
  }
}

export const api = {
  get: <T>(url: string) => fetchJson<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => fetchJson<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  }),
  put: <T>(url: string, body?: any) => fetchJson<T>(url, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  }),
  delete: <T>(url: string) => fetchJson<T>(url, { method: 'DELETE' }),
  download: async (url: string) => {
    if (localDb.isLocalModeEnabled() || (typeof window !== 'undefined' && (window as any).Capacitor)) {
      const blob = await handleLocalRequest<Blob>(url, 'GET');
      if (blob) {
        return {
          ok: true,
          blob: async () => blob
        } as unknown as Response;
      }
    }
    return fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include'
    });
  }
};
