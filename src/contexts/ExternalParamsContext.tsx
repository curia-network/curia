'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ExternalParamsContextType {
  externalParams: Record<string, string>;
  hasExternalParams: boolean;
  getParam: (key: string) => string | undefined;
  processedParams: string[];
}

const ExternalParamsContext = createContext<ExternalParamsContextType | undefined>(undefined);

export function useExternalParams() {
  const context = useContext(ExternalParamsContext);
  if (context === undefined) {
    throw new Error('useExternalParams must be used within an ExternalParamsProvider');
  }
  return context;
}

interface ExternalParamsProviderProps {
  children: ReactNode;
}

// Interface for resolved navigation target
interface ResolvedNavigationTarget {
  boardId: number;
  postId?: number;
  communityShortId: string;
  pluginId: string;
}

export function ExternalParamsProvider({ children }: ExternalParamsProviderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [externalParams, setExternalParams] = useState<Record<string, string>>({});
  const [processedParams, setProcessedParams] = useState<string[]>([]);

  // Parse all ext_ parameters on mount and when searchParams change
  useEffect(() => {
    const extParams: Record<string, string> = {};
    
    if (searchParams) {
      searchParams.forEach((value, key) => {
        if (key.startsWith('ext_')) {
          extParams[key] = value;
        }
      });
    }
    
    setExternalParams(extParams);
    
    // Enhanced logging with easy filtering
    const paramCount = Object.keys(extParams).length;
    if (paramCount > 0) {
      console.log(`🔧 [EXT_PARAMS] Found ${paramCount} external parameter(s):`);
      Object.entries(extParams).forEach(([key, value]) => {
        console.log(`🔧 [EXT_PARAMS] ${key} = "${value}"`);
      });
    } else {
      console.log(`🔧 [EXT_PARAMS] No external parameters found`);
    }
    
  }, [searchParams]);

  // Process external parameters when user context is available
  useEffect(() => {
    if (!user || !token) {
      console.log(`🔧 [EXT_PARAMS] Waiting for user authentication before processing...`);
      return;
    }

    const unprocessedParams = Object.entries(externalParams).filter(
      ([key]) => !processedParams.includes(key)
    );

    if (unprocessedParams.length === 0) {
      return;
    }

    console.log(`🔧 [EXT_PARAMS] Processing ${unprocessedParams.length} parameter(s) with user context:`, {
      userId: user.userId,
      isAdmin: user.isAdmin,
      communityId: user.cid
    });

    // Process each unprocessed parameter
    unprocessedParams.forEach(([key, value]) => {
      processExternalParam(key, value, user, token);
    });

    // Mark these parameters as processed
    setProcessedParams(prev => [...prev, ...unprocessedParams.map(([key]) => key)]);

  }, [externalParams, user, token, processedParams]);

  // Resolution function using links table
  const resolveNavigationTarget = async (
    communityShortId: string,
    boardSlug: string,
    postSlug?: string
  ): Promise<ResolvedNavigationTarget | null> => {
    try {
      console.log(`🔧 [EXT_PARAMS] Resolving navigation target: community=${communityShortId}, board=${boardSlug}, post=${postSlug}`);
      
      // Build semantic URL path for resolution
      const semanticPath = postSlug 
        ? `/c/${communityShortId}/${boardSlug}/${postSlug}`
        : `/c/${communityShortId}/${boardSlug}`;
      
      // Use the semantic URL resolution endpoint (public endpoint, no auth needed)
      const response = await fetch(`/api/links/resolve?path=${encodeURIComponent(semanticPath)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        boardId: data.boardId,
        postId: data.postId,
        communityShortId: data.communityShortId,
        pluginId: data.pluginId
      };
      
    } catch (error) {
      console.error('🔧 [EXT_PARAMS] Failed to resolve navigation target:', error);
      return null;
    }
  };

  // Main processing function for external parameters
  const processExternalParam = async (key: string, value: string, userContext: typeof user, tokenContext: string) => {
    console.log(`🔧 [EXT_PARAMS] Processing: ${key} = "${value}"`);
    
    // Add your processing logic here based on parameter type
    switch (key) {
      case 'ext_community':
      case 'ext_board':
      case 'ext_post':
        // Handle navigation parameters - trigger navigation attempt
        // Use setTimeout to let all parameters be processed first
        setTimeout(() => {
          handleNavigation();
        }, 100);
        break;
      
      case 'ext_navigate':
        console.log(`🔧 [EXT_PARAMS] Navigation requested: ${value}`);
        console.log(`🔧 [EXT_PARAMS] User context available:`, !!userContext);
        // TODO: Implement legacy navigation logic for ext_navigate parameter
        break;
      
      case 'ext_highlight':
        console.log(`🔧 [EXT_PARAMS] Highlight requested: ${value}`);
        console.log(`🔧 [EXT_PARAMS] User context available:`, !!userContext);
        // TODO: Implement highlight logic
        break;
      
      case 'ext_action':
        console.log(`🔧 [EXT_PARAMS] Action requested: ${value}`);
        console.log(`🔧 [EXT_PARAMS] User context available:`, !!userContext);
        console.log(`🔧 [EXT_PARAMS] Token available:`, !!tokenContext);
        // TODO: Implement action logic
        break;
      
      case 'ext_filter':
        console.log(`🔧 [EXT_PARAMS] Filter requested: ${value}`);
        console.log(`🔧 [EXT_PARAMS] User context available:`, !!userContext);
        // TODO: Implement filter logic
        break;
      
      default:
        console.log(`🔧 [EXT_PARAMS] Unknown parameter type: ${key}`);
        console.log(`🔧 [EXT_PARAMS] User context available:`, !!userContext);
        // TODO: Handle unknown parameter types
        break;
    }
  };

  // Handle navigation when community/board/post parameters are available
  const handleNavigation = async () => {
    const communityId = getParam('ext_community');
    const boardId = getParam('ext_board');
    const postId = getParam('ext_post');
    
    if (!communityId || !boardId) {
      console.log('🔧 [EXT_PARAMS] Insufficient navigation parameters - need at least community and board');
      return;
    }

    console.log(`🔧 [EXT_PARAMS] Attempting navigation with params: community=${communityId}, board=${boardId}, post=${postId}`);

    try {
      // Resolve navigation target using links table
      const resolved = await resolveNavigationTarget(communityId, boardId, postId);
      
      if (!resolved) {
        console.error('🔧 [EXT_PARAMS] Failed to resolve navigation target');
        return;
      }

      console.log(`🔧 [EXT_PARAMS] Resolved navigation target:`, resolved);

      // Navigate to the resolved target
      if (resolved.postId) {
        const postUrl = `/board/${resolved.boardId}/post/${resolved.postId}`;
        console.log(`🔧 [EXT_PARAMS] Navigating to post: ${postUrl}`);
        router.push(postUrl);
      } else {
        const boardUrl = `/?boardId=${resolved.boardId}`;
        console.log(`🔧 [EXT_PARAMS] Navigating to board: ${boardUrl}`);
        router.push(boardUrl);
      }

    } catch (error) {
      console.error('🔧 [EXT_PARAMS] Navigation failed:', error);
    }
  };

  // Helper function to get a specific parameter
  const getParam = (key: string): string | undefined => {
    return externalParams[key];
  };

  const hasExternalParams = Object.keys(externalParams).length > 0;

  const value = {
    externalParams,
    hasExternalParams,
    getParam,
    processedParams,
  };

  return (
    <ExternalParamsContext.Provider value={value}>
      {children}
    </ExternalParamsContext.Provider>
  );
} 