# Semantic Search Implementation Plan

**Status:** Database migration complete, ready for service layer implementation
**Goal:** Integrate OpenAI embeddings with pgvector for dramatic search relevance improvements
**Timeline:** 3 phases, ~2-3 weeks total

## Ready for Testing 🚀

**Phase 1 is now complete!** The embedding worker service is ready for deployment and testing.

### Immediate Next Steps:

1. **Deploy the embedding worker to Railway:**
   ```bash
   cd workers/embedding-worker
   railway login
   railway link  # Link to your Railway project
   railway up    # Deploy the service
   ```

2. **Configure environment variables in Railway dashboard:**
   - `DATABASE_URL` - Your PostgreSQL connection string (same as main app)
   - `OPENAI_API_KEY` - Your OpenAI API key for embeddings

3. **Test the service:**
   - Check health endpoint: `https://your-service.railway.app/health`
   - Watch logs for embedding generation activity
   - Create a new post and verify the embedding gets generated

4. **Monitor backfill progress:**
   - Service will automatically process existing posts on startup
   - Check logs for "Backfill complete" message
   - Query database: `SELECT COUNT(*) FROM posts WHERE embedding IS NULL;`

### What Happens Next:

Once the worker is running, every new post will automatically get embeddings. The next step is implementing the semantic search API (Phase 2), which will use these embeddings to provide dramatically better search results.

## Current State ✅

**Completed:**
- ✅ pgvector extension enabled in PostgreSQL
- ✅ `posts.embedding` column added (vector(1536))
- ✅ HNSW index created for fast similarity search (`posts_embedding_hnsw_idx`)
- ✅ Helper index for backfill efficiency (`posts_embedding_null_idx`)
- ✅ Docker Compose updated to use `pgvector/pgvector:pg17` image
- ✅ PostgreSQL trigger `posts_embedding_trigger` installed with `notify_embedding_needed()` function
- ✅ **Phase 1 Complete:** Real-time embedding worker service implemented in `workers/embedding-worker/`

**Database Schema:**
```sql
-- Added to posts table
ALTER TABLE posts ADD COLUMN embedding vector(1536);

-- Indexes created
CREATE INDEX posts_embedding_hnsw_idx ON posts USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX posts_embedding_null_idx ON posts (id) WHERE embedding IS NULL;
```

## Architecture Decision: PostgreSQL Events vs Simple Async 🚀

**Recommendation:** Start with **PostgreSQL LISTEN/NOTIFY** approach for production-ready background processing.

### Why PostgreSQL Events?
- **Reliable**: No lost events, atomic with database transactions
- **Real-time**: Immediate processing when posts are created/updated
- **Scalable**: Multiple worker processes can listen concurrently
- **Simple**: No external job queue infrastructure needed
- **Cost-effective**: Uses existing PostgreSQL infrastructure

### Event-Driven Architecture:

```sql
-- Database trigger for automatic event emission
CREATE OR REPLACE FUNCTION notify_embedding_needed()
RETURNS trigger AS $$
BEGIN
  -- Only notify if content changed or embedding is missing
  IF (TG_OP = 'INSERT' AND NEW.embedding IS NULL) OR
     (TG_OP = 'UPDATE' AND (
       OLD.title != NEW.title OR 
       OLD.content != NEW.content OR 
       (OLD.embedding IS NOT NULL AND NEW.embedding IS NULL)
     )) THEN
    
    PERFORM pg_notify('embedding_needed', json_build_object(
      'postId', NEW.id,
      'operation', TG_OP,
      'priority', CASE WHEN NEW.embedding IS NULL THEN 'high' ELSE 'normal' END
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Install trigger
CREATE TRIGGER posts_embedding_trigger
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_embedding_needed();
```

## Phase 1: Service Layer & Event-Driven Processing ✅ **COMPLETE**

### 1.1 PostgreSQL Trigger Setup ✅

The database trigger is already installed and working:

```sql
-- Function to notify when embeddings are needed
CREATE OR REPLACE FUNCTION notify_embedding_needed()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.embedding IS NULL) OR
     (TG_OP = 'UPDATE' AND (
       OLD.title IS DISTINCT FROM NEW.title OR 
       OLD.content IS DISTINCT FROM NEW.content OR 
       (OLD.embedding IS NOT NULL AND NEW.embedding IS NULL)
     )) THEN
    
    PERFORM pg_notify('embedding_needed', json_build_object(
      'postId', NEW.id,
      'operation', TG_OP,
      'priority', CASE WHEN NEW.embedding IS NULL THEN 'high' ELSE 'normal' END,
      'timestamp', extract(epoch from now())
    )::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger installed on posts table
CREATE TRIGGER posts_embedding_trigger
  AFTER INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_embedding_needed();
```

### 1.2 Embedding Worker Service ✅

**Implemented:** `workers/embedding-worker/`

A standalone Node.js service that:
- Listens for PostgreSQL NOTIFY events using `LISTEN embedding_needed`
- Generates embeddings via OpenAI's `text-embedding-3-small` model
- Updates posts with embeddings using efficient batch processing
- Provides health checks and monitoring endpoints
- Handles rate limiting, retries, and graceful shutdown

**Key Features:**
- Real-time processing of new/updated posts
- Automatic backfill processing on startup
- Rate limiting (100 requests/minute)
- Cost tracking and detailed logging
- Railway deployment ready with health checks

**Deployment:**
```bash
cd workers/embedding-worker
yarn install
yarn build

# Set environment variables:
# DATABASE_URL=<your_postgres_url>
# OPENAI_API_KEY=<your_openai_key>

yarn start  # or deploy to Railway
```

### 1.3 Architecture ✅

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL     │    │ Embedding Worker│
│                 │    │                  │    │                 │
│ POST /api/posts │───▶│ INSERT INTO      │───▶│ LISTEN          │
│                 │    │ posts            │    │ embedding_needed│
│                 │    │                  │    │                 │
│                 │    │ TRIGGER fires    │    │ Process Event   │
│                 │    │ NOTIFY           │    │                 │
│                 │    │                  │    │ OpenAI API      │
│                 │    │                  │◀───│ UPDATE posts    │
│                 │    │                  │    │ SET embedding   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Next Steps:**
1. Deploy embedding worker to Railway with environment variables
2. Test with existing posts to generate embeddings
3. Proceed to Phase 2: Semantic Search Implementation

## Phase 2: Semantic Search Implementation 🔍

### 2.1 Enhanced Search API

**File:** `src/app/api/search/posts/route.ts` (modify existing)

**Current State:** Uses basic ILIKE pattern matching
```sql
WHERE (p.title ILIKE '%query%' OR p.content ILIKE '%query%')
```

**Enhanced Implementation:**
```typescript
async function searchPostsHandler(req: AuthenticatedRequest) {
  const useSemanticSearch = searchParams.get('semantic') !== 'false'; // Default to semantic
  const fallbackToKeyword = searchParams.get('fallback') !== 'false'; // Allow fallback
  
  // Try semantic search first
  if (useSemanticSearch && searchQuery.length >= 3) {
    try {
      const semanticResults = await performSemanticSearch(
        searchQuery, 
        currentCommunityId, 
        accessibleBoardIds,
        limit
      );
      
      if (semanticResults.length > 0) {
        return NextResponse.json(semanticResults);
      }
    } catch (error) {
      console.warn('[Search] Semantic search failed, falling back:', error);
      // Continue to keyword fallback
    }
  }
  
  // Fallback to existing ILIKE search
  if (fallbackToKeyword) {
    return performTraditionalSearch(searchQuery, accessibleBoardIds, limit);
  }
  
  return NextResponse.json([]);
}
```

### 2.2 Semantic Search Query Implementation

**Function:** `performSemanticSearch()`

**SQL Query Strategy:**
```sql
-- Hybrid ranking: semantic similarity + traditional signals
WITH semantic_results AS (
  SELECT 
    p.*,
    u.name as author_name,
    u.profile_picture_url as author_profile_picture_url,
    b.name as board_name,
    b.id as board_id,
    c.community_short_id,
    c.plugin_id,
    c.name as community_name,
    -- Semantic similarity score (0-1, higher is better)
    (1 - (p.embedding <-> $1)) as similarity_score,
    -- Traditional ranking signals
    (
      -- Upvote boost (logarithmic to prevent dominance)
      LOG(1 + p.upvote_count) * 0.1 +
      -- Recency boost (favor recent posts slightly)
      EXTRACT(EPOCH FROM (NOW() - p.created_at)) / -86400 * 0.05 +
      -- Comment activity boost
      LOG(1 + p.comment_count) * 0.05
    ) as boost_score
  FROM posts p 
  JOIN users u ON p.author_user_id = u.user_id
  JOIN boards b ON p.board_id = b.id
  JOIN communities c ON b.community_id = c.id
  WHERE 
    b.community_id = $2 
    AND p.board_id = ANY($3)  -- Respect board permissions
    AND p.embedding IS NOT NULL  -- Only posts with embeddings
    AND (1 - (p.embedding <-> $1)) > 0.3  -- Minimum similarity threshold
)
SELECT * FROM semantic_results
ORDER BY (
  similarity_score * 0.7 +     -- 70% semantic relevance
  boost_score * 0.3            -- 30% traditional signals
) DESC
LIMIT $4
```

**Parameters:**
- `$1`: Query embedding (vector)
- `$2`: Community ID
- `$3`: Accessible board IDs array
- `$4`: Result limit

### 2.3 AI Function Integration

**File:** `src/lib/ai/functions/semanticSearch.ts`

**Purpose:** Extend existing AI chat assistant with semantic search capability

**Implementation:**
```typescript
export const semanticSearch: AIFunctionCall = {
  name: 'semanticSearch',
  description: 'Search posts using semantic similarity for better conceptual matches',
  parameters: z.object({
    query: z.string().describe('Search query for finding conceptually related posts'),
    limit: z.number().optional().default(5).describe('Maximum results to return')
  }),
  execute: async (params, context) => {
    try {
      // Generate query embedding
      const queryEmbedding = await EmbeddingService.embedQuery(params.query);
      
      // Perform semantic search with board permissions
      const accessibleBoardIds = await getAccessibleBoardIds(
        context.communityId, 
        context.userRoles || [], 
        context.isAdmin || false
      );
      
      const results = await performSemanticSearch(
        params.query,
        context.communityId,
        accessibleBoardIds,
        params.limit
      );
      
      return {
        type: 'semantic_search_results',
        success: true,
        messageForAI: `Found ${results.length} semantically related posts for "${params.query}"`,
        searchResults: results.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content.substring(0, 200) + '...',
          author: post.author_name,
          board: post.board_name,
          upvotes: post.upvote_count,
          similarity: Math.round(post.similarity_score * 100),
          url: buildPostUrl(post.id, post.board_id),
          created_at: post.created_at
        }))
      };
    } catch (error) {
      console.error('[AI Semantic Search] Error:', error);
      return {
        type: 'semantic_search_results',
        success: false,
        messageForAI: `Semantic search failed for "${params.query}". ${error.message}`,
        searchResults: []
      };
    }
  }
};
```

**Registration:** Add to `src/lib/ai/registry/functionRegistry.ts`

## Phase 3: UI Enhancement & Optimization 🎨

### 3.1 Search UI Improvements

**Files to Enhance:**
- `src/components/search/GlobalSearchModal.tsx`
- `src/components/voting/SearchFirstPostInput.tsx`

**Features to Add:**
1. **Semantic relevance indicators**
   ```tsx
   <div className="flex items-center gap-2">
     <span className="text-sm text-muted-foreground">
       {Math.round(result.similarity_score * 100)}% match
     </span>
     <Badge variant={result.similarity_score > 0.8 ? 'default' : 'secondary'}>
       {result.similarity_score > 0.8 ? 'Highly Relevant' : 'Related'}
     </Badge>
   </div>
   ```

2. **Search mode toggle**
   ```tsx
   <div className="flex items-center gap-2 mb-4">
     <Label>Search Mode:</Label>
     <Select value={searchMode} onValueChange={setSearchMode}>
       <SelectItem value="semantic">Smart Search</SelectItem>
       <SelectItem value="keyword">Keyword Search</SelectItem>
       <SelectItem value="hybrid">Both</SelectItem>
     </Select>
   </div>
   ```

3. **Result categorization**
   ```tsx
   {semanticResults.length > 0 && (
     <div className="mb-4">
       <h3 className="font-semibold mb-2">🧠 Conceptually Related</h3>
       <SearchResultsList results={semanticResults} />
     </div>
   )}
   {keywordResults.length > 0 && (
     <div>
       <h3 className="font-semibold mb-2">🔍 Keyword Matches</h3>
       <SearchResultsList results={keywordResults} />
     </div>
   )}
   ```

### 3.2 Performance Monitoring

**File:** `src/lib/monitoring/SearchAnalytics.ts`

**Metrics to Track:**
```typescript
interface SearchMetrics {
  queryType: 'semantic' | 'keyword' | 'hybrid';
  query: string;
  resultsCount: number;
  responseTime: number;
  userId: string;
  communityId: string;
  clicked: boolean;
  clickedResultId?: number;
  timestamp: Date;
}

export class SearchAnalytics {
  static async logSearch(metrics: SearchMetrics): Promise<void>
  static async getSearchEffectiveness(timeRange: 'day' | 'week' | 'month'): Promise<SearchEffectivenessReport>
}
```

**Integration:** Add tracking calls to search endpoints and UI components

### 3.3 Caching Layer

**File:** `src/lib/cache/EmbeddingCache.ts`

**Purpose:** Cache query embeddings to reduce API calls

**Implementation:**
```typescript
// In-memory cache for frequent queries
const queryEmbeddingCache = new Map<string, {
  embedding: number[];
  timestamp: number;
  hits: number;
}>();

export class EmbeddingCache {
  static async getQueryEmbedding(query: string): Promise<number[]> {
    const cached = queryEmbeddingCache.get(query);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60) { // 1 hour TTL
      cached.hits++;
      return cached.embedding;
    }
    
    const embedding = await EmbeddingService.embedQuery(query);
    queryEmbeddingCache.set(query, {
      embedding,
      timestamp: Date.now(),
      hits: 1
    });
    
    return embedding;
  }
}
```

## Phase 4: Advanced Features 🚀

### 4.1 Search Analytics & Insights

**Database Table:**
```sql
CREATE TABLE search_analytics (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  community_id TEXT REFERENCES communities(id),
  query TEXT NOT NULL,
  search_type VARCHAR(20) NOT NULL, -- 'semantic', 'keyword', 'hybrid'
  results_count INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  clicked_result_id INTEGER REFERENCES posts(id),
  clicked_position INTEGER, -- Position in results (1-based)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Related Posts Feature

**Component:** `src/components/posts/RelatedPosts.tsx`

**Purpose:** Show semantically similar posts on post detail pages

**Query:**
```sql
SELECT p.*, (1 - (p.embedding <-> $1)) as similarity
FROM posts p
WHERE p.id != $2 
  AND p.board_id = ANY($3)
  AND p.embedding IS NOT NULL
  AND (1 - (p.embedding <-> $1)) > 0.4
ORDER BY similarity DESC
LIMIT 5
```

### 4.3 Semantic Tag Suggestions

**Feature:** When creating posts, suggest relevant tags based on content similarity

**Implementation:**
```typescript
// In post creation flow
const suggestTags = async (title: string, content: string) => {
  const embedding = await EmbeddingService.embedQuery(`${title}\n${content}`);
  
  // Find similar posts and extract their tags
  const similarPosts = await findSimilarPosts(embedding, communityId, 20);
  const tagFrequency = calculateTagFrequency(similarPosts);
  
  return tagFrequency.slice(0, 5); // Top 5 suggested tags
};
```

## Implementation Checklist

### Phase 1: Foundation ✅ **COMPLETE** (Week 1)
- [x] Database migration complete
- [x] Docker setup with pgvector
- [x] PostgreSQL trigger and notification function
- [x] EmbeddingService implementation
- [x] Standalone embedding worker service
- [x] Real-time embedding processing
- [x] Health checks and monitoring
- [x] Railway deployment configuration

### Phase 2: Core Search 🔄 (Week 2)
- [ ] Enhanced search API with semantic support
- [ ] Hybrid ranking algorithm
- [ ] AI function integration
- [ ] Fallback mechanism implementation
- [ ] Performance testing

### Phase 3: Polish & UX 📋 (Week 3)
- [ ] UI enhancements for relevance display
- [ ] Search mode toggles
- [ ] Caching implementation
- [ ] Analytics integration
- [ ] Error handling refinement

### Phase 4: Advanced Features 📋 (Future)
- [ ] Related posts component
- [ ] Semantic tag suggestions
- [ ] Search analytics dashboard
- [ ] A/B testing framework

## Key Integration Points

### Existing Systems to Preserve
1. **Board Permissions:** All search results must respect `getAccessibleBoardIds()`
2. **AI Chat Assistant:** Extend with semantic search function
3. **Cost Tracking:** Use existing `ai_usage_logs` table pattern
4. **Error Handling:** Follow established patterns in `withAuthAndErrorHandling`
5. **Real-time Updates:** No disruption to existing Socket.IO functionality

### Environment Variables to Add
```bash
# Embedding configuration
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
SEMANTIC_SEARCH_SIMILARITY_THRESHOLD=0.3
EMBEDDING_CACHE_TTL_HOURS=1

# Performance tuning
SEMANTIC_SEARCH_MAX_RESULTS=50
BACKFILL_BATCH_SIZE=50
EMBEDDING_RATE_LIMIT_PER_MINUTE=100
```

### Testing Strategy
1. **Unit Tests:** EmbeddingService methods
2. **Integration Tests:** Search API with real embeddings
3. **Performance Tests:** Query response times with 10K+ posts
4. **Cost Monitoring:** Track actual OpenAI usage vs estimates
5. **User Testing:** A/B test semantic vs keyword search effectiveness

## Expected Performance & Cost

### Performance Targets
- **Search Response Time:** <200ms end-to-end
- **Embedding Generation:** <500ms per post
- **Backfill Completion:** ~30 minutes for 10K posts
- **Query Throughput:** 100+ searches/second supported

### Cost Projections
- **Initial Backfill:** $0.10-$0.20 one-time
- **Ongoing Costs:** $0.15/month for new posts + $0.006/month for queries
- **Total Monthly:** <$1 even with heavy usage
- **ROI:** Massive search quality improvement for minimal cost

## Success Metrics

### Technical Metrics
- Search accuracy improvement: 10x better conceptual matches
- User engagement: Increased click-through on search results
- Performance: <200ms search response times maintained
- Cost efficiency: <$5/month total AI costs

### User Experience Metrics
- Reduced "no results found" scenarios
- Higher user satisfaction with search relevance
- Increased time spent engaging with found content
- Better discovery of related discussions

## Handoff Notes for Continuation

### Critical Dependencies
1. **OpenAI API Key:** Must have access to embeddings endpoint
2. **pgvector Extension:** Already enabled and tested
3. **Database Schema:** Posts table ready with embedding column
4. **Existing Patterns:** Follow service layer patterns in `src/services/`

### First Implementation Step
Start with `EmbeddingService.ts` - this is the foundation for everything else. The service should:
1. Handle OpenAI embedding API calls
2. Manage database operations for embeddings
3. Provide both single and batch processing
4. Include proper error handling and logging

### Key Architectural Decisions Made
1. **Model Choice:** text-embedding-3-small for cost/performance balance
2. **Storage:** Direct column in posts table (not separate table)
3. **Indexing:** HNSW for best query performance
4. **Ranking:** 70% semantic + 30% traditional signals
5. **Fallback:** Always preserve existing keyword search

This plan provides a complete roadmap from current state to production-ready semantic search with dramatic relevance improvements at minimal cost. 