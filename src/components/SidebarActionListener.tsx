'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { preserveCgParams } from '@/utils/urlBuilder';

/**
 * Sidebar Action Listener Component
 * 
 * Listens for sidebar action messages from the parent window (host service)
 * and integrates them with the forum app's features like GlobalSearchModal
 * and navigation to What's New page.
 * 
 * This is a much simpler approach than the bidirectional CommandServer,
 * perfect for one-way communication from sidebar to forum.
 */
export const SidebarActionListener: React.FC = () => {
  const { openSearch, closeSearch, isSearchOpen } = useGlobalSearch();
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle sidebar_action messages
      if (!event.data || event.data.type !== 'sidebar_action') {
        return;
      }

      const { action, payload } = event.data;
      console.log('[SidebarActionListener] Received action:', action, payload);

      // Handle different sidebar actions
      switch (action) {
        case 'search':
          try {
            // 🆕 NEW - Toggle behavior: close if open, open if closed
            if (isSearchOpen) {
              console.log('[SidebarActionListener] Search modal is open - closing it');
              closeSearch();
            } else {
              console.log('[SidebarActionListener] Opening search modal');
              openSearch({
                initialQuery: payload?.searchQuery || '',
                autoExpandForm: false // Keep it as search, not post creation
              });
            }
          } catch (error) {
            console.error('[SidebarActionListener] Failed to toggle search modal:', error);
          }
          break;

        case 'messages':
          console.log('[SidebarActionListener] Messages action received - not implemented yet');
          // TODO: Implement messages interface when available
          break;

        case 'notifications':
          try {
            console.log('[SidebarActionListener] Opening What\'s New page');
            router.push(preserveCgParams('/whats-new'));
          } catch (error) {
            console.error('[SidebarActionListener] Failed to navigate to What\'s New:', error);
          }
          break;

        default:
          console.warn('[SidebarActionListener] Unknown sidebar action:', action);
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);
    console.log('[SidebarActionListener] Initialized - listening for sidebar actions');

    // Cleanup on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
      console.log('[SidebarActionListener] Cleaned up message listener');
    };
  }, [openSearch, closeSearch, isSearchOpen, router]);

  // This component doesn't render anything
  return null;
}; 