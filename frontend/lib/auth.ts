import { LoginCredentials, AuthResponse, User } from '@/types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SANCTUM_URL = API_URL.replace('/api', '');

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
 * Get CSRF token from Sanctum
 */
export async function getCsrfToken(): Promise<void> {
  await fetch(`${SANCTUM_URL}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

/**
 * Login user with credentials
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // First get CSRF token
  await getCsrfToken();

  // Get the CSRF token from cookie
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  const csrfToken = getCsrfTokenFromCookie();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  await fetch(`${API_URL}/logout`, {
    method: 'POST',
    headers,
    credentials: 'include',
  });
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    return null;
  }
}
