# Identity Permission Service Implementation

## Completed Phase 1: Core Library

### What's Done

1. **✅ IdentityPermissionService Class** (`src/lib/services/IdentityPermissionService.ts`)
   - Identity detection from session tokens
   - Permission checking with community-specific settings
   - Fallback to sensible defaults when no settings exist
   - DRY architecture for use across all APIs

2. **✅ Database Integration** 
   - Uses existing `settings` JSONB field in communities table
   - Extracts identity gating configuration from `settings.identityGating`
   - No migration needed - leverages existing database structure

3. **✅ Session API Integration** (`src/app/api/auth/session/route.ts`)
   - Added demo identity detection in session response
   - Shows identity type in session response for debugging

### Default Permission Policy

As requested:
- **Legacy/ENS/Universal Profile**: Full permissions (join, post, comment, upvote, react)
- **Anonymous**: Only join permission by default (no post, comment, upvote, react)

### Service API

```typescript
// Identity detection
const identity = await identityPermissionService.detectIdentity(sessionToken);

// Permission checking
const canPost = await identityPermissionService.canPost(sessionToken, communityId);
const canComment = await identityPermissionService.canComment(sessionToken, communityId);
const canUpvote = await identityPermissionService.canUpvote(sessionToken, communityId);
const canReact = await identityPermissionService.canReact(sessionToken, communityId);
const canJoin = await identityPermissionService.canJoinCommunity(sessionToken, communityId);

// Get all permissions at once
const permissions = await identityPermissionService.getUserPermissions(sessionToken, communityId);
```

### Phase 2 Complete: API Enforcement

**✅ Implemented identity permission enforcement in all key APIs:**

1. **Post Creation API** (`/api/posts` - POST)
   - Validates `canPost` permission before allowing post creation
   - Returns 403 with clear error message if denied

2. **Comment Creation API** (`/api/posts/[postId]/comments` - POST)
   - Validates `canComment` permission before allowing comment creation
   - Returns 403 with clear error message if denied

3. **Voting API** (`/api/posts/[postId]/votes` - POST)
   - Validates `canUpvote` permission before allowing upvotes
   - Returns 403 with clear error message if denied

4. **Post Reactions API** (`/api/posts/[postId]/reactions` - POST)
   - Validates `canReact` permission before allowing reactions
   - Returns 403 with clear error message if denied

5. **Comment Reactions API** (`/api/comments/[commentId]/reactions` - POST)
   - Validates `canReact` permission before allowing reactions
   - Returns 403 with clear error message if denied

**All APIs now enforce identity-based permissions with:**
- Clear logging of denied attempts
- Proper error messages with reasons
- Fast permission checks before expensive operations

### Usage Example

```typescript
import { identityPermissionService } from '@/lib/services/IdentityPermissionService';

// In any API endpoint
const canCreatePost = await identityPermissionService.canPost(sessionToken, communityId);
if (!canCreatePost.allowed) {
  return NextResponse.json({ error: canCreatePost.reason }, { status: 403 });
}

// Proceed with post creation...
```

The library is simple, fast, and ready for enforcement across all relevant endpoints. 