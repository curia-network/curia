/**
 * CommunitySelectionStep - Community selection and joining
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, ArrowRight, Crown, Globe, Lock, Loader2, Info, MessageSquare, Search, SortAsc, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunitySelectionStepProps } from '@/types/embed';
import { Community } from '@/types/embed';
import { toast } from 'sonner';

export const CommunitySelectionStep: React.FC<CommunitySelectionStepProps> = ({ 
  onCommunitySelected, 
  config,
  sessionToken
}) => {
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [userCommunities, setUserCommunities] = useState<Community[]>([]);
  const [availableCommunities, setAvailableCommunities] = useState<Community[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoLoadingCommunity, setAutoLoadingCommunity] = useState<{ id: string; name: string; icon: string; gradientClass: string; logoUrl?: string | null } | null>(null);
  const [shownToastFor, setShownToastFor] = useState<string | null>(null);
  
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOption, setSortOption] = useState<'most_active' | 'recently_created'>('most_active');

  // Filter and sort available communities
  const filteredAndSortedCommunities = useMemo(() => {
    let filtered = availableCommunities;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(query) ||
        community.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortOption === 'most_active') {
        // Sort by member count (descending), then by name
        if (a.memberCount !== b.memberCount) {
          return b.memberCount - a.memberCount;
        }
        return a.name.localeCompare(b.name);
      } else if (sortOption === 'recently_created') {
        // Sort by created date (descending), then by name
        const aDate = new Date(a.createdAt || 0);
        const bDate = new Date(b.createdAt || 0);
        if (aDate.getTime() !== bDate.getTime()) {
          return bDate.getTime() - aDate.getTime();
        }
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return sorted;
  }, [availableCommunities, searchQuery, sortOption]);

  // Fetch communities from database
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get session token from prop or localStorage as fallback
        const token = sessionToken || localStorage.getItem('curia_session_token');
        
        // Prepare headers with authentication if available
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('[CommunitySelectionStep] Using session token for authenticated request');
        }
        
        const response = await fetch('/api/communities', { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch communities: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Handle the new response structure
        setUserCommunities(data.userCommunities || []);
        setAvailableCommunities(data.availableCommunities || data.communities || []);
        setIsAuthenticated(data.isAuthenticated || false);
        
        console.log('[CommunitySelectionStep] Fetched communities:', {
          userCommunities: data.userCommunities?.length || 0,
          availableCommunities: data.availableCommunities?.length || data.communities?.length || 0,
          isAuthenticated: data.isAuthenticated || false
        });
        
        // Auto-skip logic: If config.community is provided, validate and auto-select if exists
        if (config.community) {
          const allCommunities = [...(data.userCommunities || []), ...(data.availableCommunities || data.communities || [])];
          const targetCommunity = allCommunities.find(c => c.id === config.community);
          
          if (targetCommunity) {
            // Community exists → show loading state and auto-skip
            console.log(`[CommunitySelectionStep] Auto-loading community: ${targetCommunity.name}`);
            setAutoLoadingCommunity({ 
              id: config.community, 
              name: targetCommunity.name,
              icon: targetCommunity.icon,
              gradientClass: targetCommunity.gradientClass,
              logoUrl: targetCommunity.logoUrl
            });
            setSelectedCommunity(config.community);
            
            // Auto-trigger join after a brief moment to show loading state
            setTimeout(() => {
              if (config.community) {
                handleJoinCommunity(config.community);
              }
            }, 1000);
          } else {
            // Community doesn't exist → show info toast and normal UI (only once)
            if (shownToastFor !== config.community) {
              console.log(`[CommunitySelectionStep] Community '${config.community}' not found, showing selection UI`);
              setShownToastFor(config.community);
              toast.info(`Community '${config.community}' not found`, {
                description: 'Please select an available community from the list below.',
                icon: <Info className="w-4 h-4" />,
                duration: 4000
              });
            }
          }
        }
      } catch (err) {
        console.error('[CommunitySelectionStep] Error fetching communities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load communities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunities();
  }, [sessionToken, config.community]);

  const handleJoinCommunity = async (communityId: string) => {
    if (!communityId) return;
    
    setIsJoining(true);
    
    try {
      // TODO: Join community API call
      console.log(`[Embed] Joining community: ${communityId}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Pass the selected community ID to the parent
      onCommunitySelected(communityId);
    } catch (error) {
      console.error('[Embed] Error joining community:', error);
      setIsJoining(false);
    }
  };

  // Show auto-loading state for direct community access
  if (autoLoadingCommunity) {
    return (
      <div className="embed-step">
        <Card className="embed-card embed-card--lg">
                     <CardHeader className="text-center pb-6">
             <div className="flex justify-center mb-6">
               <div className={cn("embed-header-icon animate-pulse", autoLoadingCommunity.logoUrl ? "" : autoLoadingCommunity.gradientClass)}>
                 {autoLoadingCommunity.logoUrl ? (
                   <img 
                     src={autoLoadingCommunity.logoUrl} 
                     alt={autoLoadingCommunity.name}
                     className="w-16 h-16 rounded-full object-cover"
                   />
                 ) : (
                   <span className="text-3xl">{autoLoadingCommunity.icon}</span>
                 )}
               </div>
             </div>
            <CardTitle className="text-2xl embed-gradient-text mb-4">
              Entering {autoLoadingCommunity.name}
            </CardTitle>
            <CardDescription className="text-base mb-6">
              Taking you to your community forum...
            </CardDescription>
            
                         {/* Animated Loading Indicator */}
             <div className="flex justify-center">
               <div className="flex items-center gap-2">
                 <div className="flex space-x-1">
                   <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                 </div>
               </div>
             </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="embed-step">
      <Card className="embed-card embed-card--lg">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="embed-header-icon gradient-purple-pink">
              <Users className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl embed-gradient-text">
            Choose Your Community
          </CardTitle>
          <CardDescription className="text-base">
            Select a community to join the conversation
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading communities...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="text-sm"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Communities Content */}
          {!isLoading && !error && (
            <>
              {/* No Communities Found */}
              {userCommunities.length === 0 && availableCommunities.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-4">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No communities found</p>
                    <p className="text-sm">There are no public communities available at the moment.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="mt-4"
                  >
                    Refresh
                  </Button>
                </div>
              )}

              {/* User's Communities Section */}
              {userCommunities.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-lg">Your Communities</h3>
                    <Badge variant="secondary" className="text-xs">
                      {userCommunities.length}
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {userCommunities.map((community: Community) => (
                      <Card key={community.id} className="auth-option-card">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            {/* Community Icon */}
                            <div className={cn("auth-option-icon", community.logoUrl ? "" : community.gradientClass)}>
                              {community.logoUrl ? (
                                <img 
                                  src={community.logoUrl} 
                                  alt={community.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-xl">{community.icon}</span>
                              )}
                            </div>
                            
                            {/* Community Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-semibold text-foreground">
                                  {community.name}
                                </h4>
                                <Badge variant="outline" className="text-xs">
                                  <Globe className="w-3 h-3 mr-1" />
                                  {community.userRole}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{community.memberCount.toLocaleString()} members</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              onClick={() => {
                                setSelectedCommunity(community.id);
                                handleJoinCommunity(community.id);
                              }}
                              disabled={isJoining && selectedCommunity === community.id}
                              className={cn(
                                "auth-option-button btn-gradient-green-blue"
                              )}
                            >
                              {isJoining && selectedCommunity === community.id ? (
                                <div className="loading-spinner border-white" />
                              ) : (
                                <ArrowRight className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Communities Section */}
              {availableCommunities.length > 0 && (
                <div className="mb-6">
                  {userCommunities.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">Explore Communities</h3>
                      <Badge variant="outline" className="text-xs">
                        {filteredAndSortedCommunities.length}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search communities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as 'most_active' | 'recently_created')}
                        className="pl-10 pr-10 py-2 text-sm border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring min-w-[160px] appearance-none cursor-pointer"
                      >
                        <option value="most_active">Most Active</option>
                        <option value="recently_created">Recently Created</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  {/* No results message */}
                  {filteredAndSortedCommunities.length === 0 && searchQuery.trim() && (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No communities found matching "{searchQuery}"</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear search
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid gap-4">
                    {filteredAndSortedCommunities.map((community: Community) => (
                      <Card key={community.id} className="auth-option-card">
                        <CardContent className="p-5">
                          <div className="flex items-center space-x-4">
                            {/* Community Icon */}
                            <div className={cn("auth-option-icon", community.logoUrl ? "" : community.gradientClass)}>
                              {community.logoUrl ? (
                                <img 
                                  src={community.logoUrl} 
                                  alt={community.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{community.icon}</span>
                              )}
                            </div>
                            
                            {/* Community Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-foreground text-lg">
                                  {community.name}
                                </h3>
                                {community.isPublic ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <Globe className="w-3 h-3 mr-1" />
                                    Public
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Private
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                                {community.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{community.memberCount.toLocaleString()} members</span>
                                </div>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              onClick={() => {
                                setSelectedCommunity(community.id);
                                handleJoinCommunity(community.id);
                              }}
                              disabled={isJoining && selectedCommunity === community.id}
                              className={cn(
                                "auth-option-button btn-gradient-blue-cyan"
                              )}
                            >
                              {isJoining && selectedCommunity === community.id ? (
                                <div className="loading-spinner border-white" />
                              ) : (
                                <ArrowRight className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Featured Community Banner (if configured) */}
              {config.community && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 className="font-medium text-foreground">Recommended Community</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on where you're visiting from
                      </p>
                    </div>
                  </div>
                </div>
              )}


            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 