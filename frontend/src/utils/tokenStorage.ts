const KEY = 'readora-token';

// Browsers can throw on storage access (private mode, blocked site data), so none of these may crash the app.

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string): void => {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* the user stays logged in until the page is closed */
  }
};

export const clearToken = (): void => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};
