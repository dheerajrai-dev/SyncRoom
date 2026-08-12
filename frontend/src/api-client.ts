let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function apiClient(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const { requireAuth = false, headers, ...customConfig } = options;
  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (requireAuth && accessToken) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }

  // Ensure requests are sent with cookies for refresh endpoint
  config.credentials = 'include';

  let response = await fetch(endpoint, config);

  // Silent refresh on 401
  if (response.status === 401 && requireAuth) {
    try {
      const refreshResponse = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        accessToken = data.access_token;
        
        // Retry original request
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        response = await fetch(endpoint, config);
      } else {
        // Refresh failed, clear token (session expired)
        accessToken = null;
        // The router or app state should catch this and redirect to login
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    } catch (e) {
      console.error('Failed to refresh token', e);
      accessToken = null;
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  }

  return response;
}
