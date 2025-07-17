import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, RouteContext } from '@/lib/withAuth';
import { query } from '@/lib/db';

interface UserCommunityInfo {
  userId: string;
  communityId: string;
  role: string;
  status: string;
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
  invitedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userProfilePictureUrl: string | null;
  inviterName: string | null;
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
    const { role } = await req.json();

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['member', 'moderator', 'owner'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Prevent self-modification
    if (actorUserId === targetUserId) {
      return NextResponse.json({ 
        error: 'Cannot modify your own role. Please have another admin change your role.' 
      }, { status: 403 });
    }

    console.log(`[API PUT] Admin ${actorUserId} updating user ${targetUserId} role to ${role}`);

    // Get current user's role
    const currentUserResult = await query(
      'SELECT role FROM user_communities WHERE user_id = $1 AND community_id = $2',
      [targetUserId, actorCommunityId]
    );

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in community' }, { status: 404 });
    }

    const currentRole = currentUserResult.rows[0].role;

    // If demoting an owner, ensure at least one owner remains
    if (currentRole === 'owner' && role !== 'owner') {
      const ownerCountResult = await query(
        'SELECT COUNT(*) as count FROM user_communities WHERE community_id = $1 AND role = $2 AND status = $3',
        [actorCommunityId, 'owner', 'active']
      );

      const ownerCount = parseInt(ownerCountResult.rows[0]?.count || '0');
      
      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot demote the last owner. At least one owner must remain in the community.' 
        }, { status: 400 });
      }
    }

    // Update user's role
    const updateResult = await query(
      `UPDATE user_communities 
       SET role = $1, updated_at = NOW() 
       WHERE user_id = $2 AND community_id = $3 
       RETURNING *`,
      [role, targetUserId, actorCommunityId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    console.log(`[API PUT] Successfully updated user ${targetUserId} role from ${currentRole} to ${role}`);
    
    // Log the role change
    console.log(`[AUDIT] Role change: Admin ${actorUserId} changed user ${targetUserId} role from ${currentRole} to ${role} in community ${actorCommunityId}`);

    return NextResponse.json({ 
      message: 'Role updated successfully',
      previousRole: currentRole,
      newRole: role
    });

  } catch (error) {
    console.error('[API PUT] Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId]/community-role - Remove user from community
async function deleteUserCommunityRole(req: AuthenticatedRequest, context: RouteContext) {
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
    const { communityId } = await req.json();

    if (!targetUserId || !communityId) {
      return NextResponse.json({ error: 'User ID and community ID are required' }, { status: 400 });
    }

    // Prevent self-removal
    if (actorUserId === targetUserId) {
      return NextResponse.json({ 
        error: 'Cannot remove yourself from the community. Please have another admin remove you if needed.' 
      }, { status: 403 });
    }

    // Ensure we're operating on the correct community
    if (communityId !== actorCommunityId) {
      return NextResponse.json({ error: 'Invalid community' }, { status: 400 });
    }

    console.log(`[API DELETE] Admin ${actorUserId} removing user ${targetUserId} from community ${communityId}`);

    // Get current user's role before removal
    const currentUserResult = await query(
      'SELECT role FROM user_communities WHERE user_id = $1 AND community_id = $2',
      [targetUserId, actorCommunityId]
    );

    if (currentUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in community' }, { status: 404 });
    }

    const currentRole = currentUserResult.rows[0].role;

    // If removing an owner, ensure at least one owner remains
    if (currentRole === 'owner') {
      const ownerCountResult = await query(
        'SELECT COUNT(*) as count FROM user_communities WHERE community_id = $1 AND role = $2 AND status = $3',
        [actorCommunityId, 'owner', 'active']
      );

      const ownerCount = parseInt(ownerCountResult.rows[0]?.count || '0');
      
      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot remove the last owner. At least one owner must remain in the community.' 
        }, { status: 400 });
      }
    }

    // Remove user from community
    const deleteResult = await query(
      'DELETE FROM user_communities WHERE user_id = $1 AND community_id = $2 RETURNING role',
      [targetUserId, actorCommunityId]
    );

    if (deleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to remove user from community' }, { status: 500 });
    }

    console.log(`[API DELETE] Successfully removed user ${targetUserId} (${currentRole}) from community ${actorCommunityId}`);
    
    // Log the removal
    console.log(`[AUDIT] User removal: Admin ${actorUserId} removed user ${targetUserId} (${currentRole}) from community ${actorCommunityId}`);

    return NextResponse.json({ 
      message: 'User removed from community successfully',
      removedRole: currentRole
    });

  } catch (error) {
    console.error('[API DELETE] Error removing user from community:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getUserCommunityRole, true);
export const PUT = withAuth(updateUserCommunityRole, true);
export const DELETE = withAuth(deleteUserCommunityRole, true); 