'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Building, Users, Loader2 } from 'lucide-react';
import { CreateCommunityModal } from './CreateCommunityModal';
import { SearchCommunitiesModal } from './SearchCommunitiesModal';
import { useCommunities } from '@/hooks/useCommunities';
import { useAuth, validateIdentityForCommunityCreation } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

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

interface CommunitySelectorProps {
  selectedCommunityId: string | null;
  onCommunitySelect: (communityId: string) => void;
  onAuthRequired: (mode?: string) => void;
  pendingCreateCommunity?: boolean;
  onClearPendingCreate?: () => void;
}

export function CommunitySelector({
  selectedCommunityId,
  onCommunitySelect,
  onAuthRequired,
  pendingCreateCommunity = false,
  onClearPendingCreate = () => {}
}: CommunitySelectorProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isValidatingIdentity, setIsValidatingIdentity] = useState(false);
  
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: communitiesData, isLoading } = useCommunities(isAuthenticated);
  
  const userCommunities = communitiesData?.userCommunities || [];
  const selectedCommunity = userCommunities.find(c => c.id === selectedCommunityId) || 
                           communitiesData?.availableCommunities?.find(c => c.id === selectedCommunityId);

  // Auto-select first community if none selected and user has communities
  useEffect(() => {
    if (!selectedCommunityId && userCommunities.length > 0) {
      onCommunitySelect(userCommunities[0].id);
    }
  }, [selectedCommunityId, userCommunities, onCommunitySelect]);

  // Handle pending create community intent after authentication
  useEffect(() => {
    if (isAuthenticated && pendingCreateCommunity) {
      handleCreateCommunity();
      onClearPendingCreate();
    }
  }, [isAuthenticated, pendingCreateCommunity, onClearPendingCreate]);

  const handleCreateCommunity = async () => {
    if (!isAuthenticated) {
      onAuthRequired('secure-auth');
      return;
    }
    
    // Validate identity type for community creation
    setIsValidatingIdentity(true);
    try {
      const canCreateCommunity = await validateIdentityForCommunityCreation();
      
      if (!canCreateCommunity) {
        // User is authenticated but anonymous - treat as if not authenticated
        onAuthRequired('secure-auth');
        return;
      }
      
      setCreateModalOpen(true);
    } catch (error) {
      console.error('Error validating identity for community creation:', error);
      onAuthRequired('secure-auth');
    } finally {
      setIsValidatingIdentity(false);
    }
  };

  const handleSearchCommunities = () => {
    setSearchModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Selection Display */}
      {selectedCommunity && (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white font-semibold text-sm">
            {selectedCommunity.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 dark:text-white">{selectedCommunity.name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{selectedCommunity.memberCount} members</p>
          </div>
          <div className="flex items-center gap-1">
            <Building className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Selected</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleCreateCommunity}
          disabled={isValidatingIdentity}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
        >
          {isValidatingIdentity ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </>
          )}
        </Button>
        
        <Button
          onClick={handleSearchCommunities}
          variant="outline"
          className="flex-1 border-slate-300 dark:border-slate-600"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Communities
        </Button>
      </div>

      {/* Modals */}
      <CreateCommunityModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCommunityCreated={(community: Community) => {
          // Invalidate communities cache to refresh the list
          queryClient.invalidateQueries({ queryKey: ['communities', isAuthenticated] });
          queryClient.invalidateQueries({ queryKey: ['communities', false] }); // Also invalidate unauthenticated cache
          
          onCommunitySelect(community.id);
          setCreateModalOpen(false);
        }}
      />
      
      <SearchCommunitiesModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        selectedCommunityId={selectedCommunityId}
        onCommunitySelect={(communityId: string) => {
          onCommunitySelect(communityId);
          setSearchModalOpen(false);
        }}
      />
    </div>
  );
} 