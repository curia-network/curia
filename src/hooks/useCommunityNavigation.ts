'use client';

import { useState } from 'react';
import { useCgLib } from '@/contexts/CgLibContext';
import { useToast } from '@/hooks/use-toast';

export interface CommunityNavigationOptions {
  communityName?: string;
  logoUrl?: string;
  // Future options can be added here (boardId, postId, etc.)
}

export interface CommunityNavigationResult {
  navigateToCommunity: (communityId: string, options?: CommunityNavigationOptions) => Promise<void>;
  navigatingTo: string | null;
  isNavigating: boolean;
}

/**
 * Generic Community Navigation Hook
 * 
 * Provides reusable community switching functionality using the new switchCommunity() API.
 * Replaces the deprecated cg.navigate() method with modern, clean implementation.
 * 
 * Features:
 * - Simple community switching by ID
 * - Loading states with community branding
 * - Error handling with user feedback
 * - Reusable across partner communities, search results, mentions, etc.
 * 
 * @example
 * ```typescript
 * const { navigateToCommunity, navigatingTo } = useCommunityNavigation();
 * 
 * // Simple navigation
 * await navigateToCommunity('community-123');
 * 
 * // With branding options
 * await navigateToCommunity('community-123', {
 *   communityName: 'Partner Community',
 *   logoUrl: 'https://example.com/logo.png'
 * });
 * ```
 */
export const useCommunityNavigation = (): CommunityNavigationResult => {
  const { cgInstance } = useCgLib();
  const { toast } = useToast();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const navigateToCommunity = async (
    communityId: string, 
    options: CommunityNavigationOptions = {}
  ): Promise<void> => {
    // Basic validation
    if (!communityId) {
      toast({
        title: "Navigation Error",
        description: "Community ID is required",
        variant: "destructive"
      });
      return;
    }

    if (!cgInstance) {
      toast({
        title: "Navigation Error", 
        description: "Community switcher not available",
        variant: "destructive"
      });
      return;
    }

    // Check if switchCommunity method exists
    if (typeof cgInstance.switchCommunity !== 'function') {
      toast({
        title: "Feature Not Available",
        description: "Community switching is not supported in this version",
        variant: "destructive"
      });
      console.error('[useCommunityNavigation] switchCommunity method not found on cgInstance');
      return;
    }

    // Set loading state
    setNavigatingTo(communityId);

    // Show loading feedback with community branding if available
    const loadingMessage = options.communityName 
      ? `Switching to ${options.communityName}...`
      : 'Switching community...';

    toast({
      title: "Navigating",
      description: loadingMessage,
    });

    try {
      console.log(`[useCommunityNavigation] Switching to community: ${communityId}`, options);
      
      const result = await cgInstance.switchCommunity(communityId);
      
      // Success feedback
      const successMessage = result?.data?.communityInfo?.name 
        ? `Switched to ${result.data.communityInfo.name}`
        : 'Successfully switched community';

      toast({
        title: "Success!",
        description: successMessage,
      });

      console.log('[useCommunityNavigation] Community switch successful:', result);
      
    } catch (error) {
      console.error('[useCommunityNavigation] Community switch failed:', error);
      
      // Enhanced error handling
      let errorMessage = 'Failed to switch community';
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('not found')) {
          errorMessage = options.communityName 
            ? `Community "${options.communityName}" not found or not accessible`
            : 'Community not found or not accessible';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Access denied to community';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error - please try again';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Navigation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
    } finally {
      setNavigatingTo(null);
    }
  };

  return {
    navigateToCommunity,
    navigatingTo,
    isNavigating: navigatingTo !== null
  };
}; 