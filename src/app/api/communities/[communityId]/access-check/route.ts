import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest, RouteContext } from '@/lib/withAuth';
import { identityPermissionService } from '@/lib/services/IdentityPermissionService';

async function checkAccessHandler(req: AuthenticatedRequest, context: RouteContext) {
  const params = await context.params;
  const communityId = params.communityId;
  const sessionToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return NextResponse.json({ 
      error: 'Authorization required' 
    }, { status: 401 });
  }

  try {
    // Check identity-based community access
    const identityResult = await identityPermissionService.canJoinCommunity(sessionToken, communityId);
    
    return NextResponse.json({
      success: true,
      identityAccess: identityResult.allowed,
      identityType: identityResult.identityType,
      identityFailureReason: identityResult.reason
    });
  } catch (error) {
    console.error('[API] Error checking community access:', error);
    return NextResponse.json({ 
      error: 'Failed to check community access' 
    }, { status: 500 });
  }
}

export const GET = withAuth(checkAccessHandler); 