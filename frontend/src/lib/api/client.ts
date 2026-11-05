import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearSessionTokens } from './tokenStore';
import type { ApiErrorBody, RefreshResponse } from './types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, string[]>;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

const toApiError = async (response: Response): Promise<ApiError> => {
  let body: ApiErrorBody = {};
  try { body = (await response.json()) as ApiErrorBody; } catch { /* non-JSON response */ }
  const error = body.error;
  return new ApiError(
    response.status,
    error?.code ?? (response.status === 429 ? 'RATE_LIMITED' : 'HTTP_ERROR'),
    error?.message ?? (response.status === 429 ? 'Too many attempts. Please try again later.' : 'Something went wrong.'),
    error?.details?.fieldErrors ?? {},
  );
};

let refreshPromise: Promise<string> | null = null;
let sessionExpiredNotified = false;

const notifySessionExpired = () => {
  if (sessionExpiredNotified) return;
  sessionExpiredNotified = true;
  clearSessionTokens();
  window.dispatchEvent(new CustomEvent('campushub:session-expired'));
};

export const resetSessionExpiryNotification = () => { sessionExpiredNotified = false; };

export const refreshAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    notifySessionExpired();
    return Promise.reject(new ApiError(401, 'UNAUTHORIZED', 'Your session has expired. Please sign in again.'));
  }

  refreshPromise = (async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });
    if (!response.ok) throw await toApiError(response);
    const data = (await response.json()) as RefreshResponse;
    // Save the rotated refresh token before exposing the new access token.
    setRefreshToken(data.refreshToken);
    setAccessToken(data.accessToken);
    resetSessionExpiryNotification();
    return data.accessToken;
  })().catch((error: unknown) => {
    notifySessionExpired();
    throw error;
  }).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; auth?: boolean; retryAuth?: boolean };

const performRequest = async <T>(path: string, options: RequestOptions, retried = false): Promise<T> => {
  const { body, auth = true, retryAuth = true, headers, ...rest } = options;
  const requestAccessToken = getAccessToken();
  const requestHeaders = new Headers(headers);
  const isFormData = body instanceof FormData;
  if (!isFormData) requestHeaders.set('Content-Type', 'application/json');
  if (auth && requestAccessToken) requestHeaders.set('Authorization', `Bearer ${requestAccessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
  });

  if (response.status === 401 && auth && retryAuth && !retried && path !== '/api/auth/refresh') {
    const latestAccessToken = getAccessToken();
    // Another request may have refreshed while this response was still in flight.
    // Retry with that token instead of rotating the single-use refresh token again.
    if (!latestAccessToken || latestAccessToken === requestAccessToken) await refreshAccessToken();
    return performRequest<T>(path, options, true);
  }
  if (response.status === 401 && auth && retried) notifySessionExpired();
  if (!response.ok) throw await toApiError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const apiRequest = <T>(path: string, options: RequestOptions = {}) => performRequest<T>(path, options);

export const __resetApiClientForTests = () => {
  refreshPromise = null;
  sessionExpiredNotified = false;
  clearSessionTokens();
};
