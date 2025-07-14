'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Users, Globe, Lock, Check } from 'lucide-react';
import { useCommunities } from '@/hooks/useCommunities';

interface SearchCommunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunitySelect: (communityId: string) => void;
  selectedCommunityId: string | null;
}

export function SearchCommunitiesModal({
  isOpen,
  onClose,
  onCommunitySelect,
  selectedCommunityId
}: SearchCommunitiesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: communitiesData, isLoading } = useCommunities(false); // Always fetch all public communities

  const allCommunities = [
    ...(communitiesData?.userCommunities || []),
    ...(communitiesData?.availableCommunities || [])
  ];

  // Filter communities based on search query
  const filteredCommunities = allCommunities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (communityId: string) => {
    onCommunitySelect(communityId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Communities
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name or description..."
              className="pl-10"
            />
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <div className="text-sm text-slate-500">Loading communities...</div>
              </div>
            ) : filteredCommunities.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {searchQuery ? 'No communities found matching your search.' : 'No communities available.'}
                </div>
              </div>
            ) : (
              filteredCommunities.map((community) => (
                <div
                  key={community.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedCommunityId === community.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleSelect(community.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Community Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{community.icon}</span>
                    </div>

                    {/* Community Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {community.name}
                        </div>
                        <div className="flex items-center gap-1">
                          {community.isPublic ? (
                            <Globe className="w-3 h-3 text-green-500" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-500" />
                          )}
                          {community.isMember && (
                            <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                              Member
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {community.description}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
                        </div>
                        {community.userRole && (
                          <div className="flex items-center gap-1">
                            Role: {community.userRole}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selection Indicator */}
                    {selectedCommunityId === community.id && (
                      <div className="flex-shrink-0">
                        <Check className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            {selectedCommunityId && (
              <Button
                onClick={onClose}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Selected Community
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 