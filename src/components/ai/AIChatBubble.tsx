'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@ai-sdk/react';
import { AIChatInterface, AIChatInterfaceRef } from './AIChatInterface';
import { ClippyButton } from './ClippyButton';
import ClippySpeechBubble from './ClippySpeechBubble';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardStyling } from '@/hooks/useCardStyling';
import { authFetch } from '@/utils/authFetch';
import { useRouter } from 'next/navigation';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import type { Message } from '@ai-sdk/react';

interface AIChatBubbleProps {
  className?: string;
  context?: {
    type: 'post' | 'comment' | 'general' | 'onboarding';
    boardId?: number;
    postId?: number;
  };
}

interface WelcomeResponse {
  message: string;
  tone: 'welcoming' | 'helpful' | 'encouraging' | 'admin-focused';
  duration: number;
  hasCallToAction: boolean;
}

// ActionButton interface to match ClippySpeechBubble
interface ActionButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  message?: string;
  action?: 'chat' | 'navigate' | 'modal';
  navigationPath?: string;
  adminOnly?: boolean;
}

// Session storage key for persisting chat messages
const CHAT_STORAGE_KEY = 'clippy_chat_session';

// LocalStorage key for tracking speech bubble frequency
const SPEECH_BUBBLE_FREQUENCY_KEY = 'clippy_speech_bubble_frequency';

// Helper to check speech bubble frequency (24 hours per user per community)
const canShowSpeechBubble = (userId: string, communityId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const stored = localStorage.getItem(SPEECH_BUBBLE_FREQUENCY_KEY);
    const frequencyData = stored ? JSON.parse(stored) : {};
    
    const key = `${userId}_${communityId}`;
    const lastShown = frequencyData[key];
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Debug logging
    if (lastShown) {
      const hoursAgo = (now - lastShown) / (60 * 60 * 1000);
      console.log(`[Speech Bubble] Last shown ${hoursAgo.toFixed(1)} hours ago for ${key}`);
    } else {
      console.log(`[Speech Bubble] Never shown before for ${key}`);
    }
    
    // If never shown or more than 24 hours have passed, allow showing
    const canShow = !lastShown || (now - lastShown) >= twentyFourHours;
    console.log(`[Speech Bubble] Can show: ${canShow}`);
    return canShow;
  } catch (error) {
    console.warn('Failed to check speech bubble frequency:', error);
    // Conservative: if localStorage fails, don't show (avoids spam when frequency can't be tracked)
    return false;
  }
};

// Helper to mark speech bubble as shown
const markSpeechBubbleShown = (userId: string, communityId: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(SPEECH_BUBBLE_FREQUENCY_KEY);
    const frequencyData = stored ? JSON.parse(stored) : {};
    
    const key = `${userId}_${communityId}`;
    frequencyData[key] = Date.now();
    localStorage.setItem(SPEECH_BUBBLE_FREQUENCY_KEY, JSON.stringify(frequencyData));
  } catch (error) {
    console.warn('Failed to mark speech bubble as shown:', error);
  }
};

// Helper to detect if a message has UI card function results
const hasUICardResults = (message: Message): boolean => {
  const toolInvocations = (message as any).toolInvocations;
  if (!toolInvocations || !Array.isArray(toolInvocations)) return false;
  
  // Check if any tool invocation has a UI card result type and not text_only mode
  return toolInvocations.some((inv: any) => {
    const resultType = inv.result?.type;
    const displayMode = inv.result?.displayMode;
    
    // These are the function types that show UI cards
    const UI_CARD_TYPES = ['search_results', 'lock_search_results', 'comment_search_results', 'post_creation_guidance'];
    
    return resultType && 
           UI_CARD_TYPES.includes(resultType) && 
           displayMode !== 'text_only';
  });
};

// Minimal Clippy Component for mobile
const MinimalClippy = ({ onClick, hasNewMessage, className }: { 
  onClick: () => void; 
  hasNewMessage: boolean;
  className?: string;
}) => {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        "fixed bottom-2 right-2 z-50 cursor-pointer",
        "w-10 h-10 rounded-full",
        "bg-gradient-to-br from-purple-500 to-pink-500",
        "shadow-lg hover:shadow-xl transition-all duration-300",
        "flex items-center justify-center",
        "hover:scale-110 active:scale-95",
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Paperclip emoji */}
      <motion.span
        className="text-lg"
        animate={{
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        📎
      </motion.span>
      
      {/* New message indicator */}
      {hasNewMessage && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
        />
      )}

      {/* Subtle pulse animation */}
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

export function AIChatBubble({ className, context }: AIChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState(false);
  const [speechMessage, setSpeechMessage] = useState('');
  const [speechTone, setSpeechTone] = useState<'welcoming' | 'helpful' | 'encouraging' | 'admin-focused'>('welcoming');
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  // New state for immediate interaction mode
  const [immediateInteractionMode, setImmediateInteractionMode] = useState(false);
  
  // New state for mobile minimal mode
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const chatInterfaceRef = useRef<AIChatInterfaceRef | null>(null);
  const welcomeLoadingRef = useRef(false); // Ref-based guard against double calls in dev mode
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  const { openSearch } = useGlobalSearch();
  
  // Get card styling for background-aware gradients (same as PostCard)
  const { hasActiveBackground } = useCardStyling();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add scroll detection for mobile minimal mode
  useEffect(() => {
    if (!isMobile || isOpen || speechBubbleVisible) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only trigger minimal mode on downward scroll (user scrolling content)
      if (currentScrollY > lastScrollY && currentScrollY > 100 && !isMinimalMode) {
        console.log('Downward scroll detected on mobile, switching to minimal mode');
        setIsMinimalMode(true);
      }
      
      lastScrollY = currentScrollY;
    };

    // Handle modal scroll events (for search modal, etc.)
    const handleModalScroll = (e: Event) => {
      const target = e.target;
      
      // Type guard: ensure target is an HTMLElement that has closest/matches methods
      if (!target || !(target instanceof HTMLElement)) return;
      
      // Check if scrolling inside a modal or scrollable container
      const isModalScroll = target.closest('[role="dialog"]') || 
                           target.closest('.modal-content') || 
                           target.closest('[data-radix-portal]') ||
                           target.matches('.overflow-y-auto');
      
      if (isModalScroll && target.scrollTop > 50 && !isMinimalMode) {
        console.log('Modal scroll detected on mobile, switching to minimal mode');
        setIsMinimalMode(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Listen for scroll events on all elements that might be modals
    document.addEventListener('scroll', handleModalScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleModalScroll, { capture: true });
    };
  }, [isMobile, isOpen, speechBubbleVisible, isMinimalMode]);

  // Reset minimal mode when chat opens or speech bubble shows
  useEffect(() => {
    if (isOpen || speechBubbleVisible) {
      setIsMinimalMode(false);
    }
  }, [isOpen, speechBubbleVisible]);

  // Load persisted messages from session storage on mount
  const loadMessages = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate the structure
        if (Array.isArray(parsed) && parsed.every(msg => 
          msg.id && msg.role && msg.content !== undefined
        )) {
          console.log('Restored', parsed.length, 'persisted chat messages');
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted chat messages:', error);
    }
    
    return [];
  };

  // Load initial messages once on mount with strict mode protection
  useEffect(() => {
    if (messagesLoaded) return; // Prevent multiple loads
    
    const messages = loadMessages();
    setInitialMessages(messages);
    setMessagesLoaded(true);
  }, [messagesLoaded]);

  // Persist messages to session storage
  const persistMessages = useCallback((messages: Message[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.warn('Failed to persist chat messages:', error);
    }
  }, []);

  // Move useChat hook to parent for session persistence
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading, 
    setInput,
    setMessages
  } = useChat({
    api: '/api/ai/chat',
    initialMessages: initialMessages, // Use memoized state instead of calling function
    fetch: async (url, options) => {
      // Use the app's authFetch utility which handles auth headers properly
      const { authFetch } = await import('@/utils/authFetch');
      const urlString = url instanceof Request ? url.url : url.toString();
      return authFetch(urlString, options);
    },
    body: {
      context: context ? {
        boardId: context.boardId?.toString(),
        postId: context.postId?.toString(),
      } : undefined
    },
    onFinish: (message) => {
      // Auto-persist messages after each completion
      // Use setTimeout to ensure messages state is updated
      setTimeout(() => {
        persistMessages([...messages, message]);
      }, 100);
      
      // Reset immediate interaction mode when streaming fully completes
      setImmediateInteractionMode(false);
    }
  });

  // Monitor messages for function card appearances to enable immediate interaction
  useEffect(() => {
    if (!isLoading) {
      // Reset immediate interaction mode when not loading
      setImmediateInteractionMode(false);
      return;
    }

    // Check if the latest assistant message has function cards
    const latestAssistantMessage = [...messages]
      .reverse()
      .find(msg => msg.role === 'assistant');

    if (latestAssistantMessage && hasUICardResults(latestAssistantMessage)) {
      console.log('[AIChatBubble] Function cards detected - enabling immediate interaction mode');
      setImmediateInteractionMode(true);
    }
  }, [messages, isLoading]);

  // Calculate effective loading state - not loading if in immediate interaction mode
  const effectiveIsLoading = isLoading && !immediateInteractionMode;

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      persistMessages(messages);
    }
  }, [messages, persistMessages]);

  // Clear chat function for users who want to start fresh
  const clearChat = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    }
    console.log('Chat history cleared');
  }, [setMessages]);

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const showFallbackWelcome = () => {
    // Don't show speech bubble if Clippy is in minimal mode
    if (isMinimalMode) {
      console.log('Clippy is in minimal mode - not showing welcome message');
      setWelcomeLoaded(true);
      return;
    }

    // Additional check: Don't show welcome if search modal is open
    const searchModalOpen = document.querySelector('[role="dialog"]') || 
                           document.querySelector('.fixed.inset-0') ||
                           document.querySelector('[data-radix-portal]');
    if (searchModalOpen) {
      console.log('[Fallback Welcome] Search modal is open - not showing welcome message');
      setWelcomeLoaded(true);
      return;
    }

    // Check frequency limit for fallback welcome too
    if (!user?.userId || !user?.cid || !canShowSpeechBubble(user.userId, user.cid)) {
      console.log('Speech bubble frequency limit reached - not showing fallback welcome message');
      setWelcomeLoaded(true); // Mark as loaded to prevent future attempts
      return;
    }
    
    const isAdmin = user?.isAdmin || false;
    const welcomeMessage = isAdmin 
      ? "Welcome back! Ready to check your community analytics or manage settings?"
      : "Hi there! I can help you explore discussions, create posts, or answer questions.";
    const tone = isAdmin ? 'admin-focused' : 'welcoming';
    
    setSpeechMessage(welcomeMessage);
    setSpeechTone(tone);
    setWelcomeLoaded(true);
    
    // Clear chat history when speech bubble appears (unless chat is open)
    if (!isOpen) {
      clearChat();
    }
    
    setTimeout(() => {
      setSpeechBubbleVisible(true);
      // Mark as shown in localStorage
      if (user?.userId && user?.cid) {
        markSpeechBubbleShown(user.userId, user.cid);
      }
    }, 1000);
  };

  const loadWelcomeMessage = useCallback(async () => {
    // Prevent duplicate calls in development mode (React Strict Mode)
    if (welcomeLoadingRef.current || welcomeLoaded) {
      console.log('[Welcome] Skipping duplicate call - already loading or loaded');
      return;
    }
    
    // Don't show speech bubble if Clippy is in minimal mode
    if (isMinimalMode) {
      console.log('[Welcome] Clippy is in minimal mode - not showing welcome message');
      setWelcomeLoaded(true);
      return;
    }

    // Additional check: Don't show welcome if search modal is open
    const searchModalOpen = document.querySelector('[role="dialog"]') || 
                           document.querySelector('.fixed.inset-0') ||
                           document.querySelector('[data-radix-portal]');
    if (searchModalOpen) {
      console.log('[Welcome] Search modal is open - not showing welcome message');
      setWelcomeLoaded(true);
      return;
    }
    
    // Check frequency limit before proceeding
    if (!user?.userId || !user?.cid || !canShowSpeechBubble(user.userId, user.cid)) {
      console.log('[Welcome] Speech bubble frequency limit reached - not showing welcome message');
      setWelcomeLoaded(true); // Mark as loaded to prevent future attempts
      return;
    }
    
    console.log('[Welcome] Starting welcome message load');
    welcomeLoadingRef.current = true;
    setWelcomeLoading(true);
    
    try {
      const response = await authFetch('/api/ai/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: {
            isFirstVisit: true,
            timeOfDay: getTimeOfDay(),
            boardId: context?.boardId?.toString()
          }
        }),
        token
      });

      if (response.ok) {
        const data: WelcomeResponse = await response.json();
        setSpeechMessage(data.message);
        setSpeechTone(data.tone);
        setWelcomeLoaded(true);
        
        // Clear chat history when speech bubble appears (unless chat is open)
        if (!isOpen) {
          clearChat();
        }
        
        // Show speech bubble after a brief delay for smooth UX
        setTimeout(() => {
          setSpeechBubbleVisible(true);
          // Mark as shown in localStorage
          if (user?.userId && user?.cid) {
            markSpeechBubbleShown(user.userId, user.cid);
          }
        }, 1000);
      } else {
        console.error('[Welcome] Failed to load welcome message:', response.status);
        // Show fallback message
        showFallbackWelcome();
      }
    } catch (error) {
      console.error('[Welcome] Error loading welcome message:', error);
      // Show fallback message
      showFallbackWelcome();
    } finally {
      setWelcomeLoading(false);
      welcomeLoadingRef.current = false; // Reset to allow retry if needed
    }
  }, [token, isOpen, clearChat, user?.userId, user?.cid, isMinimalMode, welcomeLoaded]); // REMOVED: context?.boardId - this was causing recreation during search

  // Auto-load welcome message on component mount - FIXED DEPENDENCY CHAIN
  useEffect(() => {
    // Only run on initial mount, not on dependency changes
    if (isAuthenticated && user && token && !welcomeLoaded && !welcomeLoading && !welcomeLoadingRef.current) {
      // Add a small delay to ensure component is fully mounted and stable
      const timeoutId = setTimeout(() => {
        loadWelcomeMessage();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, user?.userId, user?.cid, token]); // REMOVED: loadWelcomeMessage dependency to prevent recreation chain

  // Function to send a message programmatically
  const sendMessage = useCallback((message: string) => {
    setInput(message);
    // Trigger form submission after setting input
    setTimeout(() => {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      // We'll handle this in AIChatInterface
      if (chatInterfaceRef.current) {
        (chatInterfaceRef.current as any).triggerSubmit?.(submitEvent);
      }
    }, 100);
  }, [setInput]);

  // Only show for authenticated users
  if (!isAuthenticated || !user) {
    return null;
  }



  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
      // Hide speech bubble when chat opens
      setSpeechBubbleVisible(false);
      // Exit minimal mode when chat opens
      setIsMinimalMode(false);
    }
  };

  // Handle action button clicks from speech bubble
  const handleActionClick = (button: ActionButton) => {
    // Hide speech bubble
    setSpeechBubbleVisible(false);
    
    switch (button.action) {
      case 'chat':
        // Send message to chat interface and open modal
        if (button.message) {
          sendMessage(button.message);
        }
        setIsOpen(true);
        setHasNewMessage(false);
        break;
        
      case 'navigate':
        // Navigate to the specified path
        if (button.navigationPath) {
          router.push(button.navigationPath);
        }
        break;
        
      case 'modal':
        // Open search modal with new post mode
        if (button.id === 'create-post') {
          openSearch({
            initialQuery: 'Share your thoughts',
            autoExpandForm: true,
            initialTitle: 'Share your thoughts'
          });
        }
        break;
        
      default:
        // Fallback to chat behavior for backward compatibility
        if (button.message) {
          sendMessage(button.message);
        }
        setIsOpen(true);
        setHasNewMessage(false);
        break;
    }
  };

  // Handle minimal clippy click - just exit minimal mode first
  const handleMinimalClippyClick = () => {
    setIsMinimalMode(false);
  };

  // Show minimal clippy on mobile when in minimal mode
  if (isMobile && isMinimalMode && !isOpen && !speechBubbleVisible) {
    return (
      <MinimalClippy
        onClick={handleMinimalClippyClick}
        hasNewMessage={hasNewMessage}
        className={className}
      />
    );
  }

  return (
    <div className={cn("fixed bottom-0 right-2 md:right-6 z-40 -mr-8 -mb-8", className)} data-clippy>
      <div className="relative">
        {/* Speech Bubble */}
        <ClippySpeechBubble
          message={speechMessage}
          isVisible={speechBubbleVisible}
          onClose={() => setSpeechBubbleVisible(false)}
          onActionClick={handleActionClick}
          tone={speechTone}
        />

        {/* Chat Window - Positioned absolutely */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{ transformOrigin: 'bottom right' }}
              className={cn(
                "absolute bottom-[170px] right-12 mb-2 md:bottom-[234px] md:right-[130px]",
                "w-[90vw] sm:w-[85vw] md:w-80 lg:w-96 xl:w-[420px] rounded-lg overflow-hidden",
                "h-[80vh] max-h-[800px] min-h-[400px]",
                hasActiveBackground
                  ? 'backdrop-blur-md bg-white/20 border-white/30 shadow-xl dark:bg-black/20 dark:border-black/30'
                  : 'bg-card border border-border shadow-2xl'
              )}
              data-clippy
            >
              {/* Chat Interface - with persistent state */}
              <AIChatInterface
                ref={chatInterfaceRef}
                // Pass chat state and functions as props
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleSubmit}
                isLoading={effectiveIsLoading}
                setInput={setInput}
                onClearChat={clearChat}
                className="h-full clippy-chat-interface"
                onClose={toggleChat}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3D Clippy Button - Positioned absolutely */}
        <div className={cn("absolute bottom-0 right-0", isOpen ? "z-60" : "z-50")} data-clippy>
          <ClippyButton
            isOpen={isOpen}
            onClick={toggleChat} // Always toggle chat, no special speech bubble logic
            hasNewMessage={hasNewMessage}
            className="clippy-button"
          />
        </div>
      </div>
    </div>
  );
}