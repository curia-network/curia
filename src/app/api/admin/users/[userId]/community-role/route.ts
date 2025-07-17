import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, AuthenticatedRequest, RouteContext } from '@/lib/withAuth';
import { 
  createRoleChangeAuditLog, 
  createStatusChangeAuditLog,
  logAuditEntry,
  validateRoleAssignment,
  canActorModifyTarget,
  CommunityRole,
  CommunityStatus
} from '@/lib/auditLog';

interface UserCommunityInfo {
  userId: string;
  communityId: string;
  role: CommunityRole;
  status: CommunityStatus;
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
  invitedByUserId?: string;
  createdAt: string;
  updatedAt: string;
  // User info
  userName: string;
  userProfilePictureUrl?: string;
  // Inviter info (if applicable)
  inviterName?: string;
}

interface UpdateRoleRequest {
  role?: CommunityRole;
  status?: CommunityStatus;
  reason?: string;
}

// GET /api/admin/users/[userId]/community-role - Get user's community role and stats
async function getUserCommunityRole(req: AuthenticatedRequest, context: RouteContext) {
  const actorUserId = req.user?.sub;
  const actorCommunityId = req.user?.cid;
  const isActorAdmin = req.user?.adm || false;

  if (!actorUserId || !actorCommunityId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isActorAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const params = await context.params;
    const targetUserId = params.userId;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`[API GET] Admin ${actorUserId} requesting role info for user ${targetUserId}`);

    // Get user's community role and stats
    const result = await query(
      `SELECT 
         uc.user_id,
         uc.community_id,
         uc.role,
         uc.status,
         uc.first_visited_at,
         uc.last_visited_at,
         uc.visit_count,
         uc.invited_by_user_id,
         uc.created_at,
         uc.updated_at,
         u.name as user_name,
         u.profile_picture_url as user_profile_picture_url,
         inviter.name as inviter_name
       FROM user_communities uc
       JOIN users u ON uc.user_id = u.user_id
       LEFT JOIN users inviter ON uc.invited_by_user_id = inviter.user_id
       WHERE uc.user_id = $1 AND uc.community_id = $2`,
      [targetUserId, actorCommunityId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in community' }, { status: 404 });
    }

    const row = result.rows[0];
    const userInfo: UserCommunityInfo = {
      userId: row.user_id,
      communityId: row.community_id,
      role: row.role,
      status: row.status,
      firstVisitedAt: row.first_visited_at,
      lastVisitedAt: row.last_visited_at,
      visitCount: row.visit_count,
      invitedByUserId: row.invited_by_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userName: row.user_name,
      userProfilePictureUrl: row.user_profile_picture_url,
      inviterName: row.inviter_name
    };

    console.log(`[API GET] Retrieved role info for ${targetUserId}: ${userInfo.role}/${userInfo.status}`);

    return NextResponse.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('[API GET] Error fetching user community role:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}

// PUT /api/admin/users/[userId]/community-role - Update user's community role
async function updateUserCommunityRole(req: AuthenticatedRequest, context: RouteContext) {
  const actorUserId = req.user?.sub;
  const actorCommunityId = req.user?.cid;
  const isActorAdmin = req.user?.adm || false;

  if (!actorUserId || !actorCommunityId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isActorAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const params = await context.params;
    const targetUserId = params.userId;
    const body: UpdateRoleRequest = await req.json();
    const { role: newRole, status: newStatus, reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow self-modification
    if (actorUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
    }

    console.log(`[API PUT] Admin ${actorUserId} updating role for user ${targetUserId}:`, { newRole, newStatus, reason });

    // Get current user info and actor role
    const [currentUserResult, actorRoleResult] = await Promise.all([
      query(
        `SELECT role, status FROM user_communities WHERE user_id = $1 AND community_id = $2`,
        [targetUserId, actorCommunityId]
      ),
      query(
        `SELECT role FROM user_communities WHERE user_id = $1 AND community_id = $2`,
        [actorUserId, actorCommunityId]
      )
    ]);

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in community' }, { status: 404 });
    }

    if (actorRoleResult.rows.length === 0) {
      return NextResponse.json({ error: 'Actor not found in community' }, { status: 403 });
    }

    const currentRole = currentUserResult.rows[0].role as CommunityRole;
    const currentStatus = currentUserResult.rows[0].status as CommunityStatus;
    const actorRole = actorRoleResult.rows[0].role as CommunityRole;

    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 3; // Start after user_id and community_id

    // Handle role change
    if (newRole && newRole !== currentRole) {
      const validation = validateRoleAssignment(actorRole, currentRole, newRole);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.reason }, { status: 403 });
      }

      updates.push(`role = $${paramIndex}`);
      values.push(newRole);
      paramIndex++;

      // Log role change audit
      const auditLog = createRoleChangeAuditLog(
        actorUserId,
        targetUserId,
        actorCommunityId,
        currentRole,
        newRole,
        reason
      );
      await logAuditEntry(auditLog);
    }

    // Handle status change
    if (newStatus && newStatus !== currentStatus) {
      // Check permission for status changes
      if (newStatus === 'banned') {
        const canBan = canActorModifyTarget(actorRole, currentRole, 'ban_user');
        if (!canBan.allowed) {
          return NextResponse.json({ error: canBan.reason }, { status: 403 });
        }
      }

      updates.push(`status = $${paramIndex}`);
      values.push(newStatus);
      paramIndex++;

      // Log status change audit
      const auditLog = createStatusChangeAuditLog(
        actorUserId,
        targetUserId,
        actorCommunityId,
        currentStatus,
        newStatus,
        reason
      );
      await logAuditEntry(auditLog);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No changes specified' }, { status: 400 });
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);

    // Update the user's role/status
    const updateQuery = `
      UPDATE user_communities 
      SET ${updates.join(', ')}
      WHERE user_id = $1 AND community_id = $2
      RETURNING role, status, updated_at
    `;

    const updateResult = await query(updateQuery, [targetUserId, actorCommunityId, ...values]);

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const updatedUser = updateResult.rows[0];

    console.log(`[API PUT] Successfully updated user ${targetUserId}: ${updatedUser.role}/${updatedUser.status}`);

    return NextResponse.json({
      success: true,
      user: {
        userId: targetUserId,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('[API PUT] Error updating user community role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId]/community-role - Remove user from community
async function removeUserFromCommunity(req: AuthenticatedRequest, context: RouteContext) {
  const actorUserId = req.user?.sub;
  const actorCommunityId = req.user?.cid;
  const isActorAdmin = req.user?.adm || false;

  if (!actorUserId || !actorCommunityId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (!isActorAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const params = await context.params;
    const targetUserId = params.userId;
    const body = await req.json();
    const { reason } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Don't allow self-removal
    if (actorUserId === targetUserId) {
      return NextResponse.json({ error: 'Cannot remove yourself from community' }, { status: 400 });
    }

    console.log(`[API DELETE] Admin ${actorUserId} removing user ${targetUserId} from community`);

    // Get current user info and actor role
    const [currentUserResult, actorRoleResult] = await Promise.all([
      query(
        `SELECT role, status FROM user_communities WHERE user_id = $1 AND community_id = $2`,
        [targetUserId, actorCommunityId]
      ),
      query(
        `SELECT role FROM user_communities WHERE user_id = $1 AND community_id = $2`,
        [actorUserId, actorCommunityId]
      )
    ]);

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in community' }, { status: 404 });
    }

    if (actorRoleResult.rows.length === 0) {
      return NextResponse.json({ error: 'Actor not found in community' }, { status: 403 });
    }

    const currentRole = currentUserResult.rows[0].role as CommunityRole;
    const actorRole = actorRoleResult.rows[0].role as CommunityRole;

    // Check permission
    const canRemove = canActorModifyTarget(actorRole, currentRole, 'remove_user');
    if (!canRemove.allowed) {
      return NextResponse.json({ error: canRemove.reason }, { status: 403 });
    }

    // Set status to 'left' instead of deleting the record (keeps history)
    const updateResult = await query(
      `UPDATE user_communities 
       SET status = 'left', updated_at = NOW()
       WHERE user_id = $1 AND community_id = $2
       RETURNING *`,
      [targetUserId, actorCommunityId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Removal failed' }, { status: 500 });
    }

    // Log removal audit
    const auditLog = createStatusChangeAuditLog(
      actorUserId,
      targetUserId,
      actorCommunityId,
      'active',
      'left',
      reason || 'Removed by admin'
    );
    await logAuditEntry(auditLog);

    console.log(`[API DELETE] Successfully removed user ${targetUserId} from community`);

    return NextResponse.json({
      success: true,
      message: 'User removed from community'
    });

  } catch (error) {
    console.error('[API DELETE] Error removing user from community:', error);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }
}

export const GET = withAuth(getUserCommunityRole, true);
export const PUT = withAuth(updateUserCommunityRole, true);
export const DELETE = withAuth(removeUserFromCommunity, true); 