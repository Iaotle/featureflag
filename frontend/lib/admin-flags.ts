import { FeatureFlag, CreateFlagData, UpdateFlagData } from '@/types/flag';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/**
 * Get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const name = 'XSRF-TOKEN=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return decodeURIComponent(cookie.substring(name.length));
    }
  }
  return null;
}

/**
 * Get all feature flags
 */
export async function getFlags(): Promise<FeatureFlag[]> {
  const response = await fetch(`${API_URL}/admin/flags`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch flags');
  }

  return response.json();
}

/**
 * Get a single feature flag
 */
export async function getFlag(identifier: string | number): Promise<FeatureFlag> {
  const response = await fetch(`${API_URL}/admin/flags/${identifier}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch flag');
  }

  return response.json();
}

/**
 * Create a new feature flag
 */
export async function createFlag(data: CreateFlagData): Promise<FeatureFlag> {
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_URL}/admin/flags`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create flag');
  }

  return response.json();
}

/**
 * Update an existing feature flag
 */
export async function updateFlag(id: number, data: UpdateFlagData): Promise<FeatureFlag> {
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_URL}/admin/flags/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update flag');
  }

  return response.json();
}

/**
 * Delete a feature flag
 */
export async function deleteFlag(id: number): Promise<void> {
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_URL}/admin/flags/${id}`, {
    method: 'DELETE',
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to delete flag');
  }
}
