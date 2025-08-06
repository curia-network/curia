'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { authFetchJson } from '@/utils/authFetch';
import { ApiChatChannel } from '@/types/chatChannels';
import { ChatModal } from '@curia_/curia-chat-modal';
import { useChatSession } from '@/hooks/useChatSession';
import { useEffectiveTheme } from '@/hooks/useEffectiveTheme';
import { ChatLoadingModal } from '@/components/chat/ChatLoadingModal';
import { ChatErrorModal } from '@/components/chat/ChatErrorModal';

interface ChatPageProps {
  params: Promise<{ chatId: string }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const [chatId, setChatId] = useState<string>('');
  const { token, user } = useAuth();
  const searchParams = useSearchParams();
  const theme = useEffectiveTheme();
  const { 
    sessionData, 
    isInitialized, 
    isLoading: isSessionLoading, 
    initError, 
    retryCount, 
    isRetrying, 
    retryInitialization 
  } = useChatSession();

  useEffect(() => {
    params.then(({ chatId }) => {
      setChatId(chatId);
    });
  }, [params]);

  // Fetch specific chat channel
  const { data: chatChannel, isLoading: isChannelLoading, error: channelError } = useQuery<ApiChatChannel>({
    queryKey: ['chatChannel', chatId],
    queryFn: async () => {
      if (!token || !user?.cid) throw new Error('No auth token');
      
      // First try to get from session data if available
      if (sessionData?.channels) {
        const existingChannel = sessionData.channels.find(ch => ch.id === parseInt(chatId));
        if (existingChannel) {
          return existingChannel;
        }
      }
      
      // Otherwise fetch from API
      const response = await authFetchJson<ApiChatChannel[]>(
        `/api/communities/${user.cid}/chat-channels`, 
        { token }
      );
      
      const channel = response.find(ch => ch.id === parseInt(chatId));
      if (!channel) {
        throw new Error('Chat channel not found');
      }
      
      return channel;
    },
    enabled: !!token && !!chatId && !!user?.cid,
  });

  const isLoading = isSessionLoading || isChannelLoading;
  const error = initError || channelError;

  // Show loading state during session initialization, retries, or channel loading
  if (isLoading || isRetrying) {
    const message = isRetrying 
      ? `Retrying connection (${retryCount}/3)...`
      : "Loading chat...";
    
    return (
      <div className="h-screen w-full">
        <ChatLoadingModal 
          message={message}
          onClose={() => {
            // Navigate back to home
            window.history.back();
          }}
        />
      </div>
    );
  }

  // Show error state after all retries failed or channel not found
  if (error && (!isRetrying || retryCount >= 3)) {
    return (
      <div className="h-screen w-full">
        <ChatErrorModal 
          error={typeof error === 'string' ? error : error.message || 'Failed to load chat'}
          retryCount={retryCount}
          onRetry={channelError ? () => window.location.reload() : retryInitialization}
          onClose={() => {
            // Navigate back to home
            window.history.back();
          }}
        />
      </div>
    );
  }

  // Don't show modal if not ready yet (still initializing)
  if (!isInitialized || !sessionData || !chatChannel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      {/* Full-screen chat modal without backdrop - styled for full page */}
      <div className="h-full w-full relative">
        <div className="absolute inset-0 bg-background">
          <ChatModal
            ircCredentials={sessionData.ircCredentials}
            channel={chatChannel}
            chatBaseUrl={process.env.NEXT_PUBLIC_CHAT_BASE_URL}
            theme={theme}
            mode={chatChannel.is_single_mode ? 'single' : 'normal'}
            onClose={() => {
              // Navigate back to home or previous page
              const params = new URLSearchParams(searchParams?.toString() || '');
              // Remove any existing boardId or chatId to go to home
              params.delete('boardId');
              const homeUrl = params.toString() ? `/?${params.toString()}` : '/';
              window.location.href = homeUrl;
            }}
          />
        </div>
      </div>
    </div>
  );
}