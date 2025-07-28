'use client';

import React, { useEffect } from 'react';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';

/**
 * Sidebar Action Listener Component
 * 
 * Listens for sidebar action messages from the parent window (host service)
 * and integrates them with the forum app's features like GlobalSearchModal.
 * 
 * This is a much simpler approach than the bidirectional CommandServer,
 * perfect for one-way communication from sidebar to forum.
 */
export const SidebarActionListener: React.FC = () => {
  const { openSearch } = useGlobalSearch();

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
            console.log('[SidebarActionListener] Opening search modal');
            openSearch({
              initialQuery: payload?.searchQuery || '',
              autoExpandForm: false // Keep it as search, not post creation
            });
          } catch (error) {
            console.error('[SidebarActionListener] Failed to open search modal:', error);
          }
          break;

        case 'messages':
          console.log('[SidebarActionListener] Messages action received - not implemented yet');
          // TODO: Implement messages interface when available
          break;

        case 'notifications':
          console.log('[SidebarActionListener] Notifications action received - not implemented yet');
          // TODO: Implement notifications interface when available
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
  }, [openSearch]);

  // This component doesn't render anything
  return null;
}; 