'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { useWhatsNew } from '@/contexts/WhatsNewContext';
import { useChatModal } from '@curia_/curia-chat-modal';

/**
 * Sidebar Action Listener Component
 * 
 * Listens for sidebar action messages from the parent window (host service)
 * and integrates them with the forum app's features like GlobalSearchModal
 * and WhatsNewModal overlay system.
 * 
 * This is a much simpler approach than the bidirectional CommandServer,
 * perfect for one-way communication from sidebar to forum.
 */
export const SidebarActionListener: React.FC = () => {
  const { openSearch, closeSearch, isSearchOpen } = useGlobalSearch();
  const { openNotifications, closeNotifications, isNotificationsOpen } = useWhatsNew();
  const { openChat, closeChat, isChatOpen } = useChatModal();
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
          try {
            // Toggle behavior: close if open, open if closed
            if (isChatOpen) {
              console.log('[SidebarActionListener] Chat modal is open - closing it');
              closeChat();
            } else {
              console.log('[SidebarActionListener] Opening chat modal');
              openChat();
            }
          } catch (error) {
            console.error('[SidebarActionListener] Failed to toggle chat modal:', error);
          }
          break;

        case 'notifications':
          try {
            // 🆕 NEW - Toggle behavior: close if open, open if closed
            if (isNotificationsOpen) {
              console.log('[SidebarActionListener] Notifications modal is open - closing it');
              closeNotifications();
            } else {
              console.log('[SidebarActionListener] Opening notifications modal');
              openNotifications();
            }
          } catch (error) {
            console.error('[SidebarActionListener] Failed to toggle notifications modal:', error);
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
  }, [openSearch, closeSearch, isSearchOpen, isNotificationsOpen, closeNotifications, openNotifications, openChat, closeChat, isChatOpen, router]);

  // This component doesn't render anything
  return null;
}; 