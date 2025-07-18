/**
 * Cookie utilities for handling shared content detection in iframe context
 * Used to detect when users arrive via external share links
 */

/**
 * Gets a cookie value by name
 * @param name - The cookie name
 * @returns The cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Interface for shared post data stored in cookies
 */
export interface SharedPostData {
  postId: string;
  boardId: string;
  token: string;
  timestamp: number;
}

/**
 * Checks if the current session is from a shared link
 * @returns Object with sharing info if detected, null otherwise
 */
export function getSharedContentInfo(): { isShared: boolean; postData?: SharedPostData } {
  console.log('[cookieUtils] Checking for shared content...');
  
  // Log all available cookies for debugging
  console.log('[cookieUtils] All cookies:', document.cookie);
  
  const sharedPostDataStr = getCookie('shared_post_data');
  
  if (!sharedPostDataStr) {
    console.log('[cookieUtils] No shared_post_data cookie found');
    return { isShared: false };
  }
  
  console.log('[cookieUtils] Found shared_post_data cookie:', sharedPostDataStr);
  
  try {
    const postData: SharedPostData = JSON.parse(sharedPostDataStr);
    
    // Check if the data is not too old (7 days max)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const isValid = (Date.now() - postData.timestamp) < maxAge;
    
    if (!isValid) {
      console.log('[cookieUtils] Shared content token expired');
      clearSharedContentCookies();
      return { isShared: false };
    }
    
    console.log('[cookieUtils] ✔ Shared content detected and valid:', postData);
    return { isShared: true, postData };
    
  } catch (error) {
    console.error('[cookieUtils] Failed to parse shared post data:', error);
    clearSharedContentCookies();
    return { isShared: false };
  }
}

/**
 * Clears the shared content cookies (cleanup after processing)
 */
export function clearSharedContentCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  // Clear both cookies by setting them to expire in the past
  document.cookie = 'shared_content_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  document.cookie = 'shared_post_data=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
  
  console.log('[cookieUtils] Cleared shared content cookies');
}

/**
 * Logs cookie detection results for debugging across browsers
 */
export function logCookieDebugInfo(): void {
  console.table([
    { browser: 'Chromium/Edge', expectation: 'cookie should be present' },
    { browser: 'Safari/iOS', expectation: 'cookie usually blocked by ITP' },
    { browser: 'Firefox (strict/private)', expectation: 'cookie likely blocked by ETP' },
  ]);
  
  const hasPostData = !!getCookie('shared_post_data');
  const postDataValue = getCookie('shared_post_data');
  
  console.log(`[cookieUtils] Cookie detection results:`, {
    shared_post_data: hasPostData,
    shared_post_data_value: postDataValue,
    all_cookies: document.cookie,
    userAgent: navigator.userAgent,
    location: window.location.href,
  });
} 