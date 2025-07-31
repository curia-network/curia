'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authFetchJson } from '@/utils/authFetch';
import { CommunitySelector } from '@/components/whats-new/CommunitySelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Globe, MessageSquare, Heart, Plus, Loader2, Filter, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimeSince } from '@/utils/timeUtils';
import Link from 'next/link';
import { buildPostUrl } from '@/utils/urlBuilder';
import { useCrossCommunityNavigation } from '@/hooks/useCrossCommunityNavigation';
import { MarkdownUtils } from '@/utils/markdownUtils';
import { extractDescription } from '@/utils/metadataUtils';

// Types from the existing What's New page
interface ActivityItem {
  post_id: number;
  board_id: number;
  community_id: string;
  community_short_id?: string;
  plugin_id?: string;
  post_title: string;
  post_content?: string;
  post_created_at: string;
  author_name: string;
  author_avatar?: string;
  board_name: string;
  comment_id?: number;
  comment_content?: string;
  comment_created_at?: string;
  commenter_name?: string;
  commenter_avatar?: string;
  reaction_id?: number;
  reaction_created_at?: string;
  reactor_name?: string;
  reactor_avatar?: string;
  emoji?: string;
  content_type?: string;
  comment_preview?: string;
  is_new: boolean;
}

interface WhatsNewResponse {
  success: boolean;
  data: ActivityItem[];
  pagination: {
    hasMore: boolean;
  };
  isFirstTimeUser?: boolean;
  message?: string;
  totalCounts: {
    commentsOnMyPosts: number;
    commentsOnPostsICommented: number;
    reactionsOnMyContent: number;
    newPostsInActiveBoards: number;
  };
  newCounts: {
    commentsOnMyPosts: number;
    commentsOnPostsICommented: number;
    reactionsOnMyContent: number;
    newPostsInActiveBoards: number;
  };
}

export function WhatsNewContent() {
  const { token, user } = useAuth();
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>(user?.cid || '');
  const [showOnlyNew, setShowOnlyNew] = useState(false);

  // Update selected community when user data loads
  useEffect(() => {
    if (user?.cid && !selectedCommunityId) {
      setSelectedCommunityId(user.cid);
    }
  }, [user?.cid, selectedCommunityId]);

  // Fetch unified activity feed (simplified from the complex categorization)
  const { data: activityData, isLoading } = useQuery<WhatsNewResponse>({
    queryKey: ['whatsNewUnified', selectedCommunityId, showOnlyNew],
    queryFn: async () => {
      if (!selectedCommunityId || !token) {
        throw new Error('Authentication required');
      }
      
      const params = new URLSearchParams({
        limit: '50', // Get more items for unified feed
        offset: '0',
        ...(showOnlyNew && { showOnlyNew: 'true' }),
        ...(selectedCommunityId !== user?.cid && { communityId: selectedCommunityId })
      });
      
      const url = `/api/me/whats-new?${params}`;
      return authFetchJson<WhatsNewResponse>(url, { token });
    },
    enabled: !!(selectedCommunityId && token),
    staleTime: 30000, // 30 seconds
  });

  // Helper function to generate content preview
  const generateContentPreview = (content: string | undefined): string => {
    if (!content) return '';
    
    // Check if it's legacy JSON format
    if (MarkdownUtils.isLegacyJSON(content)) {
      return "left a comment"; // Placeholder for complex content
    }
    
    // For markdown content, generate a preview
    const preview = extractDescription(content, 80); // Shorter for modal
    return preview || "left a comment";
  };

  // Simplified activity item component optimized for modal
  const ActivityItem = ({ item }: { item: ActivityItem }) => {
    const { navigateToPost } = useCrossCommunityNavigation();
    const [isNavigating, setIsNavigating] = useState(false);
    const isNew = item.is_new;
    const isCrossCommunity = item.community_id !== user?.cid;
    const timeSince = useTimeSince(item.comment_created_at || item.post_created_at || item.reaction_created_at || '');

    // Build URL for same-community navigation
    let postUrl = buildPostUrl(item.post_id, item.board_id);
    if (item.comment_id) {
      postUrl += `#comment-${item.comment_id}`;
    }

    // Handle click for cross-community navigation
    const handleClick = async (e: React.MouseEvent) => {
      if (!isCrossCommunity) return;
      
      e.preventDefault();
      
      if (!item.community_short_id || !item.plugin_id) {
        console.warn('Missing metadata for cross-community navigation:', item);
        return;
      }
      
      setIsNavigating(true);
      await navigateToPost(
        item.community_short_id,
        item.plugin_id,
        item.post_id,
        item.board_id
      );
      setIsNavigating(false);
    };

    // Determine the main user and activity details
    let actorName = '';
    let actorAvatar = '';
    let actorFallback = '';
    let activityText = '';
    let contentPreview = '';
    let activityIcon: React.ReactNode;

    if (item.comment_id) {
      // Comment activity
      actorName = item.commenter_name || 'Unknown User';
      actorAvatar = item.commenter_avatar || '';
      actorFallback = actorName.substring(0, 2).toUpperCase();
      activityText = 'commented on';
      contentPreview = generateContentPreview(item.comment_content);
      activityIcon = <MessageSquare size={12} className="text-blue-500" />;
    } else if (item.reaction_id) {
      // Reaction activity  
      actorName = item.reactor_name || 'Unknown User';
      actorAvatar = item.reactor_avatar || '';
      actorFallback = actorName.substring(0, 2).toUpperCase();
      const emoji = item.emoji || '👍';
      activityText = `reacted ${emoji} to`;
      contentPreview = item.content_type === 'comment' && item.comment_preview 
                 ? `"${item.comment_preview}..."` 
                 : '';
      activityIcon = <Heart size={12} className="text-red-500" />;
    } else {
      // New post activity
      actorName = item.author_name || 'Unknown User';
      actorAvatar = item.author_avatar || '';
      actorFallback = actorName.substring(0, 2).toUpperCase();
      activityText = 'created a new post';
      contentPreview = generateContentPreview(item.post_content);
      activityIcon = <Plus size={12} className="text-green-500" />;
    }

    const cardContent = (
      <div className={cn(
        "p-3 border rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer",
        isNew 
          ? 'bg-background border-primary/20 hover:border-primary/30' 
          : 'bg-muted/30 border-muted-foreground/20 opacity-75 hover:opacity-90'
      )}>
        <div className="flex items-start gap-3 min-w-0">
          {/* Profile Picture */}
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarImage src={actorAvatar} alt={actorName} />
            <AvatarFallback className="text-[10px] font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {actorFallback}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            {/* Header with activity type and NEW badge */}
            <div className="flex items-center gap-1.5 min-w-0">
              {activityIcon}
              {isNew && (
                <Badge variant="default" className="h-4 px-1.5 text-[10px] font-semibold bg-green-500 hover:bg-green-600">
                  NEW
                </Badge>
              )}
              {isCrossCommunity && (
                <Badge variant="outline" className="h-4 px-1.5 text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  <Globe className="h-2 w-2 mr-1" />
                  Cross
                </Badge>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {item.board_name}
              </span>
            </div>

            {/* Main activity text */}
            <div className="text-sm">
              <span className="font-medium">{actorName}</span>
              <span className="text-muted-foreground"> {activityText} </span>
              <span className="font-medium text-primary hover:underline">
                {item.post_title}
              </span>
            </div>

            {/* Content preview */}
            {contentPreview && (
              <div className="text-xs text-muted-foreground italic truncate">
                {contentPreview}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-muted-foreground">
              {timeSince}
            </div>
          </div>

          {/* Loading indicator for cross-community navigation */}
          {isNavigating && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </div>
    );

    // Wrap in Link for same-community, div for cross-community
    if (isCrossCommunity) {
      return <div onClick={handleClick}>{cardContent}</div>;
    }

    return <Link href={postUrl}>{cardContent}</Link>;
  };

  // Loading skeleton for modal
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-3 border rounded-lg bg-muted/30 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-7 w-7 bg-muted rounded-full flex-shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-8 bg-muted rounded"></div>
                <div className="h-3 w-16 bg-muted rounded"></div>
              </div>
              <div className="h-3 w-3/4 bg-muted rounded"></div>
              <div className="h-2 w-1/2 bg-muted rounded"></div>
              <div className="h-2 w-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Sign in required to view notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activities = activityData?.data || [];
  const totalNew = (activityData?.newCounts?.commentsOnMyPosts || 0) + 
                  (activityData?.newCounts?.commentsOnPostsICommented || 0) + 
                  (activityData?.newCounts?.reactionsOnMyContent || 0) + 
                  (activityData?.newCounts?.newPostsInActiveBoards || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header with community selector and filter */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4 space-y-3">
        {/* Community Selector - Compact for modal */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Community:</span>
          <div className="flex items-center gap-2">
            <CommunitySelector
              currentCommunityId={selectedCommunityId}
              onCommunityChange={setSelectedCommunityId}
              className="flex-1 min-w-0 text-sm"
            />
            {selectedCommunityId !== user?.cid && (
              <Badge variant="outline" className="flex-shrink-0 text-xs">
                <Globe className="h-2 w-2 mr-1" />
                Cross
              </Badge>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Button
              variant={showOnlyNew ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyNew(!showOnlyNew)}
              className="gap-1.5 h-7 px-2 text-xs"
              aria-label={showOnlyNew ? "Show all activities" : "Show only new activities"}
            >
              {showOnlyNew ? (
                <>
                  <Eye size={12} />
                  All
                </>
              ) : (
                <>
                  <EyeOff size={12} />
                  New
                </>
              )}
            </Button>
          </div>
          
          {totalNew > 0 && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-xs">
              {totalNew} new
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" role="main" aria-label="Activity feed">
        {isLoading ? (
          <LoadingSkeleton />
        ) : activities.length > 0 ? (
          <>
            {activities.map((item, index) => (
              <ActivityItem 
                key={`${item.post_id}-${item.comment_id || item.reaction_id || index}`} 
                item={item} 
              />
            ))}
            
            {/* Load more button if there are more items */}
            {activityData?.pagination?.hasMore && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement load more functionality
                    console.log('Load more clicked');
                  }}
                  className="gap-2"
                >
                  <Plus size={14} />
                  Load More
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {showOnlyNew ? 'No new activity' : 'No activity yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCommunityId !== user?.cid 
                  ? 'Try switching to your home community'
                  : 'Check back later for updates'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}