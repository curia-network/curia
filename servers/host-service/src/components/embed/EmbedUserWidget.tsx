/**
 * Embed User Widget - Shows authenticated user with disconnect option
 * 
 * Displays current user info in top-right corner of embed with ability
 * to disconnect/clear session and start fresh authentication.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Crown, Globe, Zap } from 'lucide-react';
import { ProfileData } from '@/types/embed';

interface EmbedUserWidgetProps {
  profileData: ProfileData | null;
  onDisconnect: () => void;
}

export function EmbedUserWidget({ profileData, onDisconnect }: EmbedUserWidgetProps) {
  // Don't show widget if no user data
  if (!profileData) {
    return null;
  }

  const handleDisconnect = () => {
    // Clear session storage
    localStorage.removeItem('curia_session_token');
    
    // Call parent disconnect handler
    onDisconnect();
  };

  // Get user type icon
  const getUserIcon = () => {
    switch (profileData.type) {
      case 'ens':
        return <Globe className="w-3 h-3" />;
      case 'universal_profile':
        return <Zap className="w-3 h-3" />;
      case 'anonymous':
        return <User className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  // Get user type label
  const getUserTypeLabel = () => {
    switch (profileData.type) {
      case 'ens':
        return 'ENS';
      case 'universal_profile':
        return 'UP';
      case 'anonymous':
        return 'Guest';
      default:
        return 'User';
    }
  };

  // Get display name
  const getDisplayName = () => {
    if (profileData.name) {
      return profileData.name;
    }
    if (profileData.domain) {
      return profileData.domain;
    }
    if (profileData.address) {
      return `${profileData.address.slice(0, 6)}...${profileData.address.slice(-4)}`;
    }
    return 'Anonymous User';
  };

  return (
    <div className="flex items-center gap-2 embed-user-widget backdrop-blur-sm rounded-lg px-3 py-2">
      {/* User Avatar/Icon */}
      <div className="w-6 h-6 rounded-full overflow-hidden embed-avatar-bg flex items-center justify-center">
        {profileData.avatar ? (
          <img 
            src={profileData.avatar} 
            alt="User Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          getUserIcon()
        )}
      </div>
      
      {/* User Info */}
      <div className="flex flex-col min-w-0">
        <div className="text-xs embed-user-name truncate">
          {getDisplayName()}
        </div>
        <div className="text-xs embed-user-type">
          {getUserTypeLabel()}
        </div>
      </div>
      
      {/* Disconnect Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
        className="h-6 w-6 p-0 embed-disconnect-btn"
        title="Disconnect and start fresh"
      >
        <LogOut className="w-3 h-3" />
      </Button>
    </div>
  );
} 