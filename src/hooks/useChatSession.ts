/**
 * Chat Session Hook - IRC Provisioning and Channel Management
 * 
 * This hook moves IRC provisioning and channel fetching from the chat modal
 * to the Curia app for better architecture and performance.
 * 
 * Benefits:
 * - Provisions IRC credentials once per session (not every modal open)
 * - Caches channel data to avoid repeated API calls
 * - Eliminates 2-3 second delay when opening chat modal
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authFetchJson } from '@/utils/authFetch';
import { provisionIrcUser, type IrcCredentials } from '@/utils/chat-api-client';
import type { ApiChatChannel } from '@/types/chatChannels';

export interface ChatSessionData {
  ircCredentials: IrcCredentials;
  channels: ApiChatChannel[];
  defaultChannel: ApiChatChannel;
}

export interface UseChatSessionReturn {
  sessionData: ChatSessionData | null;
  isInitialized: boolean;
  isLoading: boolean;
  initError: string | null;
  // Helper to get channel by ID
  getChannelById: (channelId: number) => ApiChatChannel | undefined;
}

/**
 * Initialize chat session with IRC provisioning and channel fetching
 * This runs once when the user is authenticated, not every modal open
 */
export function useChatSession(): UseChatSessionReturn {
  const { user, token } = useAuth();
  const [sessionData, setSessionData] = useState<ChatSessionData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize session on mount - MOVED from chat modal for better performance!
  useEffect(() => {
    if (!user || !token || !user.cid) {
      setIsInitialized(false);
      setSessionData(null);
      return;
    }
    
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        setInitError(null);
        
        console.log('[Chat Session] Starting session initialization...');
        
        // 1. Provision IRC credentials (moved from chat modal!)
        console.log('[Chat Session] Provisioning IRC user...');
        const ircCredentials = await provisionIrcUser(
          token,
          process.env.NEXT_PUBLIC_CHAT_BASE_URL || '',
          process.env.NEXT_PUBLIC_CURIA_BASE_URL || ''
        );
        
        console.log('[Chat Session] IRC provisioning complete, fetching channels...');
        
        // 2. Fetch available channels for community
        const channels = await authFetchJson<ApiChatChannel[]>(
          `/api/communities/${user.cid}/chat-channels`
        );
        
        console.log(`[Chat Session] Fetched ${channels.length} channels`);
        
        // 3. Identify default channel
        const defaultChannel = channels.find(ch => ch.is_default) || channels[0];
        
        if (!defaultChannel) {
          throw new Error('No chat channels available for community');
        }

        console.log('[Chat Session] Default channel:', defaultChannel.name);

        const newSessionData: ChatSessionData = {
          ircCredentials,
          channels,
          defaultChannel
        };

        setSessionData(newSessionData);
        setIsInitialized(true);
        
        console.log('[Chat Session] Session initialization complete!');
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat session';
        console.error('[Chat Session] Initialization failed:', errorMessage);
        setInitError(errorMessage);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSession();
  }, [user?.userId, user?.cid, user, token]);

  // Helper function to get channel by ID
  const getChannelById = (channelId: number): ApiChatChannel | undefined => {
    return sessionData?.channels.find(ch => ch.id === channelId);
  };

  return {
    sessionData,
    isInitialized,
    isLoading,
    initError,
    getChannelById
  };
}