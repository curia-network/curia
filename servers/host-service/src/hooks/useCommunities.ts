import { useQuery } from '@tanstack/react-query';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic: boolean;
  gradientClass: string;
  icon: string;
  logoUrl: string | null;
  requiresApproval: boolean;
  userRole?: string;
  isMember: boolean;
  createdAt: string;
  communityShortId?: string;
  pluginId?: string;
}

interface CommunitiesResponse {
  userCommunities: Community[];
  availableCommunities: Community[];
  isAuthenticated: boolean;
}

export function useCommunities(isAuthenticated: boolean) {
  return useQuery<CommunitiesResponse>({
    queryKey: ['communities', isAuthenticated],
    queryFn: async () => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add auth header if available
      if (typeof window !== 'undefined' && isAuthenticated) {
        const token = localStorage.getItem('curia_session_token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch('/api/communities', {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }

      return response.json();
    },
    enabled: true, // Always enabled, API handles auth state
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 