# Identity Gating Phase 2: Backend Implementation & Enforcement Plan

## Overview

This document outlines Phase 2 implementation: creating a DRY, abstract permission enforcement library and integrating it across all relevant API endpoints with sensible defaults.

## 🎯 **Core Requirements**

1. **DRY Abstract Library** - Importable permission service for all endpoints
2. **Sensible Defaults** - When communities have no identity gating configured
3. **Identity Type Detection** - Determine user's identity from auth context
4. **Universal Enforcement** - Apply permissions to all relevant actions
5. **Backward Compatibility** - Work with existing communities seamlessly

## 🏗️ **Architecture Design**

### **1. Identity Permission Service**

Central library that handles all identity-based permission logic:

```typescript
// src/lib/permissions/IdentityPermissionService.ts
export class IdentityPermissionService {
  /**
   * Check if a user can perform an action in a community
   */
  static async canUserPerformAction(
    userId: string,
    communityId: string,
    action: 'join' | 'post' | 'comment' | 'upvote' | 'react'
  ): Promise<boolean>

  /**
   * Get user's identity type from auth context
   */
  static async getUserIdentityType(userId: string): Promise<IdentityType>

  /**
   * Get community's identity gating settings with defaults
   */
  static async getCommunityIdentityGating(
    communityId: string
  ): Promise<CommunityIdentityGating>

  /**
   * Get default permissions for identity type (when no community settings)
   */
  static getDefaultPermissions(identityType: IdentityType): IdentityPermissions
}
```

### **2. User Identity Detection**

Determine identity type from multiple sources:

```typescript
async function getUserIdentityType(userId: string): Promise<IdentityType> {
  // 1. Check authentication_sessions table for recent session
  const recentSession = await query(`
    SELECT identity_type FROM authentication_sessions 
    WHERE user_id = $1 AND is_active = true AND expires_at > NOW()
    ORDER BY last_accessed_at DESC LIMIT 1
  `, [userId]);
  
  if (recentSession.rows.length > 0) {
    return recentSession.rows[0].identity_type;
  }
  
  // 2. Check users table for stored identity type
  const user = await query(`
    SELECT identity_type FROM users WHERE user_id = $1
  `, [userId]);
  
  if (user.rows.length > 0) {
    return user.rows[0].identity_type || 'legacy';
  }
  
  // 3. Default fallback
  return 'legacy';
}
```

### **3. Default Permission Policy**

When communities have no `identityGating` configured:

```typescript
const DEFAULT_COMMUNITY_POLICY: CommunityIdentityGating = {
  canJoinCommunity: {
    legacy: true,           // CG users can join
    ens: true,              // ENS users can join  
    universal_profile: true, // UP users can join
    anonymous: true         // Anonymous users can join (welcoming!)
  },
  permissions: {
    legacy: {
      canPost: true,
      canComment: true, 
      canUpvote: true,
      canReact: true,
      canJoinCommunity: true
    },
    ens: {
      canPost: true,
      canComment: true,
      canUpvote: true, 
      canReact: true,
      canJoinCommunity: true
    },
    universal_profile: {
      canPost: true,
      canComment: true,
      canUpvote: true,
      canReact: true,
      canJoinCommunity: true
    },
    anonymous: {
      canPost: false,         // Anonymous cannot post by default
      canComment: false,      // Anonymous cannot comment by default  
      canUpvote: true,        // Anonymous can upvote (low risk)
      canReact: true,         // Anonymous can react (low risk)
      canJoinCommunity: true  // Anonymous can join (welcoming!)
    }
  }
};
```

## 📋 **Implementation Steps**

### **Step 2.1: Create Identity Permission Service** (Week 1)

#### **Core Service Implementation**
- [ ] Create `src/lib/permissions/IdentityPermissionService.ts`
- [ ] Implement user identity type detection
- [ ] Implement community settings fetching with defaults
- [ ] Add permission checking logic
- [ ] Add comprehensive TypeScript types

#### **Utility Functions**
- [ ] Create `getUserIdentityType()` function
- [ ] Create `getCommunityIdentityGating()` function  
- [ ] Create `getDefaultPermissions()` function
- [ ] Add caching layer for performance

#### **Testing Infrastructure**
- [ ] Unit tests for all permission logic
- [ ] Integration tests with database
- [ ] Mock data for different identity types

### **Step 2.2: Database Schema Migration** (Week 1)

#### **Communities Table Update**
```sql
-- Add identity_gating field to communities table
ALTER TABLE communities 
ADD COLUMN identity_gating JSONB DEFAULT NULL;

-- Add GIN index for performance
CREATE INDEX idx_communities_identity_gating 
ON communities USING gin (identity_gating);

-- Add constraint to validate identity_gating structure
ALTER TABLE communities 
ADD CONSTRAINT check_identity_gating_structure 
CHECK (
  identity_gating IS NULL OR (
    identity_gating ? 'canJoinCommunity' AND 
    identity_gating ? 'permissions'
  )
);
```

#### **Migration Strategy**
- [ ] Create TypeScript migration file
- [ ] Test migration on development database
- [ ] Plan rollback strategy
- [ ] Document migration process

### **Step 2.3: API Enforcement Integration** (Week 2)

#### **Primary Endpoints to Update**

##### **Session/Authentication APIs**
```typescript
// src/app/api/auth/session/route.ts
// Check canJoinCommunity when creating community sessions

if (!await IdentityPermissionService.canUserPerformAction(
  userId, communityId, 'join'
)) {
  return NextResponse.json(
    { error: 'Your identity type cannot join this community' }, 
    { status: 403 }
  );
}
```

##### **Post Creation APIs**  
```typescript
// src/app/api/posts/route.ts (POST)
// src/app/api/posts/validate/route.ts

if (!await IdentityPermissionService.canUserPerformAction(
  userId, communityId, 'post'
)) {
  return NextResponse.json(
    { error: 'Your identity type cannot create posts in this community' },
    { status: 403 }
  );
}
```

##### **Comment APIs**
```typescript
// src/app/api/posts/[postId]/comments/route.ts (POST)

if (!await IdentityPermissionService.canUserPerformAction(
  userId, communityId, 'comment'
)) {
  return NextResponse.json(
    { error: 'Your identity type cannot comment in this community' },
    { status: 403 }
  );
}
```

##### **Voting APIs**
```typescript  
// src/app/api/posts/[postId]/votes/route.ts (POST)

if (!await IdentityPermissionService.canUserPerformAction(
  userId, communityId, 'upvote'
)) {
  return NextResponse.json(
    { error: 'Your identity type cannot upvote in this community' },
    { status: 403 }
  );
}
```

##### **Reaction APIs**
```typescript
// src/app/api/posts/[postId]/reactions/route.ts (POST)
// src/app/api/comments/[commentId]/reactions/route.ts (POST)

if (!await IdentityPermissionService.canUserPerformAction(
  userId, communityId, 'react'
)) {
  return NextResponse.json(
    { error: 'Your identity type cannot add reactions in this community' },
    { status: 403 }
  );
}
```

#### **Integration Pattern**
Each endpoint follows this pattern:
1. Extract user and community context
2. Call `IdentityPermissionService.canUserPerformAction()`
3. Return 403 with clear error message if denied
4. Continue with existing logic if allowed

### **Step 2.4: Frontend Permission Integration** (Week 2-3)

#### **Permission Hook**
```typescript
// src/hooks/useIdentityPermissions.ts
export const useIdentityPermissions = () => {
  const { user } = useAuth();
  
  const { data: permissions } = useQuery({
    queryKey: ['identityPermissions', user?.userId, user?.cid],
    queryFn: async () => {
      const response = await authFetchJson(
        `/api/me/identity-permissions?communityId=${user?.cid}`,
        { token }
      );
      return response.permissions;
    },
    enabled: !!user?.userId && !!user?.cid
  });
  
  return {
    canPost: permissions?.canPost ?? false,
    canComment: permissions?.canComment ?? false,
    canUpvote: permissions?.canUpvote ?? false,
    canReact: permissions?.canReact ?? false,
    canJoinCommunity: permissions?.canJoinCommunity ?? false,
    identityType: permissions?.identityType || 'anonymous'
  };
};
```

#### **UI Component Updates**
- [ ] **PostCard**: Hide/disable post creation button if `!canPost`
- [ ] **CommentForm**: Hide/disable comment form if `!canComment`  
- [ ] **VoteButton**: Hide/disable upvote button if `!canUpvote`
- [ ] **ReactionBar**: Hide/disable reactions if `!canReact`
- [ ] **Community Access**: Show join restrictions if `!canJoinCommunity`

#### **Error Handling**
- [ ] Add permission-specific error messages
- [ ] Show identity type and restrictions to users
- [ ] Provide upgrade paths (anonymous → verified)

### **Step 2.5: Community Settings API Updates** (Week 3)

#### **Settings API Enhancement**
```typescript
// src/app/api/communities/[communityId]/route.ts (PUT)
// Validate and save identity gating settings

const { identityGating } = await req.json();

if (identityGating) {
  // Validate structure
  const validation = IdentityGatingUtils.validateGatingConfig(identityGating);
  if (!validation.isValid) {
    return NextResponse.json({ 
      error: 'Invalid identity gating configuration',
      details: validation.errors 
    }, { status: 400 });
  }
}

// Save to database
await query(`
  UPDATE communities 
  SET 
    settings = $1,
    identity_gating = $2,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $3
`, [settings, identityGating, communityId]);
```

#### **Settings Migration Utility**
```typescript
// src/lib/permissions/IdentityGatingUtils.ts
export class IdentityGatingUtils {
  /**
   * Migrate legacy anonymousPermissions to identity gating
   */
  static migrateLegacySettings(
    oldSettings: CommunitySettings
  ): CommunityIdentityGating | null

  /**
   * Validate identity gating configuration
   */
  static validateGatingConfig(
    gating: CommunityIdentityGating
  ): { isValid: boolean; errors: string[] }
}
```

## 🔄 **Migration & Rollout Strategy**

### **Phase 2A: Infrastructure (Week 1)**
1. Deploy Identity Permission Service
2. Run database migration
3. Add new API endpoints
4. No enforcement yet - feature flagged

### **Phase 2B: Gradual Enforcement (Week 2)**  
1. Enable enforcement for new communities
2. Migrate existing anonymous permissions
3. Add frontend permission hooks
4. Monitor for issues

### **Phase 2C: Full Rollout (Week 3)**
1. Enable enforcement for all communities
2. Remove legacy anonymous permission code
3. Update documentation
4. Performance monitoring

## 🚨 **Edge Cases & Considerations**

### **1. Anonymous User Handling**
- Anonymous users may not have `user_id` in some contexts
- Need special handling for session-less requests
- Consider rate limiting for anonymous actions

### **2. Admin Override**
- Community admins should bypass identity restrictions
- Preserve existing admin permission logic
- Clear audit trail for admin actions

### **3. Performance Optimization**
- Cache community settings aggressively  
- Cache user identity types
- Minimize database calls per request
- Consider Redis for high-traffic communities

### **4. Error Handling**
- Graceful degradation when service is unavailable
- Clear error messages for different identity types
- Proper HTTP status codes (403 vs 401 vs 400)

### **5. Backward Compatibility**
- Existing communities with no settings work as before
- Legacy `anonymousPermissions` still respected during transition
- Gradual migration path for power users

## 📊 **Success Metrics**

### **Technical Metrics**
- [ ] Zero permission bypasses (security)
- [ ] <50ms average permission check time (performance)
- [ ] 99.9% uptime for permission service (reliability)
- [ ] 100% test coverage for permission logic (quality)

### **User Experience Metrics**  
- [ ] Clear error messages (UX feedback)
- [ ] No confused users about access restrictions (support tickets)
- [ ] Smooth migration for existing communities (adoption)

### **Business Metrics**
- [ ] Increased community engagement (anonymous users joining)
- [ ] Better content quality (selective posting permissions)
- [ ] Reduced moderation overhead (identity-based trust)

## 🔧 **Implementation Priorities**

### **High Priority (Must Have)**
1. ✅ Identity Permission Service core logic
2. ✅ Database migration
3. ✅ Post/Comment enforcement
4. ✅ Frontend permission hooks

### **Medium Priority (Should Have)**  
1. 🔄 Reaction/Vote enforcement
2. 🔄 Community join enforcement
3. 🔄 Performance optimization
4. 🔄 Error handling & UX

### **Low Priority (Nice to Have)**
1. 📋 Advanced caching strategies
2. 📋 Analytics and monitoring
3. 📋 A/B testing framework
4. 📋 Community analytics dashboard

---

## 🚀 **Ready for Review**

This plan provides:
- **DRY Architecture** with reusable IdentityPermissionService
- **Sensible Defaults** for communities without settings
- **Universal Enforcement** across all relevant endpoints  
- **Backward Compatibility** with existing systems
- **Clear Migration Path** with minimal disruption

**Next Step**: Review this plan and provide feedback before beginning Phase 2A implementation! 