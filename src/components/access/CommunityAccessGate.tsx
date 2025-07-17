import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityData } from '@/hooks/useCommunityData';
import { checkCommunityAccess, getUserRoles, AccessControlUtils } from '@/lib/roleService';
import { authFetchJson } from '@/utils/authFetch';
import { CommunityAccessDenied } from './CommunityAccessDenied';
import { useCgLib } from '@/contexts/CgLibContext';
import { CommunityInfoResponsePayload } from '@curia_/cg-plugin-lib';
import { cn } from '@/lib/utils';

interface CommunityAccessGateProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

interface AccessCheckResult {
  allowed: boolean;
  roleAccess: boolean;
  identityAccess: boolean;
  roleFailureReason?: string;
  identityFailureReason?: string;
  requiredRoles?: string[];
  userIdentityType?: string;
}

export const CommunityAccessGate: React.FC<CommunityAccessGateProps> = ({ 
  children, 
  theme = 'light' 
}) => {
  const { user, isAuthenticated } = useAuth();
  const { cgInstance } = useCgLib();

  // Fetch community info for role names
  const { data: communityInfo } = useQuery<CommunityInfoResponsePayload | null>({
    queryKey: ['communityInfo', cgInstance?.getCommunityInfo !== undefined],
    queryFn: async () => {
      if (!cgInstance) throw new Error('CgInstance not available');
      const response = await cgInstance.getCommunityInfo();
      if (!response?.data) throw new Error('Failed to fetch community info data from CgLib.');
      return response.data;
    },
    enabled: !!cgInstance,
  });

  // Fetch community settings using centralized hook
  const { data: communityData, isLoading, error } = useCommunityData();

  // Check if user has community access (both role-based and identity-based)
  const { data: userAccess, isLoading: isCheckingAccess } = useQuery({
    queryKey: ['userCommunityAccess', user?.userId, communityData?.id],
    queryFn: async (): Promise<AccessCheckResult> => {
      if (!communityData || !user) {
        return {
          allowed: false,
          roleAccess: false,
          identityAccess: false,
          roleFailureReason: 'No community data or user session',
          identityFailureReason: 'No community data or user session'
        };
      }
      
      // Admin override - admins always have access
      if (user.isAdmin) {
        AccessControlUtils.logAccessAttempt(
          'community', 
          'granted', 
          'admin override'
        );
        return {
          allowed: true,
          roleAccess: true,
          identityAccess: true
        };
      }

      // Check role-based access (existing system)
      const userRoles = await getUserRoles(user.roles);
      const roleAccess = await checkCommunityAccess(communityData, userRoles);
      
      // Check identity-based access (new system)
      const identityResult = await authFetchJson<{
        success: boolean;
        identityAccess: boolean;
        identityType: string;
        identityFailureReason?: string;
      }>(`/api/communities/${communityData.id}/access-check`);
      
      const identityAccess = identityResult.success && identityResult.identityAccess;
      const identityFailureReason = identityResult.identityFailureReason;
      const identityType = identityResult.identityType;
      
      // Both must pass for access
      const allowed = roleAccess && identityAccess;
      
      // Log access attempt
      AccessControlUtils.logAccessAttempt(
        'community', 
        allowed ? 'granted' : 'denied',
        allowed ? 'role and identity access' : 
          `role: ${roleAccess ? 'granted' : 'denied'}, identity: ${identityAccess ? 'granted' : 'denied'}`
      );
      
      return {
        allowed,
        roleAccess,
        identityAccess,
        roleFailureReason: roleAccess ? undefined : 'Insufficient role permissions',
        identityFailureReason: identityAccess ? undefined : identityFailureReason,
        userIdentityType: identityType
      };
    },
    enabled: !!communityData && !!user,
  });

  // Get required role names for display
  const requiredRoleNames = React.useMemo(() => {
    if (!communityData?.settings?.permissions?.allowedRoles || !communityInfo?.roles) {
      return [];
    }
    
    const allowedRoleIds = communityData.settings.permissions.allowedRoles;
    return communityInfo.roles
      .filter(role => allowedRoleIds.includes(role.id))
      .filter(role => !role.title.toLowerCase().includes('admin')) // Hide admin roles
      .map(role => role.title);
  }, [communityData?.settings?.permissions?.allowedRoles, communityInfo?.roles]);

  // Loading state
  if (!isAuthenticated || isLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className={cn(
            "text-sm",
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          )}>
            Checking access permissions...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('Community access check failed:', error);
    return (
      <CommunityAccessDenied 
        theme={theme}
        communityName={communityData?.name}
        requiredRoles={requiredRoleNames}
      />
    );
  }

  // Access denied
  if (userAccess?.allowed === false) {
    return (
      <CommunityAccessDenied 
        theme={theme}
        communityName={communityData?.name}
        requiredRoles={requiredRoleNames}
        accessResult={userAccess}
      />
    );
  }

  // Access granted - show the app
  return <>{children}</>;
}; 