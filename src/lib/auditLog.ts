/**
 * Audit logging utilities for role management operations
 * 
 * These functions prepare audit log entries but don't write to database yet.
 * When ready, we can add a database table and enable actual logging.
 */

export interface AuditLogEntry {
  id?: string;
  action: 'role_change' | 'status_change' | 'user_invite' | 'user_remove' | 'ownership_transfer';
  actor_user_id: string;
  target_user_id: string;
  community_id: string;
  details: {
    previous_role?: string;
    new_role?: string;
    previous_status?: string;
    new_status?: string;
    reason?: string;
    metadata?: Record<string, any>;
  };
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Create an audit log entry for role changes
 */
export function createRoleChangeAuditLog(
  actorUserId: string,
  targetUserId: string,
  communityId: string,
  previousRole: string,
  newRole: string,
  reason?: string,
  metadata?: Record<string, any>
): AuditLogEntry {
  return {
    action: 'role_change',
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    community_id: communityId,
    details: {
      previous_role: previousRole,
      new_role: newRole,
      reason,
      metadata
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an audit log entry for status changes
 */
export function createStatusChangeAuditLog(
  actorUserId: string,
  targetUserId: string,
  communityId: string,
  previousStatus: string,
  newStatus: string,
  reason?: string
): AuditLogEntry {
  return {
    action: 'status_change',
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    community_id: communityId,
    details: {
      previous_status: previousStatus,
      new_status: newStatus,
      reason
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Create an audit log entry for ownership transfers
 */
export function createOwnershipTransferAuditLog(
  actorUserId: string,
  targetUserId: string,
  communityId: string,
  reason?: string
): AuditLogEntry {
  return {
    action: 'ownership_transfer',
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    community_id: communityId,
    details: {
      previous_role: 'owner',
      new_role: 'admin', // Previous owner becomes admin
      reason
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Log audit entry (currently just console.log, will write to database later)
 */
export async function logAuditEntry(entry: AuditLogEntry): Promise<void> {
  // TODO: Write to audit_logs table when ready
  console.log('[AUDIT]', JSON.stringify(entry, null, 2));
  
  // Future implementation:
  // await query(
  //   `INSERT INTO audit_logs (action, actor_user_id, target_user_id, community_id, details, created_at)
  //    VALUES ($1, $2, $3, $4, $5, $6)`,
  //   [entry.action, entry.actor_user_id, entry.target_user_id, entry.community_id, JSON.stringify(entry.details), entry.timestamp]
  // );
}

/**
 * Role hierarchy and permissions
 */
export const ROLE_HIERARCHY = {
  owner: 3,
  moderator: 2,
  member: 1
} as const;

export type Permission = 'assign_moderator' | 'assign_member' | 'ban_user' | 'transfer_ownership' | 'remove_user';

export const ROLE_PERMISSIONS: Record<CommunityRole, Permission[]> = {
  owner: ['assign_moderator', 'assign_member', 'ban_user', 'transfer_ownership', 'remove_user'],
  moderator: ['assign_member', 'ban_user', 'remove_user'],
  member: []
};

export type CommunityRole = keyof typeof ROLE_HIERARCHY;
export type CommunityStatus = 'active' | 'pending' | 'banned' | 'left';

/**
 * Check if an actor can perform an action on a target user
 */
export function canActorModifyTarget(
  actorRole: CommunityRole,
  targetRole: CommunityRole,
  action: Permission
): { allowed: boolean; reason?: string } {
  // Can't modify yourself (should be handled at API level)
  const actorLevel = ROLE_HIERARCHY[actorRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  
  // Must have higher role level to modify someone
  if (actorLevel <= targetLevel) {
    return {
      allowed: false,
      reason: `${actorRole} cannot modify ${targetRole} (insufficient permissions)`
    };
  }
  
  // Check specific permission
  const permissions = ROLE_PERMISSIONS[actorRole];
  if (!permissions.includes(action)) {
    return {
      allowed: false,
      reason: `${actorRole} does not have permission for ${action}`
    };
  }
  
  return { allowed: true };
}

/**
 * Validate role assignment
 */
export function validateRoleAssignment(
  actorRole: CommunityRole,
  targetCurrentRole: CommunityRole,
  newRole: CommunityRole
): { valid: boolean; reason?: string } {
  // Check if actor can assign the new role
  const assignPermission = `assign_${newRole}` as Permission;
  const canAssign = canActorModifyTarget(actorRole, targetCurrentRole, assignPermission);
  if (!canAssign.allowed) {
    return { valid: false, reason: canAssign.reason };
  }
  
  // Owners can only be created by ownership transfer, not direct assignment
  if (newRole === 'owner') {
    return {
      valid: false,
      reason: 'Owner role can only be assigned through ownership transfer'
    };
  }
  
  return { valid: true };
} 