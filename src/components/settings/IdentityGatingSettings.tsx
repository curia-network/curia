'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Shield,
  Users,
  Info,
  Save,
  ChevronDown,
  ChevronUp,
  Crown,
  Hash,
  UserX,
  MessageSquare,
  ThumbsUp,
  Heart,
  PenTool,
  UserPlus,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  CommunitySettings, 
  CommunityIdentityGating, 
  IdentityType, 
  IdentityPermissions,
  CommunityPreset 
} from '@/types/settings';
import { cn } from '@/lib/utils';

interface IdentityGatingSettingsProps {
  currentSettings?: CommunitySettings;
  onSettingsChange: (settings: CommunitySettings) => void;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

// Default permissions for each identity type
const DEFAULT_PERMISSIONS: Record<IdentityType, IdentityPermissions> = {
  legacy: {
    canPost: true,
    canComment: true,
    canUpvote: true,
    canReact: true,
    canJoinCommunity: true
  },
  ens: {
    canPost: true,
    canComment: true,
    canUpvote: true,
    canReact: true,
    canJoinCommunity: true
  },
  universal_profile: {
    canPost: true,
    canComment: true,
    canUpvote: true,
    canReact: true,
    canJoinCommunity: true
  },
  anonymous: {
    canPost: false,
    canComment: false,
    canUpvote: false,
    canReact: false,
    canJoinCommunity: false
  }
};

// Community presets for quick setup
const COMMUNITY_PRESETS: CommunityPreset[] = [
  {
    id: 'open_community',
    name: 'Open Community',
    description: 'Anyone can join and participate',
    icon: '🌐',
    gating: {
      canJoinCommunity: {
        legacy: true,
        ens: true,
        universal_profile: true,
        anonymous: true
      },
      permissions: {
        legacy: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        ens: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        universal_profile: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        anonymous: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true }
      }
    }
  },
  {
    id: 'verified_only',
    name: 'Verified Users Only',
    description: 'Only users with blockchain identities can join',
    icon: '✅',
    gating: {
      canJoinCommunity: {
        legacy: true,
        ens: true,
        universal_profile: true,
        anonymous: false
      },
      permissions: {
        legacy: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        ens: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        universal_profile: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        anonymous: { canPost: false, canComment: false, canUpvote: false, canReact: false, canJoinCommunity: false }
      }
    }
  },
  {
    id: 'premium_community',
    name: 'Premium Community',
    description: 'Only ENS and Universal Profile users can join',
    icon: '💎',
    gating: {
      canJoinCommunity: {
        legacy: false,
        ens: true,
        universal_profile: true,
        anonymous: false
      },
      permissions: {
        legacy: { canPost: false, canComment: false, canUpvote: false, canReact: false, canJoinCommunity: false },
        ens: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        universal_profile: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        anonymous: { canPost: false, canComment: false, canUpvote: false, canReact: false, canJoinCommunity: false }
      }
    }
  },
  {
    id: 'read_only_community',
    name: 'Read-Only Community',
    description: 'Anyone can join but only verified users can post',
    icon: '📖',
    gating: {
      canJoinCommunity: {
        legacy: true,
        ens: true,
        universal_profile: true,
        anonymous: true
      },
      permissions: {
        legacy: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        ens: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        universal_profile: { canPost: true, canComment: true, canUpvote: true, canReact: true, canJoinCommunity: true },
        anonymous: { canPost: false, canComment: false, canUpvote: true, canReact: true, canJoinCommunity: true }
      }
    }
  }
];

// Identity type display configuration
const IDENTITY_TYPES: Array<{
  id: IdentityType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  risk: 'low' | 'medium' | 'high';
}> = [
  {
    id: 'legacy',
    label: 'Common Ground Users',
    description: 'Users from the Common Ground ecosystem',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    risk: 'low'
  },
  {
    id: 'ens',
    label: 'ENS Holders',
    description: 'Users with Ethereum Name Service domains',
    icon: Hash,
    color: 'text-purple-600 dark:text-purple-400',
    risk: 'low'
  },
  {
    id: 'universal_profile',
    label: 'Universal Profile',
    description: 'Users with LUKSO Universal Profiles',
    icon: Crown,
    color: 'text-emerald-600 dark:text-emerald-400',
    risk: 'low'
  },
  {
    id: 'anonymous',
    label: 'Anonymous Users',
    description: 'Temporary users without blockchain identity',
    icon: UserX,
    color: 'text-orange-600 dark:text-orange-400',
    risk: 'high'
  }
];

// Permission display configuration
const PERMISSIONS: Array<{
  id: keyof IdentityPermissions;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  risk: 'low' | 'medium' | 'high';
}> = [
  {
    id: 'canJoinCommunity',
    label: 'Join Community',
    description: 'Can join and access the community',
    icon: UserPlus,
    risk: 'medium'
  },
  {
    id: 'canPost',
    label: 'Create Posts',
    description: 'Can create new posts',
    icon: PenTool,
    risk: 'high'
  },
  {
    id: 'canComment',
    label: 'Add Comments',
    description: 'Can comment on posts',
    icon: MessageSquare,
    risk: 'medium'
  },
  {
    id: 'canUpvote',
    label: 'Upvote Posts',
    description: 'Can upvote posts',
    icon: ThumbsUp,
    risk: 'low'
  },
  {
    id: 'canReact',
    label: 'Add Reactions',
    description: 'Can add emoji reactions',
    icon: Heart,
    risk: 'low'
  }
];

export const IdentityGatingSettings: React.FC<IdentityGatingSettingsProps> = ({
  currentSettings,
  onSettingsChange,
  isLoading = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get current identity gating or use defaults
  const currentGating = currentSettings?.identityGating || {
    canJoinCommunity: {
      legacy: true,
      ens: true,
      universal_profile: true,
      anonymous: false
    },
    permissions: DEFAULT_PERMISSIONS
  };

  const [localGating, setLocalGating] = useState<CommunityIdentityGating>(currentGating);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalIdentityTypes = IDENTITY_TYPES.length;
    const totalPermissions = PERMISSIONS.length;
    const joinableTypes = IDENTITY_TYPES.filter(type => localGating.canJoinCommunity[type.id]).length;
    
    let totalEnabledPermissions = 0;
    IDENTITY_TYPES.forEach(type => {
      PERMISSIONS.forEach(permission => {
        if (localGating.permissions[type.id][permission.id]) {
          totalEnabledPermissions++;
        }
      });
    });

    return {
      totalIdentityTypes,
      totalPermissions,
      joinableTypes,
      totalEnabledPermissions,
      maxPermissions: totalIdentityTypes * totalPermissions,
      isRestrictive: joinableTypes < totalIdentityTypes || totalEnabledPermissions < (totalIdentityTypes * totalPermissions * 0.7)
    };
  }, [localGating]);

  // Handle permission changes
  const handlePermissionChange = (
    identityType: IdentityType, 
    permission: keyof IdentityPermissions, 
    value: boolean
  ) => {
    setLocalGating(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [identityType]: {
          ...prev.permissions[identityType],
          [permission]: value
        }
      }
    }));
    setHasChanges(true);
  };

  // Handle join community permission changes
  const handleJoinCommunityChange = (identityType: IdentityType, value: boolean) => {
    setLocalGating(prev => {
      const newGating = {
        ...prev,
        canJoinCommunity: {
          ...prev.canJoinCommunity,
          [identityType]: value
        }
      };
      
      // If they can't join the community, disable all other permissions
      if (!value) {
        newGating.permissions = {
          ...newGating.permissions,
          [identityType]: {
            ...newGating.permissions[identityType],
            canJoinCommunity: false,
            canPost: false,
            canComment: false,
            canUpvote: false,
            canReact: false
          }
        };
      } else {
        // If they can join, enable canJoinCommunity permission
        newGating.permissions = {
          ...newGating.permissions,
          [identityType]: {
            ...newGating.permissions[identityType],
            canJoinCommunity: true
          }
        };
      }
      
      return newGating;
    });
    setHasChanges(true);
  };

  // Apply community preset
  const applyPreset = (presetId: string) => {
    const preset = COMMUNITY_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setLocalGating(preset.gating);
      setSelectedPreset(presetId);
      setHasChanges(true);
    }
  };

  // Save changes
  const handleSave = () => {
    const newSettings: CommunitySettings = {
      ...currentSettings,
      identityGating: localGating
    };
    
    onSettingsChange(newSettings);
    setHasChanges(false);
  };

  // Reset changes
  const handleReset = () => {
    setLocalGating(currentGating);
    setSelectedPreset('');
    setHasChanges(false);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors touch-manipulation select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={20} />
            <div>
              <CardTitle className="text-lg">Identity-Based Community Gating</CardTitle>
              <CardDescription>
                Control what each identity type can do in your community
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={stats.isRestrictive ? "destructive" : "default"} className="text-xs">
              {stats.joinableTypes}/{stats.totalIdentityTypes} can join
            </Badge>
            {isExpanded ? (
              <ChevronUp size={20} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={20} className="text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Community Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Quick Setup</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => applyPreset(selectedPreset)}
                disabled={!selectedPreset || !hasChanges}
              >
                <Sparkles size={16} className="mr-2" />
                Apply Preset
              </Button>
            </div>
            
            <Select value={selectedPreset} onValueChange={setSelectedPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a community preset..." />
              </SelectTrigger>
              <SelectContent>
                {COMMUNITY_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
                      <span>{preset.icon}</span>
                      <div>
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-xs text-muted-foreground">{preset.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permission Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Permission Matrix</Label>
              <Badge variant="outline" className="text-xs">
                {stats.totalEnabledPermissions}/{stats.maxPermissions} enabled
              </Badge>
            </div>

            {/* Matrix Header */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-6 gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">Identity Type</div>
                  {PERMISSIONS.map((permission) => {
                    const Icon = permission.icon;
                    return (
                      <div key={permission.id} className="text-center">
                        <div className="flex items-center justify-center gap-1 text-xs font-medium">
                          <Icon size={14} />
                          <span className="hidden sm:inline">{permission.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Matrix Rows */}
                <div className="space-y-2 mt-3">
                  {IDENTITY_TYPES.map((identityType) => {
                    const TypeIcon = identityType.icon;
                    const canJoin = localGating.canJoinCommunity[identityType.id];
                    
                    return (
                      <div 
                        key={identityType.id}
                        className={cn(
                          "grid grid-cols-6 gap-2 p-3 rounded-lg border transition-colors",
                          canJoin 
                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
                            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
                        )}
                      >
                        {/* Identity Type Header */}
                        <div className="flex items-center gap-2">
                          <TypeIcon size={16} className={identityType.color} />
                          <div>
                            <div className="text-sm font-medium">{identityType.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {identityType.description}
                            </div>
                          </div>
                        </div>

                        {/* Permission Checkboxes */}
                        {PERMISSIONS.map((permission) => {
                          const isEnabled = localGating.permissions[identityType.id][permission.id];
                          const isJoinPermission = permission.id === 'canJoinCommunity';
                          
                          return (
                            <div key={permission.id} className="flex justify-center">
                              <Checkbox
                                checked={isJoinPermission ? canJoin : isEnabled}
                                onCheckedChange={(value) => {
                                  if (isJoinPermission) {
                                    handleJoinCommunityChange(identityType.id, value as boolean);
                                  } else {
                                    handlePermissionChange(identityType.id, permission.id, value as boolean);
                                  }
                                }}
                                disabled={!canJoin && !isJoinPermission}
                              />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Warnings and Info */}
          <div className="space-y-3">
            {stats.joinableTypes === 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> No identity types can join your community. 
                  This will make your community inaccessible to all users.
                </AlertDescription>
              </Alert>
            )}
            
            {localGating.canJoinCommunity.anonymous && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Anonymous Access Enabled:</strong> Anonymous users can join your community. 
                  Consider the security implications and enable appropriate content moderation.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Permission Logic:</strong> Users who cannot join the community will be automatically 
                denied all other permissions. Identity types are determined during user authentication.
              </AlertDescription>
            </Alert>
          </div>

          {/* Save Actions */}
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isLoading}
              size="sm"
            >
              <Save size={16} className="mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            {hasChanges && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 