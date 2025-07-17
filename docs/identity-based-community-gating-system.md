# Identity-Based Community Gating System - Research & Implementation Spec

## Executive Summary

This document specifies the transformation of Curia's community access control from role-based permissions to identity-based gating. The goal is to move from "what role can do X" to "what identity type can do X" including the fundamental ability to join communities in the first place.

## Current System Analysis

### **What Exists Today**

#### 1. **Plugin Access Control Panel** (TO BE REMOVED)
- **Purpose**: Role-based access gating to boards
- **Location**: `src/components/CommunityAccessForm.tsx`
- **Function**: Restricts entire forum plugin access to specific role IDs
- **Settings**: `CommunitySettings.permissions.allowedRoles[]`
- **UI**: Checkbox list of community roles with "Allow all" vs "Restricted to selected roles"

#### 2. **Anonymous User Permissions Panel** (TO BE EXPANDED)
- **Purpose**: Controls what anonymous users can do
- **Location**: `src/components/settings/AnonymousPermissionsSettings.tsx`
- **Current Permissions**: `canPost`, `canComment`, `canUpvote`, `canReact` (4 permissions)
- **Settings**: `CommunitySettings.anonymousPermissions`
- **UI**: Individual toggles for each permission with risk levels

#### 3. **Current Identity Types** (FROM DATABASE SCHEMA)
```typescript
type IdentityType = 'legacy' | 'ens' | 'universal_profile' | 'anonymous';
```

### **Current Permission Enforcement**

#### **NOT IMPLEMENTED YET** - Settings exist but are not enforced:
- Anonymous permissions are defined in settings but not checked anywhere
- Current enforcement is primarily role-based and board-level
- No identity-type-based gating exists in the codebase

## Proposed System Architecture

### **1. Identity-Based Community Gating**

Replace role-based access control with identity-based access control:

```typescript
interface CommunityIdentityGating {
  // Core community access
  canJoinCommunity: {
    legacy: boolean;        // Common Ground users
    ens: boolean;           // ENS domain holders
    universal_profile: boolean; // Universal Profile users
    anonymous: boolean;     // Anonymous users
  };
  
  // Activity permissions per identity type
  permissions: {
    legacy: IdentityPermissions;
    ens: IdentityPermissions;
    universal_profile: IdentityPermissions;
    anonymous: IdentityPermissions;
  };
}

interface IdentityPermissions {
  canPost: boolean;        // Create posts
  canComment: boolean;     // Comment on posts
  canUpvote: boolean;      // Upvote posts
  canReact: boolean;       // Add emoji reactions
  canJoinCommunity: boolean; // Join the community
  
  // Future permissions:
  // canCreateBoards: boolean;
  // canInviteUsers: boolean;
  // canModerate: boolean;
  // canAccessPrivateBoards: boolean;
}
```

### **2. Settings Schema Migration**

#### **Before (Current)**:
```typescript
interface CommunitySettings {
  permissions?: {
    allowedRoles?: string[]; // Role-based access
  };
  anonymousPermissions?: {
    canPost: boolean;
    canComment: boolean;
    canUpvote: boolean;
    canReact: boolean;
  };
}
```

#### **After (Proposed)**:
```typescript
interface CommunitySettings {
  // Remove role-based permissions entirely
  // permissions?: { allowedRoles?: string[]; } // REMOVED
  
  // Replace with identity-based gating
  identityGating?: CommunityIdentityGating;
  
  // Keep other settings unchanged
  ai?: { ... };
  hosting?: { ... };
  background?: { ... };
}
```

### **3. Default Permission Matrix**

Provide sensible defaults for different community types:

```typescript
const DEFAULT_PERMISSIONS: CommunityIdentityGating = {
  canJoinCommunity: {
    legacy: true,           // CG users can join
    ens: true,              // ENS users can join
    universal_profile: true, // UP users can join
    anonymous: false        // Anonymous users cannot join by default
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
      canPost: false,
      canComment: false,
      canUpvote: false,
      canReact: false,
      canJoinCommunity: false
    }
  }
};
```

### **4. Community Presets**

Provide common configurations for different use cases:

```typescript
const COMMUNITY_PRESETS = {
  OPEN_COMMUNITY: {
    name: "Open Community",
    description: "Anyone can join and participate",
    gating: {
      canJoinCommunity: { legacy: true, ens: true, universal_profile: true, anonymous: true },
      permissions: { /* all true */ }
    }
  },
  
  VERIFIED_ONLY: {
    name: "Verified Users Only",
    description: "Only users with blockchain identities can join",
    gating: {
      canJoinCommunity: { legacy: true, ens: true, universal_profile: true, anonymous: false },
      permissions: { /* verified users: all true, anonymous: all false */ }
    }
  },
  
  PREMIUM_COMMUNITY: {
    name: "Premium Community",
    description: "Only ENS and Universal Profile users can join",
    gating: {
      canJoinCommunity: { legacy: false, ens: true, universal_profile: true, anonymous: false },
      permissions: { /* ENS/UP: all true, others: all false */ }
    }
  },
  
  READ_ONLY_COMMUNITY: {
    name: "Read-Only Community",
    description: "Anyone can join but only verified users can post",
    gating: {
      canJoinCommunity: { legacy: true, ens: true, universal_profile: true, anonymous: true },
      permissions: {
        legacy: { canPost: true, canComment: true, canUpvote: true, canReact: true },
        ens: { canPost: true, canComment: true, canUpvote: true, canReact: true },
        universal_profile: { canPost: true, canComment: true, canUpvote: true, canReact: true },
        anonymous: { canPost: false, canComment: false, canUpvote: true, canReact: true }
      }
    }
  }
};
```

## Implementation Roadmap

### **Phase 1: UI Transformation (Week 1-2)**

#### **Step 1.1: Remove Plugin Access Control**
- [ ] Remove `CommunityAccessForm.tsx` component
- [ ] Remove Plugin Access Control section from `community-settings/page.tsx`
- [ ] Clean up related imports and references

#### **Step 1.2: Create Identity Gating Settings Component**
- [ ] Create `IdentityGatingSettings.tsx` component
- [ ] Design matrix UI for identity types vs permissions
- [ ] Add community presets dropdown
- [ ] Add permission explanations and risk indicators

#### **Step 1.3: Integrate New Component**
- [ ] Replace Anonymous Permissions section with Identity Gating section
- [ ] Update community settings page layout
- [ ] Add settings validation and error handling

### **Phase 2: Backend Schema & API (Week 2-3)**

#### **Step 2.1: Database Schema Migration**
- [ ] Create migration to add `identity_gating` field to communities table
- [ ] Update `CommunitySettings` TypeScript interface
- [ ] Add validation utilities for identity gating settings

#### **Step 2.2: API Updates**
- [ ] Update community settings API to handle identity gating
- [ ] Add settings migration utility (old → new format)
- [ ] Create identity gating validation functions

#### **Step 2.3: Settings Utilities**
- [ ] Create `IdentityGatingUtils` helper functions
- [ ] Add permission checking utilities
- [ ] Update existing `SettingsUtils` to work with new format

### **Phase 3: Permission Enforcement (Week 3-4)**

#### **Step 3.1: Community Join Enforcement**
- [ ] Update session API to check `canJoinCommunity` permissions
- [ ] Add identity-based community access validation
- [ ] Create proper error messages for rejected joins

#### **Step 3.2: Activity Permission Enforcement**
- [ ] Update post creation API to check `canPost` by identity type
- [ ] Update comment creation API to check `canComment` by identity type
- [ ] Update voting API to check `canUpvote` by identity type
- [ ] Update reactions API to check `canReact` by identity type

#### **Step 3.3: Frontend Permission Checks**
- [ ] Update UI components to hide/disable actions based on identity permissions
- [ ] Add permission-based error messages
- [ ] Update permission hooks to use identity-based checks

### **Phase 4: Migration & Cleanup (Week 4-5)**

#### **Step 4.1: Data Migration**
- [ ] Create migration script for existing communities
- [ ] Convert role-based settings to identity-based settings
- [ ] Handle edge cases and validation

#### **Step 4.2: Testing & Validation**
- [ ] Test all identity types in different community configurations
- [ ] Validate permission enforcement across all endpoints
- [ ] Test community join/leave flows

#### **Step 4.3: Documentation & Cleanup**
- [ ] Update API documentation
- [ ] Create user guides for new identity gating
- [ ] Remove deprecated code and comments

## Technical Implementation Details

### **1. Permission Checking Utility**

```typescript
// src/lib/permissions/IdentityGatingService.ts
export class IdentityGatingService {
  static canUserJoinCommunity(
    userIdentityType: IdentityType,
    communitySettings: CommunitySettings
  ): boolean {
    const gating = communitySettings.identityGating;
    if (!gating) return true; // Default: allow all
    
    return gating.canJoinCommunity[userIdentityType] ?? true;
  }
  
  static canUserPerformAction(
    userIdentityType: IdentityType,
    action: keyof IdentityPermissions,
    communitySettings: CommunitySettings
  ): boolean {
    const gating = communitySettings.identityGating;
    if (!gating) return true; // Default: allow all
    
    return gating.permissions[userIdentityType][action] ?? true;
  }
  
  static getEffectivePermissions(
    userIdentityType: IdentityType,
    communitySettings: CommunitySettings
  ): IdentityPermissions {
    const gating = communitySettings.identityGating;
    if (!gating) return DEFAULT_PERMISSIONS.permissions[userIdentityType];
    
    return gating.permissions[userIdentityType] ?? DEFAULT_PERMISSIONS.permissions[userIdentityType];
  }
}
```

### **2. API Enforcement Pattern**

```typescript
// Example: Post creation API
async function createPostHandler(req: AuthenticatedRequest) {
  const user = req.user;
  const userIdentityType = await getUserIdentityType(user.sub);
  
  // Get community settings
  const communitySettings = await getCommunitySettings(user.cid);
  
  // Check if user can post
  if (!IdentityGatingService.canUserPerformAction(
    userIdentityType,
    'canPost',
    communitySettings
  )) {
    return NextResponse.json(
      { error: 'Your identity type is not allowed to create posts in this community' },
      { status: 403 }
    );
  }
  
  // Continue with post creation...
}
```

### **3. Frontend Permission Hook**

```typescript
// src/hooks/useIdentityPermissions.ts
export const useIdentityPermissions = () => {
  const { user } = useAuth();
  const { data: communitySettings } = useQuery(/* ... */);
  
  const userIdentityType = user?.identityType || 'anonymous';
  
  const permissions = useMemo(() => {
    if (!communitySettings) return null;
    
    return IdentityGatingService.getEffectivePermissions(
      userIdentityType,
      communitySettings
    );
  }, [userIdentityType, communitySettings]);
  
  return {
    canPost: permissions?.canPost ?? false,
    canComment: permissions?.canComment ?? false,
    canUpvote: permissions?.canUpvote ?? false,
    canReact: permissions?.canReact ?? false,
    canJoinCommunity: permissions?.canJoinCommunity ?? false,
    identityType: userIdentityType
  };
};
```

## Migration Strategy

### **1. Backward Compatibility**

During the migration period, support both old and new formats:

```typescript
function getEffectivePermissions(communitySettings: CommunitySettings): IdentityPermissions {
  // New format takes precedence
  if (communitySettings.identityGating) {
    return communitySettings.identityGating.permissions;
  }
  
  // Fall back to old format
  if (communitySettings.anonymousPermissions) {
    return convertLegacyPermissions(communitySettings.anonymousPermissions);
  }
  
  // Default permissions
  return DEFAULT_PERMISSIONS.permissions;
}
```

### **2. Gradual Rollout**

1. **Phase 1**: Deploy UI changes with feature flag
2. **Phase 2**: Deploy backend changes with dual support
3. **Phase 3**: Migrate existing communities
4. **Phase 4**: Remove legacy support

## User Experience Considerations

### **1. Clear Permission Indicators**

- Show user's identity type in UI
- Display what permissions they have
- Clear error messages when actions are blocked

### **2. Community Onboarding**

- Explain identity types to new users
- Show community requirements before joining
- Provide clear upgrade paths (anonymous → verified)

### **3. Admin Experience**

- Intuitive permission matrix UI
- Community presets for common configurations
- Clear impact preview before saving changes

## Risk Assessment

### **High Risk**
- Breaking existing communities during migration
- Permission enforcement bypasses

### **Medium Risk**
- User confusion about identity types
- Performance impact of permission checks

### **Low Risk**
- UI/UX changes
- Migration complexity

## Success Metrics

### **Technical Metrics**
- [ ] Zero permission enforcement bypasses
- [ ] <100ms permission check performance
- [ ] 100% test coverage for permission logic

### **User Experience Metrics**
- [ ] Community admin satisfaction with new controls
- [ ] User understanding of identity-based permissions
- [ ] Reduced support tickets about access issues

## Next Steps

1. **Review this spec** with stakeholders
2. **Refine requirements** based on feedback
3. **Create detailed technical designs** for each phase
4. **Begin Phase 1 implementation** with UI transformation

---

*This document serves as the foundation for transitioning Curia from role-based to identity-based community gating. The implementation should be iterative, with careful attention to backward compatibility and user experience.* 