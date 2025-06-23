'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalSearch } from '@/contexts/GlobalSearchContext';
import { authFetchJson } from '@/utils/authFetch';
import { ApiPost } from '@/app/api/posts/route';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, ArrowUp, MessageSquare, Plus, TrendingUp, X, Edit3, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VoteButton } from './VoteButton';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTimeSince } from '@/utils/timeUtils';
import { ExpandedNewPostForm } from './ExpandedNewPostForm';



interface SearchFirstPostInputProps {
  boardId?: string | null;
  onCreatePostClick: (initialTitle?: string) => void;
  onPostCreated?: (newPost: ApiPost) => void;
  enableGlobalSearch?: boolean; // Whether to use global search modal or local search
}

interface SearchResult extends ApiPost {
  // No additional properties needed for now
  [key: string]: unknown;
}

export const SearchFirstPostInput: React.FC<SearchFirstPostInputProps> = ({
  boardId,
  onCreatePostClick,
  onPostCreated,
  enableGlobalSearch = false
}) => {
  const { token, isAuthenticated, user } = useAuth();
  const { openSearch } = useGlobalSearch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentInput, setCurrentInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false); // Track if modal should stay open
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Responsive placeholder text
  const getPlaceholderText = useCallback(() => {
    if (enableGlobalSearch) {
      return isMobile 
        ? "Search & create posts..." 
        : "What's on your mind? Click to search globally or create a post...";
    } else {
      return isMobile 
        ? "Search & create posts..." 
        : "What's on your mind? Start typing to search or create a post...";
    }
  }, [enableGlobalSearch, isMobile]);

  // First-time user tooltip management
  useEffect(() => {
    // Don't show tooltip if:
    // - User is not authenticated
    // - Tooltip was manually dismissed
    // - Input is currently focused (user is interacting)
    // - User stats haven't loaded yet (avoid race condition)
    if (!isAuthenticated || !user?.stats || tooltipDismissed || isFocused) return;

    // Check if user is new (no posts created) AND stats are actually loaded
    const isNewUser = user.stats.isNewUser;
    const statsLoaded = user.stats.postCount !== undefined && user.stats.commentCount !== undefined;
    const hasSeenTooltip = localStorage.getItem('searchInputTooltip') === 'dismissed';

         if (isNewUser && statsLoaded && !hasSeenTooltip && !isFocused) {
       // Show tooltip after a short delay, only for verified new users
       const timer = setTimeout(() => {
         setShowTooltip(true);
       }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user?.stats, tooltipDismissed, isFocused]);

  // Handle tooltip dismissal
  const handleTooltipDismiss = useCallback(() => {
    setShowTooltip(false);
    setTooltipDismissed(true);
    localStorage.setItem('searchInputTooltip', 'dismissed');
  }, []);

  // Search for similar posts
  const { 
    data: searchResults, 
    isLoading: isSearching,
    error: searchError
  } = useQuery<SearchResult[]>({
    queryKey: ['searchPosts', searchQuery, boardId],
    queryFn: async () => {
      if (searchQuery.trim().length < 3) return [];
      
      const queryParams = new URLSearchParams({
        q: searchQuery.trim(),
        ...(boardId && { boardId })
      });
      
      return authFetchJson<SearchResult[]>(`/api/search/posts?${queryParams.toString()}`, { token });
    },
    enabled: !!token && searchQuery.trim().length >= 3,
    staleTime: 30000, // Keep results fresh for 30 seconds
  });

  // Debounced search query update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(currentInput);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [currentInput]);

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    
    // Rest of existing logic
    if (value.trim().length >= 3) {
      setSearchQuery(value.trim());
      if (!isFocused) {
        setIsFocused(true);
      }
    } else {
      setIsFocused(false);
      setShowInlineForm(false);
    }
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value); // Update immediately for UI
  };

  // Helper function to build URLs while preserving current parameters
  const buildInternalUrl = useCallback((path: string, additionalParams: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    
    // Preserve existing params
    if (searchParams) {
      searchParams.forEach((value, key) => {
        params.set(key, value);
      });
    }
    
    // Add/override with new params
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    
    return `${path}?${params.toString()}`;
  }, [searchParams]);

  const handlePostClick = useCallback((post: SearchResult) => {
    if (post.board_id) {
      const url = buildInternalUrl(`/board/${post.board_id}/post/${post.id}`);
      router.push(url);
    }
  }, [buildInternalUrl, router]);

  // Handler for modal search input
  const handleSearchClick = useCallback(() => {
    if (enableGlobalSearch) {
      openSearch(currentInput);
    } else {
      setIsFocused(true);
    }
  }, [enableGlobalSearch, openSearch, currentInput]);

  const hasResults = searchResults && searchResults.length > 0;
  const hasSearched = searchResults !== undefined; // We've completed at least one search
  
  // Open modal when user types enough characters or focuses (only for local search)
  const shouldOpenModal = !enableGlobalSearch && (isFocused || currentInput.length >= 3 || searchQuery.length >= 3) && (isSearching || hasResults || searchError || (hasSearched && searchQuery.length >= 3));
  
  // Once modal is open, keep it open until explicitly closed
  const showResults = !enableGlobalSearch && (modalOpen || shouldOpenModal);
  
  const showCreateButton = (currentInput.length >= 3 || searchQuery.length >= 3) && !isSearching && (!hasResults || searchResults?.length === 0);

  // Close modal functionality
  const closeResults = useCallback(() => {
    setIsFocused(false);
    setShowInlineForm(false);
    setModalOpen(false);
    setSearchQuery('');
    setCurrentInput('');
  }, []);

  // Mobile-responsive create post handler
  const handleCreatePostClick = useCallback((initialTitle?: string) => {
    if (isMobile) {
      // Mobile: Close modal and show main form
      closeResults();
      onCreatePostClick(initialTitle);
    } else {
      // Desktop: Show inline form in modal
      setShowInlineForm(true);
    }
  }, [isMobile, closeResults, onCreatePostClick]);

  // Set modal open when it should open
  useEffect(() => {
    if (shouldOpenModal && !modalOpen) {
      setModalOpen(true);
    }
  }, [shouldOpenModal, modalOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showResults) {
        closeResults();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showResults, closeResults]);

  if (!isAuthenticated) {
    return (
      <Card className="w-full mx-auto mt-4 sm:mt-6 mb-6 sm:mb-8">
        <CardContent className="p-4 sm:p-6 text-center">
          <p className="text-muted-foreground">Please log in to search or create posts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full mx-auto mt-4 sm:mt-6 mb-6 sm:mb-8">
      {/* Main Search Input Container - Hide when modal is open */}
      {!showResults && (
        <div className="relative z-10">
          <div className="relative">
            <Search 
              size={22} 
              className={cn(
                "absolute left-5 top-1/2 transform -translate-y-1/2 transition-colors duration-200 pointer-events-none",
                isFocused ? "text-primary" : "text-muted-foreground"
              )} 
            />
            
            <Input
              placeholder={getPlaceholderText()}
              value={currentInput}
              className={cn(
                "pl-14 pr-6 py-8 text-lg transition-all duration-200 font-medium",
                "bg-background border-2 rounded-2xl shadow-lg",
                isFocused 
                  ? "border-primary shadow-xl shadow-primary/10" 
                  : "border-muted hover:border-primary/50 hover:shadow-xl",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                enableGlobalSearch && "cursor-pointer"
              )}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                handleTooltipDismiss(); // Dismiss tooltip when user interacts
                if (currentInput.trim().length >= 3) {
                  setIsFocused(true);
                }
              }}
              onBlur={() => {
                // Delay hiding results to allow clicking on them
                setTimeout(() => {
                  if (!showInlineForm) {
                    setIsFocused(false);
                  }
                }, 150);
              }}
              onClick={enableGlobalSearch ? handleSearchClick : handleTooltipDismiss}
              readOnly={enableGlobalSearch}
            />
            
            {/* Keyboard shortcut hint for global search */}
            {enableGlobalSearch && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 text-muted-foreground pointer-events-none">
                <kbd className="px-1.5 py-1 text-xs bg-muted rounded border font-mono">⌘K</kbd>
              </div>
            )}
          </div>

          {/* First-time user tooltip */}
          {showTooltip && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full z-20 animate-in slide-in-from-top-2 duration-300">
              <div className="relative w-[calc(100vw-2rem)] max-w-sm sm:max-w-md mx-auto">
                {/* Tooltip arrow */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-slate-900 dark:border-b-slate-50"></div>
                
                {/* Tooltip content */}
                <div className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 backdrop-blur-sm text-sm font-medium px-5 py-4 rounded-xl shadow-lg border border-slate-700 dark:border-slate-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb size={16} className="text-yellow-400 dark:text-yellow-500 flex-shrink-0" />
                    <span className="font-semibold">💡 Pro tip</span>
                  </div>
                  <p className="mb-3 text-slate-200 dark:text-slate-700 leading-relaxed">
                    This is your gateway to discovery! Start typing to search existing discussions, or create your first post to join the conversation.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleTooltipDismiss}
                      className="h-8 px-4 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600 dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-slate-800 dark:border-slate-300 font-medium"
                    >
                      Got it!
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full-Screen Search Results Overlay */}
      {showResults && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={closeResults}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />
          
          {/* Results Container */}
          <div className="fixed left-0 right-0 top-4 bottom-0 z-50 flex justify-center px-4 animate-in slide-in-from-top-4 duration-300">
            <div className="w-full max-w-4xl">
              <Card className={cn(
                "shadow-2xl border-2 border-primary/20 rounded-2xl overflow-hidden backdrop-blur-md",
                "bg-background/95 max-h-[calc(100vh-2rem)] overscroll-contain"
              )}>
                <CardContent className="p-0">
                  {/* Modal Search Input - Sticky at top */}
                  <div className="sticky top-0 z-20 p-4 bg-background/95 backdrop-blur-md border-b border-primary/10">
                    <div className="relative">
                      <Search 
                        size={20} 
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary pointer-events-none"
                      />
                                             <Input
                         placeholder={currentInput 
                           ? (isMobile ? "Refining search..." : "Continue typing to refine your search...")
                           : (isMobile ? "Search posts..." : "Start typing to search for posts...")
                         }
                         value={currentInput}
                         className={cn(
                           "pl-12 pr-12 py-4 text-lg transition-all duration-200 font-medium",
                           "bg-background border-2 border-primary/40 rounded-xl shadow-md",
                           "focus:border-primary focus:shadow-lg",
                           "focus:outline-none focus:ring-2 focus:ring-primary/20"
                         )}
                         onChange={handleModalInputChange}
                         onKeyDown={(e) => {
                           if (e.key === 'Escape') {
                             closeResults();
                           }
                         }}
                         autoFocus
                       />
                      {/* Clear button */}
                      {currentInput && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentInput('');
                            setSearchQuery('');
                            // Keep modal open when clearing
                          }}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted rounded-full"
                        >
                          <X size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Loading State */}
                  {isSearching && (
                    <div className="p-8 flex flex-col items-center justify-center text-muted-foreground min-h-[200px]">
                      <div className="relative">
                        <Loader2 size={32} className="animate-spin text-primary" />
                        <div className="absolute inset-0 animate-ping">
                          <Loader2 size={32} className="text-primary/20" />
                        </div>
                      </div>
                      <p className="mt-4 text-lg font-medium">Searching for similar posts...</p>
                      <p className="text-sm text-muted-foreground/70">Finding the best matches for your query</p>
                    </div>
                  )}

                  {/* Error State */}
                  {searchError && (
                    <div className="p-8 text-center min-h-[200px] flex flex-col justify-center">
                      <div className="text-red-400 mb-4">
                        <Search size={48} className="mx-auto opacity-50" />
                      </div>
                      <h3 className="text-lg font-medium text-red-500 mb-2">Search temporarily unavailable</h3>
                      <p className="text-sm text-muted-foreground mb-4">Don&apos;t worry, you can still create a new post.</p>
                      <Button 
                        onClick={() => handleCreatePostClick()}
                        className="mx-auto"
                      >
                        <Plus size={16} className="mr-2" />
                        Create new post
                      </Button>
                    </div>
                  )}

                  {/* Empty Input State - Modal open but no input */}
                  {!isSearching && !searchError && !currentInput && !searchQuery && (
                    <div className="p-8 text-center min-h-[200px] flex flex-col justify-center">
                      <div className="text-primary/40 mb-4">
                        <Search size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Ready to search</h3>
                      <p className="text-muted-foreground mb-4">
                        Start typing above to find existing discussions or create a new post.
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        Search across all posts and boards in this community
                      </p>
                    </div>
                  )}

                  {/* Search Results */}
                  {hasResults && !showInlineForm && (
                    <div 
                      className="overflow-y-auto max-h-[calc(100vh-12rem)] overscroll-contain"
                      onTouchMove={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="p-6 border-b bg-background/90 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-xl bg-primary/10">
                              <TrendingUp size={20} className="text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">Similar discussions found</h3>
                              <p className="text-sm text-muted-foreground">
                                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &quot;{currentInput || searchQuery}&quot;
                              </p>
                            </div>
                          </div>
                          
                          {/* Close Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={closeResults}
                            className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Results Grid */}
                      <div className="p-6 grid gap-4">
                        {/* Create New Post Option - Always First */}
                        <div className="animate-in slide-in-from-bottom-2 duration-300">
                          <CreateNewPostItem 
                            searchQuery={(currentInput || searchQuery).trim()} 
                            onClick={() => handleCreatePostClick((currentInput || searchQuery).trim())} 
                          />
                        </div>
                        
                        {/* Actual Search Results */}
                        {searchResults.map((post, index) => (
                          <div 
                            key={post.id}
                            className="animate-in slide-in-from-bottom-2 duration-300"
                            style={{ animationDelay: `${(index + 1) * 50}ms` }}
                          >
                            <SearchResultItem 
                              post={post} 
                              onClick={() => handlePostClick(post)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Form for Desktop when there are results */}
                  {hasResults && showInlineForm && (
                    <div className="relative">
                      {/* Close Button for Inline Form State */}
                      <div className="absolute top-4 right-4 z-10">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={closeResults}
                          className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      
                      {/* Scrollable container for the form */}
                      <div 
                        className="overflow-y-auto max-h-[calc(100vh-12rem)] overscroll-contain"
                        onTouchMove={(e) => e.stopPropagation()}
                        onWheel={(e) => e.stopPropagation()}
                      >
                        <div className="p-6">
                          <div className="mb-4 text-center">
                            <h3 className="text-lg font-semibold text-muted-foreground">
                              Creating new post for: &quot;{currentInput || searchQuery}&quot;
                            </h3>
                          </div>
                          <ExpandedNewPostForm 
                            boardId={boardId}
                            initialTitle={(currentInput || searchQuery).trim()}
                            onCancel={() => setShowInlineForm(false)}
                            onPostCreated={(newPost) => {
                              closeResults();
                              if (onPostCreated) {
                                onPostCreated(newPost);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Results + Inline Create Post Form */}
                  {showCreateButton && (
                    <div className="relative">
                      {/* Close Button for No Results State */}
                      <div className="absolute top-4 right-4 z-10">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={closeResults}
                          className="rounded-full h-8 w-8 p-0 hover:bg-muted"
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      
                      {showInlineForm ? (
                        // Show the actual form inline with proper scrolling
                        <div 
                          className="overflow-y-auto max-h-[calc(100vh-12rem)] overscroll-contain"
                          onTouchMove={(e) => e.stopPropagation()}
                          onWheel={(e) => e.stopPropagation()}
                        >
                          <div className="p-6">
                            <div className="mb-4 text-center">
                              <h3 className="text-lg font-semibold text-muted-foreground">
                                Creating new post for: &quot;{currentInput || searchQuery}&quot;
                              </h3>
                            </div>
                            <ExpandedNewPostForm 
                              boardId={boardId}
                              initialTitle={(currentInput || searchQuery).trim()}
                              onCancel={() => setShowInlineForm(false)}
                              onPostCreated={(newPost) => {
                                closeResults();
                                if (onPostCreated) {
                                  onPostCreated(newPost);
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        // Show the button to reveal the form
                        <div className="p-8 text-center min-h-[300px] flex flex-col justify-center">
                          <div className="mb-6">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                              <Search size={32} className="text-primary/60" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">No similar posts found</h3>
                            <p className="text-muted-foreground">
                              We couldn&apos;t find any existing discussions about <br />
                              <span className="font-medium text-foreground">&quot;{currentInput || searchQuery}&quot;</span>
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            <Button 
                              onClick={() => handleCreatePostClick((currentInput || searchQuery).trim())}
                              size="lg"
                              className="px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            >
                              <Plus size={20} className="mr-3" />
                              Create new post
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Be the first to start this conversation
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}


    </div>
  );
};

// Create New Post Item Component
interface CreateNewPostItemProps {
  searchQuery: string;
  onClick: () => void;
}

const CreateNewPostItem: React.FC<CreateNewPostItemProps> = ({ searchQuery, onClick }) => {
  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg border-2",
        "border-primary/30 hover:border-primary/60 hover:scale-[1.01] hover:-translate-y-0.5",
        "bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Create Post Header */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-primary/20">
                <Edit3 size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary text-base">
                  Create: &quot;{searchQuery}&quot;
                </h3>
                <p className="text-xs text-muted-foreground">
                  Start a new discussion about this topic
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-primary/80">
              <Plus size={14} />
              <span className="font-medium">New post</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Be the first to discuss this</span>
            </div>
            
            <div className="text-xs text-primary/60 font-medium">
              Click to create →
            </div>
          </div>
        </div>
        
        {/* Subtle shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[200%] duration-1000" />
      </CardContent>
    </Card>
  );
};

// Search Result Item Component
interface SearchResultItemProps {
  post: SearchResult;
  onClick: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ post, onClick }) => {
  const timeSinceText = useTimeSince(post.created_at);
  
  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-lg border border-border/50",
        "hover:border-primary/30 hover:scale-[1.01] hover:-translate-y-0.5",
        "bg-gradient-to-br from-background to-background/80"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="space-y-4">
          {/* Post Title */}
          <div className="space-y-2">
            <h3 className={cn(
              "font-semibold text-foreground line-clamp-2 text-base leading-snug",
              "group-hover:text-primary transition-colors duration-200"
            )}>
              {post.title}
            </h3>
            
            {/* Board Context Badge */}
            {post.board_name && (
              <div className="inline-flex items-center">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  "bg-primary/10 text-primary border border-primary/20"
                )}>
                  📋 {post.board_name}
                </span>
              </div>
            )}
          </div>
          
          {/* Engagement Metrics */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-lg",
                "bg-muted/50 text-muted-foreground text-sm transition-colors",
                "group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <ArrowUp size={14} />
                <span className="font-medium">{post.upvote_count}</span>
              </div>
              
              <div className={cn(
                "flex items-center space-x-1 px-2 py-1 rounded-lg",
                "bg-muted/50 text-muted-foreground text-sm transition-colors",
                "group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <MessageSquare size={14} />
                <span className="font-medium">{post.comment_count}</span>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {timeSinceText}
              </div>
            </div>
            
            {/* Quick Vote Button */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <VoteButton 
                postId={post.id} 
                initialUpvoteCount={post.upvote_count}
                initialUserHasUpvoted={post.user_has_upvoted}
                disabled={false}
                size="sm"
              />
            </div>
          </div>
          
          {/* Subtle engagement indicator */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors duration-200",
                post.upvote_count > 5 ? "bg-green-400" : 
                post.upvote_count > 0 ? "bg-yellow-400" : "bg-muted-foreground/30"
              )} />
              <span>
                {post.upvote_count > 10 ? "Hot discussion" :
                 post.upvote_count > 5 ? "Active discussion" :
                 post.upvote_count > 0 ? "Some activity" : "New discussion"}
              </span>
            </div>
            
            <div className="text-muted-foreground/60">
              Click to view →
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 