/**
 * URL Builder Utilities for Enhanced Notifications & Navigation
 * 
 * These utilities help build URLs for posts and boards while preserving
 * Common Ground plugin parameters (cg_theme, cg_bg_color, etc.)
 */

/**
 * Response from /api/links API endpoint
 */
interface CreateSemanticUrlResponse {
  id: number;
  url: string;
  slug: string;
  shareToken: string;
  expiresAt?: string;
  isExisting: boolean;
}

/**
 * Builds a URL to a specific post detail page
 * @param postId - The ID of the post
 * @param boardId - The ID of the board the post belongs to
 * @param preserveParams - Whether to preserve current URL parameters (default: true)
 * @returns Complete URL string for the post detail page
 */
export function buildPostUrl(postId: number, boardId: number, preserveParams: boolean = true): string {
  const baseUrl = `/board/${boardId}/post/${postId}`;
  
  if (!preserveParams || typeof window === 'undefined') {
    return baseUrl;
  }
  
  // Preserve Common Ground params (cg_theme, cg_bg_color, etc.)
  const searchParams = new URLSearchParams(window.location.search);
  const cgParams = new URLSearchParams();
  
  searchParams.forEach((value, key) => {
    if (key.startsWith('cg_')) {
      cgParams.set(key, value);
    }
  });
  
  return cgParams.toString() ? `${baseUrl}?${cgParams.toString()}` : baseUrl;
}

/**
 * Builds a URL to a specific board (home page filtered by board)
 * @param boardId - The ID of the board
 * @param preserveParams - Whether to preserve current URL parameters (default: true)
 * @returns Complete URL string for the board view
 */
export function buildBoardUrl(boardId: number, preserveParams: boolean = true): string {
  const baseUrl = `/?boardId=${boardId}`;
  
  if (!preserveParams || typeof window === 'undefined') {
    return baseUrl;
  }
  
  // Preserve Common Ground params (cg_theme, cg_bg_color, etc.)
  const searchParams = new URLSearchParams(window.location.search);
  const cgParams = new URLSearchParams();
  
  searchParams.forEach((value, key) => {
    if (key.startsWith('cg_') || key === 'boardId') {
      cgParams.set(key, value);
    }
  });
  
  // Override boardId with the new one
  cgParams.set('boardId', boardId.toString());
  
  return `/?${cgParams.toString()}`;
}

/**
 * Builds the home URL while preserving Common Ground parameters
 * @param preserveParams - Whether to preserve current URL parameters (default: true)
 * @returns Complete URL string for the home page
 */
export function buildHomeUrl(preserveParams: boolean = true): string {
  if (!preserveParams || typeof window === 'undefined') {
    return '/';
  }
  
  // Preserve Common Ground params (excluding boardId to go to true home)
  const searchParams = new URLSearchParams(window.location.search);
  const cgParams = new URLSearchParams();
  
  searchParams.forEach((value, key) => {
    if (key.startsWith('cg_') && key !== 'boardId') {
      cgParams.set(key, value);
    }
  });
  
  return cgParams.toString() ? `/?${cgParams.toString()}` : '/';
}

/**
 * Preserves Common Ground parameters when building any URL
 * @param baseUrl - The base URL to append parameters to
 * @param additionalParams - Additional parameters to include
 * @returns Complete URL with preserved CG parameters
 */
export function preserveCgParams(baseUrl: string, additionalParams: Record<string, string> = {}): string {
  if (typeof window === 'undefined') {
    return baseUrl;
  }
  
  const url = new URL(baseUrl, window.location.origin);
  const searchParams = new URLSearchParams(window.location.search);
  
  // Add Common Ground params
  searchParams.forEach((value, key) => {
    if (key.startsWith('cg_')) {
      url.searchParams.set(key, value);
    }
  });
  
  // Add additional params
  Object.entries(additionalParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.pathname + (url.search ? url.search : '');
}

/**
 * Extracts Common Ground parameters from current URL
 * @returns Object containing all CG parameters
 */
export function getCgParams(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const searchParams = new URLSearchParams(window.location.search);
  const cgParams: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    if (key.startsWith('cg_')) {
      cgParams[key] = value;
    }
  });
  
  return cgParams;
}

/**
 * Builds an external shareable URL using semantic URLs when possible
 * Falls back to legacy URLs during transition or when semantic URL generation fails
 * @param postId - The ID of the post
 * @param boardId - The ID of the board the post belongs to
 * @param communityShortId - The community short ID for URL construction
 * @param pluginId - The plugin ID for URL construction
 * @param postTitle - The post title for semantic URL generation
 * @param boardName - The board name for semantic URL generation
 * @param useSemanticUrl - Whether to attempt semantic URL generation (default: true)
 * @returns Promise resolving to external URL
 */
export async function buildExternalShareUrl(
  postId: number, 
  boardId: number, 
  communityShortId?: string, 
  pluginId?: string,
  postTitle?: string,
  boardName?: string,
  useSemanticUrl: boolean = true,
  communityHostingUrl?: string
): Promise<string> {
  // Prioritize community hosting URL over env var
  const baseUrl = communityHostingUrl || process.env.NEXT_PUBLIC_PLUGIN_BASE_URL;
  
  if (!baseUrl) {
    console.warn('[buildExternalShareUrl] No hosting URL configured (community or env var), falling back to internal URL');
    return buildPostUrl(postId, boardId, false);
  }
  
  // Try to generate semantic URL if all data available and enabled
  if (useSemanticUrl && communityShortId && pluginId && postTitle && boardName) {
    try {
      console.log(`[buildExternalShareUrl] Attempting to create semantic URL for post ${postId}`);
      
      // Import authFetchJson dynamically to avoid issues in SSR/build
      const { authFetchJson } = await import('@/utils/authFetch');
      
      const result = await authFetchJson<CreateSemanticUrlResponse>('/api/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          postTitle,
          boardId,
          boardName,
          shareSource: 'direct_share',
          communityShortId,
          pluginId,
          communityHostingUrl: baseUrl
        }),
      });
      
      console.log(`[buildExternalShareUrl] Successfully created semantic URL: ${result.url}`);
      return result.url;
      
    } catch (error) {
      console.warn('[buildExternalShareUrl] Failed to create semantic URL, falling back to legacy:', error);
    }
  }
  
  // Fallback to legacy URL generation
  console.log(`[buildExternalShareUrl] Using legacy URL for post ${postId}`);
  return buildLegacyExternalShareUrl(postId, boardId, communityShortId, pluginId, baseUrl);
}

/**
 * Legacy external share URL builder (preserved for fallback)
 * @param postId - The ID of the post
 * @param boardId - The ID of the board the post belongs to
 * @param communityShortId - The community short ID for URL construction
 * @param pluginId - The plugin ID for URL construction
 * @returns External URL pointing to post page with share context
 */
export function buildLegacyExternalShareUrl(
  postId: number, 
  boardId: number, 
  communityShortId?: string, 
  pluginId?: string,
  hostingUrl?: string
): string {
  // Prioritize community hosting URL over env var
  const pluginBaseUrl = hostingUrl || process.env.NEXT_PUBLIC_PLUGIN_BASE_URL;
  
  if (!pluginBaseUrl) {
    console.warn('[buildLegacyExternalShareUrl] No hosting URL configured (community or env var), falling back to internal URL');
    return buildPostUrl(postId, boardId, false);
  }
  
  // Remove trailing slash if present
  const baseUrl = pluginBaseUrl.replace(/\/$/, '');
  
  // Generate a unique token for this share attempt
  const shareToken = generateShareToken(postId, boardId);
  
  // Build post page URL with share context parameters
  const params = new URLSearchParams({
    token: shareToken,
  });
  
  // Add community and plugin context if available (for human user redirects)
  if (communityShortId) {
    params.set('communityShortId', communityShortId);
  }
  if (pluginId) {
    params.set('pluginId', pluginId);
  }
  
  // Direct to post page - crawlers see meta tags, humans get redirected
  return `${baseUrl}/board/${boardId}/post/${postId}?${params.toString()}`;
}

/**
 * Generates a unique share token for tracking shared URLs
 * @param postId - The ID of the post
 * @param boardId - The ID of the board
 * @returns A unique token string
 */
function generateShareToken(postId: number, boardId: number): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const data = `${postId}-${boardId}-${timestamp}`;
  
  // Simple encoding (in production, you might want something more sophisticated)
  return btoa(data).replace(/[+/=]/g, '') + random;
} 