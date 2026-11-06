import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

// Set base URL using standard Vite env var (set by Cartographer/Replit)
setBaseUrl(import.meta.env.BASE_URL === '/' ? null : import.meta.env.BASE_URL);

// Set up auth token getter so all API calls send the bearer token
setAuthTokenGetter(() => {
  return localStorage.getItem('luxe_token');
});

// Helper functions for token management
export const setToken = (token: string) => {
  localStorage.setItem('luxe_token', token);
};

export const clearToken = () => {
  localStorage.removeItem('luxe_token');
};

export const getToken = () => {
  return localStorage.getItem('luxe_token');
};

export const setUserData = (user: any) => {
  localStorage.setItem('luxe_user', JSON.stringify(user));
};

export const getUserData = () => {
  const user = localStorage.getItem('luxe_user');
  if (user) {
    try {
      return JSON.parse(user);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const clearUserData = () => {
  localStorage.removeItem('luxe_user');
};

export const formatPrice = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
