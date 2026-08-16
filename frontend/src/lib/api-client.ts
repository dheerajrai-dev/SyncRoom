export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '/api/v1';
}

export function getWsBaseUrl(): string {
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174') ? '8000' : window.location.port;
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/api/v1/ws`;
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
  hostToken?: string | null;
  params?: Record<string, string | number | boolean | undefined | null>;
}

let currentAccessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getApiAccessToken(): string | null {
  return currentAccessToken;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, hostToken, params, headers = {}, ...customConfig } = options;
  
  let url = `${getApiBaseUrl()}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const effectiveToken = token !== undefined ? token : currentAccessToken;
  if (effectiveToken) {
    reqHeaders['Authorization'] = `Bearer ${effectiveToken}`;
  }

  if (hostToken) {
    reqHeaders['x-host-token'] = hostToken;
  }

  const config: RequestInit = {
    ...customConfig,
    headers: reqHeaders,
    credentials: 'include', // Ensures HTTP-only refresh cookies are sent/received
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return null as T;
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data?.detail
      ? (typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail))
      : (typeof data === 'string' && data ? data : response.statusText || 'Request failed');
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).data = data;
    throw error;
  }

  return data as T;
}
