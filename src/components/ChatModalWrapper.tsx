'use client';

import React from 'react';
import { ChatModal, useChatModal } from '@curia_/curia-chat-modal';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authFetchJson } from '@/utils/authFetch';

interface ApiCommunity {
  id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function ChatModalWrapper() {
  const { isChatOpen, closeChat } = useChatModal();
  const { user, token } = useAuth();

  // Fetch community data
  const { data: community } = useQuery<ApiCommunity>({
    queryKey: ['community', user?.cid],
    queryFn: async () => {
      if (!token || !user?.cid) throw new Error('Community not available');
      return authFetchJson<ApiCommunity>(`/api/communities/${user.cid}`, { token });
    },
    enabled: !!token && !!user?.cid && isChatOpen, // Only fetch when modal is open
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Don't render if modal is closed or missing data
  if (!isChatOpen || !user || !community) {
    return null;
  }

  const chatBaseUrl = process.env.NEXT_PUBLIC_CHAT_BASE_URL || 'https://chat.curia.network';

  return (
    <ChatModal
      user={{
        id: user.userId,
        name: user.name || 'Anonymous'
      }}
      community={{
        id: community.id,
        name: community.name
      }}
      theme="light" // TODO: Get from theme context
      chatBaseUrl={chatBaseUrl}
      onClose={closeChat}
    />
  );
}