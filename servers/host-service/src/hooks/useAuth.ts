import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    token: null
  });

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('curia_session_token');
      setState({
        isAuthenticated: !!token,
        token: token
      });
    };

    // Check on mount
    checkAuth();

    // Listen for localStorage changes (for post-auth flow)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'curia_session_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for manual localStorage changes in same tab
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      const result = originalSetItem.call(this, key, value);
      if (key === 'curia_session_token') {
        checkAuth();
      }
      return result;
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  return state;
}

// Separate function for identity validation when needed
export async function validateIdentityForCommunityCreation(): Promise<boolean> {
  try {
    const token = localStorage.getItem('curia_session_token');
    if (!token) return false;

    const response = await fetch('/api/auth/validate-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionToken: token }),
    });

    if (response.ok) {
      const data = await response.json();
      // Update token if rotated
      if (data.token !== token) {
        localStorage.setItem('curia_session_token', data.token);
      }
      
      // Only ENS and Universal Profile users can create communities
      return data.user.identity_type === 'ens' || data.user.identity_type === 'universal_profile';
    }
    
    return false;
  } catch (error) {
    console.error('Identity validation error:', error);
    return false;
  }
} 