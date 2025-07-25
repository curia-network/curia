export interface TrendingAnalysisData {
  type: 'trending_analysis';
  success: boolean;
  messageForAI?: string;
  errorForAI?: string;
  displayMode: 'text_only' | 'structured';
  analysisData?: {
    posts: Array<{
      id: number;
      title: string;
      content: string;
      author: string;
      board: string;
      tags: string[];
      upvotes: number;
      comments: number;
      created_at: string;
      engagement_score: number;
      top_comments: Array<{
        id: number;
        content: string;
        author: string;
        created_at: string;
      }>;
    }>;
    metadata: {
      timeframe_days: number;
      total_posts: number;
      board_distribution: Record<string, number>;
      tag_frequency: Record<string, number>;
      time_distribution: Record<string, number>;
      average_engagement: number;
      total_comments_analyzed: number;
      most_active_boards: Array<{ board: string; posts: number }>;
      trending_tags: Array<{ tag: string; frequency: number }>;
    };
  };
}

export interface SearchResultsData {
  type: 'search_results';
  success: boolean;
  messageForAI?: string;
  errorForAI?: string;
  searchResults?: Array<{
    id: number;
    title: string;
    author: string;
    authorAvatar?: string;
    upvotes: number;
    snippet: string;
    boardName: string;
    created_at: string;
    // Engagement metrics
    comment_count?: number;
    // Semantic search metadata
    similarity_score?: number; // Percentage 0-100
    // Navigation metadata
    boardId: number;
    postId: number;
    communityShortId?: string;
    pluginId?: string;
    navigationType: 'internal' | 'external';
  }>;
}

export interface CommentSearchResultsData {
  type: 'comment_search_results';
  success: boolean;
  messageForAI?: string;
  errorForAI?: string;
  searchResults?: Array<{
    id: number;
    content: string;
    author: string;
    authorAvatar?: string;
    created_at: string;
    similarity_score: number; // Percentage 0-100
    
    // Post context for navigation and relevance
    postContext: {
      id: number;
      title: string;
      boardName: string;
      upvotes: number;
      totalComments: number;
    };
    
    // Thread context for replies
    threadContext?: {
      parentCommentId: number;
      depth: number;
      isReply: boolean;
    };
    
    // Navigation metadata
    postId: number;
    boardId: number;
    communityShortId?: string;
    pluginId?: string;
    navigationType: 'internal' | 'external';
  }>;
}

// Keep the old interface for backward compatibility during transition
export interface SearchResults {
  success: boolean;
  messageForAI?: string;
  errorForAI?: string;
  searchResults?: Array<{
    title: string;
    author: string;
    upvotes: number;
    snippet: string;
  }>;
}

export interface PostCreationGuidance {
  type: 'post_creation_guidance';
  explanation: string;
  buttonText: string;
  workflow: string;
}

export interface LockSearchResultsData {
  type: 'lock_search_results';
  success: boolean;
  messageForAI?: string;
  errorForAI?: string;
  searchResults?: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    creatorName: string;
    creatorAvatar?: string;
    isTemplate: boolean;
    tags: string[];
    usageCount: number;
    successRate: number; // Percentage (0-100)
    avgVerificationTime: number; // Minutes
    postsUsingLock: number;
    boardsUsingLock: number;
    totalUsage: number;
    requirementCount: number;
    requirementType: 'ALL' | 'ANY';
    requirementTypes: string[];
    createdAt: string;
    // Full gating config for modal preview
    gatingConfig: any;
  }>;
}

export type FunctionResult = SearchResultsData | CommentSearchResultsData | PostCreationGuidance | TrendingAnalysisData | LockSearchResultsData; 