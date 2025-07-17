# 🔄 Role System Migration Plan

## Overview
This document outlines the critical migration from the legacy `communities.owner_user_id` system to the standardized `user_communities` role system, aligning the forum with the host service.

## 🚨 Critical Changes Made

### 1. **Session API Updated**
- **Before**: Used `communities.owner_user_id` for admin determination
- **After**: Uses `user_communities.role` with `status = 'active'`
- **Impact**: Admin privileges now granted to `owner` and `moderator` roles

### 2. **Role Hierarchy Simplified**
- **Before**: `owner(4) > admin(3) > moderator(2) > member(1)`
- **After**: `owner(3) > moderator(2) > member(1)`
- **Impact**: `admin` role eliminated, moderators get elevated permissions

### 3. **Permission Logic Updated**
- All permission checks now use `user_communities` table
- Always check `status = 'active'`
- Role hierarchy enforced consistently

## 📊 Data Migration Requirements

### Phase 1: Identify Legacy Data
```sql
-- Find communities with owner_user_id but no owner in user_communities
SELECT 
  c.id as community_id,
  c.name as community_name,
  c.owner_user_id,
  uc.role as existing_role
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id 
  AND c.owner_user_id = uc.user_id 
  AND uc.status = 'active'
WHERE c.owner_user_id IS NOT NULL 
  AND uc.role IS NULL;
```

### Phase 2: Migrate Owner Data
```sql
-- Insert missing owners into user_communities
INSERT INTO user_communities (
  user_id, 
  community_id, 
  role, 
  status, 
  first_visited_at, 
  last_visited_at, 
  visit_count
)
SELECT 
  c.owner_user_id,
  c.id,
  'owner',
  'active',
  c.created_at,
  COALESCE(c.updated_at, c.created_at),
  1
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id 
  AND c.owner_user_id = uc.user_id
WHERE c.owner_user_id IS NOT NULL 
  AND uc.user_id IS NULL;
```

### Phase 3: Handle Role Conflicts
```sql
-- Update existing non-owner roles to owner for legitimate owners
UPDATE user_communities 
SET role = 'owner', updated_at = NOW()
FROM communities c
WHERE user_communities.user_id = c.owner_user_id
  AND user_communities.community_id = c.id
  AND user_communities.role != 'owner'
  AND user_communities.status = 'active'
  AND c.owner_user_id IS NOT NULL;
```

## 🔧 API Alignment

### Session API Changes
- ✅ **Fixed**: Role-based admin detection using `user_communities`
- ✅ **Fixed**: Proper `status = 'active'` checking
- ✅ **Enhanced**: Better error handling and logging

### Role Management API
- ✅ **Updated**: 3-role hierarchy (owner/moderator/member)
- ✅ **Fixed**: Permission validation using new hierarchy
- ✅ **Enhanced**: Audit logging for role changes

### Permission Checking
- ✅ **Standardized**: All APIs use `user_communities` table
- ✅ **Secured**: Always check `status = 'active'`
- ✅ **Validated**: Role hierarchy enforced consistently

## ⚠️ Breaking Changes

### 1. **Admin Role Removed**
- No more `admin` role in the system
- Existing `admin` users should be migrated to `moderator`
- Forum admin privileges now granted to `owner` + `moderator`

### 2. **Permission Logic Changed**
- Owner + Moderator = Forum admin privileges
- Member = Basic access only
- All checks now use `user_communities` table

### 3. **Legacy Field Deprecated**
- `communities.owner_user_id` no longer used
- All ownership determined via `user_communities.role = 'owner'`

## 🧪 Testing Checklist

### Authentication Testing
- [ ] Community owner can access admin dashboard
- [ ] Community moderator can access admin dashboard  
- [ ] Community member cannot access admin features
- [ ] User not in community gets proper access denial

### Role Management Testing
- [ ] Owner can assign moderator roles
- [ ] Owner can assign member roles
- [ ] Moderator can assign member roles
- [ ] Moderator cannot assign owner roles
- [ ] Member cannot assign any roles

### Permission Testing
- [ ] Board access respects community roles
- [ ] Post creation respects role permissions
- [ ] Comment moderation works for owner/moderator
- [ ] Lock management restricted to appropriate roles

## 🚀 Deployment Strategy

### Pre-Deployment
1. **Data Audit**: Run Phase 1 query to identify legacy data
2. **Backup**: Full database backup before migration
3. **Test Environment**: Validate all changes in staging

### Deployment
1. **Code Deploy**: Deploy role system changes
2. **Data Migration**: Run Phase 2 & 3 SQL scripts
3. **Verification**: Confirm all communities have proper owners

### Post-Deployment
1. **Monitor**: Check logs for permission errors
2. **Validate**: Test role management in production
3. **Support**: Address any community access issues

## 📋 SQL Scripts for Production

### Migration Script
```sql
-- Step 1: Migrate community owners
INSERT INTO user_communities (
  user_id, community_id, role, status, 
  first_visited_at, last_visited_at, visit_count
)
SELECT 
  c.owner_user_id, c.id, 'owner', 'active',
  c.created_at, COALESCE(c.updated_at, c.created_at), 1
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id 
  AND c.owner_user_id = uc.user_id
WHERE c.owner_user_id IS NOT NULL AND uc.user_id IS NULL;

-- Step 2: Fix existing owner roles
UPDATE user_communities 
SET role = 'owner', updated_at = NOW()
FROM communities c
WHERE user_communities.user_id = c.owner_user_id
  AND user_communities.community_id = c.id
  AND user_communities.role != 'owner'
  AND user_communities.status = 'active'
  AND c.owner_user_id IS NOT NULL;

-- Step 3: Verify migration
SELECT 
  'Migration Complete' as status,
  COUNT(*) as communities_with_owners
FROM communities c
JOIN user_communities uc ON c.id = uc.community_id
WHERE uc.role = 'owner' AND uc.status = 'active';
```

## 🎯 Success Criteria

1. **Zero Legacy Usage**: No code references `owner_user_id`
2. **Full Role Coverage**: Every active community has an owner in `user_communities`
3. **Permission Consistency**: All admin checks use role-based system
4. **Host Service Alignment**: Role system matches host service exactly

## 📞 Support & Rollback

### If Issues Arise
1. **Immediate**: Check logs for permission errors
2. **Investigate**: Verify user_communities data integrity
3. **Fix**: Run corrective SQL if needed
4. **Last Resort**: Rollback to previous deployment

### Emergency Queries
```sql
-- Find communities without owners
SELECT c.id, c.name 
FROM communities c
LEFT JOIN user_communities uc ON c.id = uc.community_id 
  AND uc.role = 'owner' AND uc.status = 'active'
WHERE uc.user_id IS NULL;

-- Find users who lost access
SELECT DISTINCT u.user_id, u.name, c.name as community
FROM users u
JOIN communities c ON u.user_id = c.owner_user_id
LEFT JOIN user_communities uc ON u.user_id = uc.user_id 
  AND c.id = uc.community_id AND uc.status = 'active'
WHERE uc.user_id IS NULL;
```

---

**Status**: ✅ **READY FOR DEPLOYMENT**  
**Priority**: 🚨 **CRITICAL - System Alignment Required**  
**Impact**: 🔄 **Breaking Changes - Requires Migration** 