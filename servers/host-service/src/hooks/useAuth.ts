import { useState, useEffect } from 'react';

interface AuthUser {
  user_id: string;
  name: string;
  profile_picture_url: string;
  identity_type: 'ens' | 'universal_profile' | 'anonymous' | 'legacy';
  wallet_address: string;
  ens_domain: string;
  up_address: string;
  is_anonymous: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isValidating: boolean;
  user: AuthUser | null;
  token: string | null;
  canCreateCommunity: boolean; // true only for ENS and Universal Profile users
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isValidating: true,
    user: null,
    token: null,
    canCreateCommunity: false
  });

  useEffect(() => {
    const validateSession = async () => {
      try {
        const token = localStorage.getItem('curia_session_token');
        
        if (!token) {
          setState({
            isAuthenticated: false,
            isValidating: false,
            user: null,
            token: null,
            canCreateCommunity: false
          });
          return;
        }

        const response = await fetch('/api/auth/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionToken: token }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Update token if it was rotated
          if (data.token !== token) {
            localStorage.setItem('curia_session_token', data.token);
          }
          
          // Community creation is only allowed for ENS and Universal Profile users
          const canCreateCommunity = data.user.identity_type === 'ens' || data.user.identity_type === 'universal_profile';
          
          setState({
            isAuthenticated: true,
            isValidating: false,
            user: data.user,
            token: data.token,
            canCreateCommunity
          });
        } else {
          // Invalid session, clear localStorage
          localStorage.removeItem('curia_session_token');
          setState({
            isAuthenticated: false,
            isValidating: false,
            user: null,
            token: null,
            canCreateCommunity: false
          });
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setState({
          isAuthenticated: false,
          isValidating: false,
          user: null,
          token: null,
          canCreateCommunity: false
        });
      }
    };

    validateSession();
  }, []);

  return state;
} 