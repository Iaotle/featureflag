import { v4 as uuidv4 } from 'uuid';

/**
 * Get or create a unique user ID from localStorage
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-side-render';
  }

  const storageKey = 'feature_flag_user_id';
  let userId = localStorage.getItem(storageKey);

  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(storageKey, userId);
  }

  return userId;
}

/**
 * Fetch feature flags from the API
 */
export async function fetchFlags(flagKeys: string[]): Promise<Record<string, boolean>> {
  const userId = getUserId();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${apiUrl}/flags/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flags: flagKeys,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      console.error('Failed to fetch flags:', response.statusText);
      return flagKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {});
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching flags:', error);
    return flagKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {});
  }
}
