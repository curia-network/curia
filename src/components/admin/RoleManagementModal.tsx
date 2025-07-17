import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Shield, 
  User, 
  Users, 
  Crown, 
  AlertTriangle,
  XCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetchJson, authFetch } from '@/utils/authFetch';
import { cn } from '@/lib/utils';

interface UserCommunityRole {
  userId: string;
  communityId: string;
  role: 'member' | 'moderator' | 'owner';
  status: 'active' | 'pending' | 'banned' | 'left';
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
  invitedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userProfilePictureUrl: string | null;
  inviterName: string | null;
}

interface RoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  username: string;
  communityId: string;
}

const ROLE_LABELS = {
  member: 'Member',
  moderator: 'Moderator',
  owner: 'Owner',
} as const;

const ROLE_DESCRIPTIONS = {
  member: 'Can view and participate in discussions',
  moderator: 'Can moderate content, manage posts and users',
  owner: 'Full control over the community',
} as const;

const ROLE_ICONS = {
  member: User,
  moderator: Shield,
  owner: Crown,
} as const;

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  left: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
} as const;

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  open,
  onOpenChange,
  userId,
  username,
  communityId,
}) => {
  const { user: currentUser, token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if user is viewing their own profile
  const isSelfModification = currentUser?.userId === userId;

  // Fetch current user's actual role in this community
  const { data: currentUserRole } = useQuery<string>({
    queryKey: ['currentUserRole', currentUser?.userId, communityId],
    queryFn: async () => {
      if (!token || !currentUser?.userId) throw new Error('No auth token or user');
      const response = await authFetchJson<{ success: boolean; user: UserCommunityRole }>(
        `/api/admin/users/${currentUser.userId}/community-role?communityId=${communityId}`,
        { token }
      );
      return response.user.role;
    },
    enabled: open && !!token && !!currentUser?.userId && !!communityId,
  });

  // Fetch current user role data
  const { data: userRoleData, isLoading, error } = useQuery<UserCommunityRole>({
    queryKey: ['userCommunityRole', userId, communityId],
    queryFn: async () => {
      if (!token) throw new Error('No auth token');
      const response = await authFetchJson<{ success: boolean; user: UserCommunityRole }>(
        `/api/admin/users/${userId}/community-role?communityId=${communityId}`,
        { token }
      );
      return response.user;
    },
    enabled: open && !!token && !!userId && !!communityId,
  });

  // Initialize selected role when data loads
  React.useEffect(() => {
    if (userRoleData && !selectedRole) {
      setSelectedRole(userRoleData.role);
    }
  }, [userRoleData, selectedRole]);

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      if (!token) throw new Error('No auth token');
      setIsUpdating(true);
      
      const response = await authFetch(`/api/admin/users/${userId}/community-role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId,
          role: newRole,
        }),
        token,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update role');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['userCommunityRole', userId, communityId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Role update failed:', error);
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  // Remove user from community mutation
  const removeUserMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No auth token');
      setIsUpdating(true);
      
      const response = await authFetch(`/api/admin/users/${userId}/community-role`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId,
        }),
        token,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('User removal failed:', error);
    },
    onSettled: () => {
      setIsUpdating(false);
    },
  });

  const handleUpdateRole = () => {
    if (selectedRole && selectedRole !== userRoleData?.role) {
      updateRoleMutation.mutate(selectedRole);
    }
  };

  const handleRemoveUser = () => {
    if (window.confirm(`Are you sure you want to remove ${username} from the community?`)) {
      removeUserMutation.mutate();
    }
  };

  const getAvailableRoles = () => {
    if (!currentUserRole || !userRoleData) return [];
    
    // Define what each role can manage
    const rolePermissions: Record<string, string[]> = {
      owner: ['member', 'moderator', 'owner'], // Owners can manage all roles
      moderator: ['member'], // Moderators can only manage members
      member: [] // Members can't manage roles
    };
    
    // Get available roles based on current user's actual role
    const availableRoles = rolePermissions[currentUserRole] || [];
    
    return availableRoles;
  };

  const canRemoveUser = () => {
    if (!currentUserRole || !userRoleData || isUpdating || isSelfModification) return false;
    
    // Define removal permissions based on current user's role
    const canRemove: Record<string, string[]> = {
      owner: ['member', 'moderator'], // Owners can remove members and moderators, but not other owners (to prevent accidental removal)
      moderator: ['member'], // Moderators can only remove members
      member: [] // Members cannot remove anyone
    };
    
    const allowedToRemove = canRemove[currentUserRole] || [];
    return allowedToRemove.includes(userRoleData.role);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage User Role
          </DialogTitle>
          <DialogDescription>
            Manage {username}&apos;s role and permissions in this community.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load user data: {(error as Error).message}
            </AlertDescription>
          </Alert>
        ) : userRoleData ? (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userRoleData.userProfilePictureUrl || ''} />
                <AvatarFallback>
                  {userRoleData.userName?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{userRoleData.userName}</h3>
                  <Badge className={cn('text-xs', STATUS_COLORS[userRoleData.status])}>
                    {userRoleData.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Community Member
                </p>
              </div>
            </div>

            {/* Current Role */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium">Current Role</h4>
                <Badge variant="outline" className="flex items-center gap-1">
                  {React.createElement(ROLE_ICONS[userRoleData.role], { className: "h-3 w-3" })}
                  {ROLE_LABELS[userRoleData.role]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {ROLE_DESCRIPTIONS[userRoleData.role]}
              </p>
            </div>

                         {/* Member Stats */}
             <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm">
                   <Calendar className="h-4 w-4" />
                   <span>Member since</span>
                 </div>
                 <p className="text-sm font-medium">
                   {formatDate(userRoleData.firstVisitedAt)}
                 </p>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm">
                   <Clock className="h-4 w-4" />
                   <span>Last visit</span>
                 </div>
                 <p className="text-sm font-medium">
                   {formatDate(userRoleData.lastVisitedAt)}
                 </p>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm">
                   <Users className="h-4 w-4" />
                   <span>Visits</span>
                 </div>
                 <p className="text-sm font-medium">
                   {userRoleData.visitCount} times
                 </p>
               </div>
               <div className="space-y-1">
                 <div className="flex items-center gap-2 text-sm">
                   <User className="h-4 w-4" />
                   <span>Invited by</span>
                 </div>
                 <p className="text-sm font-medium">
                   {userRoleData.invitedByUserId ? userRoleData.inviterName || 'Another user' : 'Self-joined'}
                 </p>
               </div>
             </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <h4 className="font-medium">Change Role</h4>
              {isSelfModification ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You cannot modify your own role. Please have another admin change your role if needed.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {React.createElement(ROLE_ICONS[role as keyof typeof ROLE_ICONS], { 
                              className: "h-4 w-4" 
                            })}
                            <span>{ROLE_LABELS[role as keyof typeof ROLE_LABELS]}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {selectedRole && ROLE_DESCRIPTIONS[selectedRole as keyof typeof ROLE_DESCRIPTIONS]}
                  </p>
                </>
              )}
            </div>

            {/* Error Display */}
            {(updateRoleMutation.error || removeUserMutation.error) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {(updateRoleMutation.error || removeUserMutation.error)?.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {canRemoveUser() && (
              <Button
                variant="destructive"
                onClick={handleRemoveUser}
                disabled={isUpdating}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Remove from Community
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            
            {!isSelfModification && (
              <Button 
                onClick={handleUpdateRole}
                disabled={isUpdating || !selectedRole || selectedRole === userRoleData?.role}
              >
                {isUpdating ? 'Updating...' : 'Update Role'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 