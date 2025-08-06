'use client';

import React from 'react';
import { ChatModal, useChatModal } from '@curia_/curia-chat-modal';
import { useEffectiveTheme } from '@/hooks/useEffectiveTheme';
import { useChatSession } from '@/hooks/useChatSession';

export function ChatModalWrapper() {
  const { isChatOpen, selectedChannelId, closeChat } = useChatModal();
  const { sessionData, isInitialized } = useChatSession();
  const theme = useEffectiveTheme();
  
  // Don't render if modal is closed or session not ready
  if (!isChatOpen || !isInitialized || !sessionData) {
    return null;
  }

  // Determine which channel to show
  const targetChannel = selectedChannelId 
    ? sessionData.channels.find(ch => ch.id === selectedChannelId)
    : sessionData.defaultChannel;

  if (!targetChannel) {
    console.error('[ChatModalWrapper] Invalid channel selection:', selectedChannelId);
    return null; // Invalid channel selection
  }

  return (
    <ChatModal
      // Pass pre-provisioned data - no API calls in modal!
      ircCredentials={sessionData.ircCredentials}
      channel={targetChannel}
      theme={theme}
      mode={targetChannel.is_single_mode ? 'single' : 'normal'}
      onClose={closeChat}
    />
  );
}