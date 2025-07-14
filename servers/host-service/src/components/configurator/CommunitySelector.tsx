'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, ChevronDown, Search, Building, Users } from 'lucide-react';
import { CreateCommunityModal } from './CreateCommunityModal';
import { SearchCommunitiesModal } from './SearchCommunitiesModal';
import { useCommunities } from '@/hooks/useCommunities';

interface CommunitySelectorProps {
  selectedCommunityId: string | null;
  onCommunitySelect: (communityId: string) => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export function CommunitySelector({
  selectedCommunityId,
  onCommunitySelect,
  isAuthenticated,
  onAuthRequired
}: CommunitySelectorProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  
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

  const handleCreateCommunity = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setCreateModalOpen(true);
  };

  const handleCommunityCreated = (newCommunity: any) => {
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

        {/* My Communities Dropdown - Conditional */}
        {isAuthenticated && userCommunities.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-0 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Building className="w-4 h-4 mr-2" />
                My Communities
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {userCommunities.map((community) => (
                <DropdownMenuItem 
                  key={community.id}
                  onClick={() => onCommunitySelect(community.id)}
                  className="flex items-center gap-3 p-3 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{community.icon}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {community.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {community.memberCount} members · {community.userRole}
                      </div>
                    </div>
                  </div>
                  {selectedCommunityId === community.id && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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