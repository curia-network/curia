'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Building, Users } from 'lucide-react';
import { CreateCommunityModal } from './CreateCommunityModal';
import { SearchCommunitiesModal } from './SearchCommunitiesModal';
import { useCommunities } from '@/hooks/useCommunities';
import { useQueryClient } from '@tanstack/react-query';

interface CommunitySelectorProps {
  selectedCommunityId: string | null;
  onCommunitySelect: (communityId: string) => void;
  isAuthenticated: boolean;
  onAuthRequired: (mode?: string) => void;
  pendingCreateCommunity?: boolean;
  onClearPendingCreate?: () => void;
}

export function CommunitySelector({
  selectedCommunityId,
  onCommunitySelect,
  isAuthenticated,
  onAuthRequired,
  pendingCreateCommunity = false,
  onClearPendingCreate = () => {}
}: CommunitySelectorProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
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
      setCreateModalOpen(true);
      onClearPendingCreate();
    }
  }, [isAuthenticated, pendingCreateCommunity, onClearPendingCreate]);

  const handleCreateCommunity = () => {
    const identityType = localStorage.getItem('curia_identity_type');
    
    if (!isAuthenticated || identityType === 'anonymous') {
      // Force re-auth with secure-auth mode for non-anonymous identity
      onAuthRequired('secure-auth');
      return;
    }
    
    setCreateModalOpen(true);
  };

  const handleCommunityCreated = (newCommunity: any) => {
    // Optimistically update cache with new community data (already confirmed in DB)
    // Update BOTH cache keys since SearchCommunitiesModal uses different key
    queryClient.setQueryData(['communities', true], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        userCommunities: [...oldData.userCommunities, newCommunity]
      };
    });
    
    queryClient.setQueryData(['communities', false], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        userCommunities: [...oldData.userCommunities, newCommunity]
      };
    });
    
    onCommunitySelect(newCommunity.id);
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Create Community Button - Primary */}
        <Button
          onClick={handleCreateCommunity}
          className="flex-1 min-w-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>

        {/* Search Communities Button */}
        <Button
          onClick={() => setSearchModalOpen(true)}
          variant="outline"
          className="flex-1 min-w-0 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Search className="w-4 h-4 mr-2" />
          Search Communities
        </Button>
      </div>

      {/* Selected Community Display */}
      {selectedCommunity && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{selectedCommunity.icon}</span>
            <div className="flex-1">
              <div className="font-medium text-blue-900 dark:text-blue-100">
                Selected: {selectedCommunity.name}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {selectedCommunity.description}
              </div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {selectedCommunity.memberCount}
            </div>
          </div>
        </div>
      )}

      {/* No Communities State */}
      {isAuthenticated && userCommunities.length === 0 && !selectedCommunity && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
          <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-sm text-slate-600 dark:text-slate-400">
            You don't have any communities yet.
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500">
            Create your first community or search for existing ones to join.
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateCommunityModal 
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCommunityCreated={handleCommunityCreated}
      />
      
      <SearchCommunitiesModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onCommunitySelect={onCommunitySelect}
        selectedCommunityId={selectedCommunityId}
      />
    </div>
  );
} 