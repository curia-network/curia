'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserX,
  Info,
  Save,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ThumbsUp,
  Heart,
  PenTool
} from 'lucide-react';
import { CommunitySettings } from '@/types/settings';
import { cn } from '@/lib/utils';

interface AnonymousPermissionsSettingsProps {
  currentSettings?: CommunitySettings;
  onSettingsChange: (settings: CommunitySettings) => void;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const AnonymousPermissionsSettings: React.FC<AnonymousPermissionsSettingsProps> = ({
  currentSettings,
  onSettingsChange,
  isLoading = false,
  theme = 'light',
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localPermissions, setLocalPermissions] = useState({
    canPost: currentSettings?.anonymousPermissions?.canPost ?? false,
    canComment: currentSettings?.anonymousPermissions?.canComment ?? false,
    canUpvote: currentSettings?.anonymousPermissions?.canUpvote ?? false,
    canReact: currentSettings?.anonymousPermissions?.canReact ?? false,
  });
  const [hasChanges, setHasChanges] = useState(false);

  const handlePermissionChange = (permission: keyof typeof localPermissions, value: boolean) => {
    const newPermissions = { ...localPermissions, [permission]: value };
    setLocalPermissions(newPermissions);
    
    // Check if changes were made
    const currentPerms = currentSettings?.anonymousPermissions;
    const hasChanged = 
      newPermissions.canPost !== (currentPerms?.canPost ?? false) ||
      newPermissions.canComment !== (currentPerms?.canComment ?? false) ||
      newPermissions.canUpvote !== (currentPerms?.canUpvote ?? false) ||
      newPermissions.canReact !== (currentPerms?.canReact ?? false);
    
    setHasChanges(hasChanged);
  };

  const handleSave = () => {
    const newSettings: CommunitySettings = {
      ...currentSettings,
      anonymousPermissions: localPermissions
    };
    
    onSettingsChange(newSettings);
    setHasChanges(false);
  };

  const handleReset = () => {
    const currentPerms = currentSettings?.anonymousPermissions;
    setLocalPermissions({
      canPost: currentPerms?.canPost ?? false,
      canComment: currentPerms?.canComment ?? false,
      canUpvote: currentPerms?.canUpvote ?? false,
      canReact: currentPerms?.canReact ?? false,
    });
    setHasChanges(false);
  };

  const permissionItems = [
    {
      key: 'canPost' as const,
      label: 'Create Posts',
      description: 'Allow anonymous users to create new posts',
      icon: PenTool,
      risk: 'medium'
    },
    {
      key: 'canComment' as const,
      label: 'Add Comments',
      description: 'Allow anonymous users to comment on posts',
      icon: MessageSquare,
      risk: 'medium'
    },
    {
      key: 'canUpvote' as const,
      label: 'Upvote Posts',
      description: 'Allow anonymous users to upvote posts',
      icon: ThumbsUp,
      risk: 'low'
    },
    {
      key: 'canReact' as const,
      label: 'Add Reactions',
      description: 'Allow anonymous users to add emoji reactions',
      icon: Heart,
      risk: 'low'
    }
  ];

  const enabledCount = Object.values(localPermissions).filter(Boolean).length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors touch-manipulation select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX size={20} />
            <div>
              <CardTitle className="text-lg">Anonymous User Permissions</CardTitle>
              <CardDescription>
                Control what anonymous users can do in your community
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enabledCount > 0 && (
              <span className={cn(
                "text-xs px-2 py-1 rounded-full",
                theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
              )}>
                {enabledCount} enabled
              </span>
            )}
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Anonymous users are those with identity_type &quot;anonymous&quot;. 
              Be cautious with these permissions as they can affect content quality and moderation.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {permissionItems.map((item) => {
              const Icon = item.icon;
              const isEnabled = localPermissions[item.key];
              
              return (
                <div key={item.key} className={cn(
                  "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                  theme === 'dark' ? 'border-slate-700 hover:bg-slate-800/50' : 'border-slate-200 hover:bg-slate-50'
                )}>
                  <Checkbox
                    id={item.key}
                    checked={isEnabled}
                    onCheckedChange={(checked) => handlePermissionChange(item.key, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={cn(
                        isEnabled ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <Label 
                        htmlFor={item.key}
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          isEnabled && "text-primary"
                        )}
                      >
                        {item.label}
                      </Label>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        item.risk === 'medium' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      )}>
                        {item.risk} risk
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-1",
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    )}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

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