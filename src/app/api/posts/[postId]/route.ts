import { /* NextRequest, */ NextResponse } from 'next/server';
import { AuthenticatedRequest, withAuth, RouteContext } from '@/lib/withAuth';
import { query } from '@/lib/db';
import { canUserAccessBoard, resolveBoard } from '@/lib/boardPermissions';
import { ApiPost } from '@/app/api/posts/route';
import { getSinglePost } from '@/lib/queries/enrichedPosts';

// GET a single post by ID with board access control and enhanced data
async function getSinglePostHandler(req: AuthenticatedRequest, context: RouteContext) {
  const params = await context.params;
  const postId = parseInt(params.postId, 10);
  const userId = req.user?.sub;
  const userRoles = req.user?.roles;
  const isAdmin = req.user?.adm || false;
  const userCommunityId = req.user?.cid;

  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    console.log(`[API] GET /api/posts/${postId} called by user ${userId}`);

    // 🚀 MIGRATED TO ENRICHED POSTS UTILITIES - 90% less code, better performance  
    // BEFORE: 30+ lines of complex 6-table JOIN with manual share statistics aggregation
    // AFTER: 1 line using optimized getSinglePost function

    const postData = await getSinglePost(postId, userId);

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Verify user can access the board (handles both owned and shared boards)
    const resolvedBoard = await resolveBoard(postData.board_id, userCommunityId || '');
    if (!resolvedBoard) {
      console.warn(`[API GET /api/posts/${postId}] User ${userId} from community ${userCommunityId} attempted to access post from inaccessible board ${postData.board_id}`);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Parse board settings
    const boardSettings = typeof postData.board_settings === 'string' 
      ? JSON.parse(postData.board_settings) 
      : postData.board_settings;
    
    // Check board access permissions
    if (!canUserAccessBoard(userRoles, boardSettings, isAdmin)) {
      console.warn(`[API GET /api/posts/${postId}] User ${userId} attempted to access post from restricted board ${postData.board_id}`);
      return NextResponse.json({ error: 'You do not have permission to view this post' }, { status: 403 });
    }

    // Prepare settings object, parsing if necessary
    const settings = typeof postData.settings === 'string' 
      ? JSON.parse(postData.settings) 
      : (postData.settings || {});

    // Overwrite gating config from lock if it exists
    if (postData.lock_id && postData.lock_gating_config) {
      console.log(`[API GET /api/posts/${postId}] Post is using Lock ${postData.lock_id}. Overwriting gating config.`);
      const lockConfig = typeof postData.lock_gating_config === 'string'
        ? JSON.parse(postData.lock_gating_config)
        : postData.lock_gating_config;
      
      settings.responsePermissions = lockConfig;
    }

    // Format the response as ApiPost
    const post: ApiPost = {
      id: postData.id,
      author_user_id: postData.author_user_id,
      title: postData.title,
      content: postData.content,
      tags: postData.tags,
      settings: settings,
      upvote_count: postData.upvote_count,
      comment_count: postData.comment_count,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      author_name: postData.author_name,
      author_profile_picture_url: postData.author_profile_picture_url,
      user_has_upvoted: postData.user_has_upvoted || false,
      board_id: postData.board_id,
      board_name: postData.board_name,
      lock_id: postData.lock_id,
      // Add share statistics fields with proper defaults
      share_access_count: postData.share_access_count || 0,
      share_count: postData.share_count || 0,
      last_shared_at: postData.last_shared_at || undefined,
      most_recent_access_at: postData.most_recent_access_at || undefined,
    };

    console.log(`[API] Successfully retrieved post ${postId} for user ${userId}`);
    return NextResponse.json(post);

  } catch (error) {
    console.error(`[API] Error fetching post ${postId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export const GET = withAuth(getSinglePostHandler, false);

// DELETE a post (admin only)
async function deletePostHandler(req: AuthenticatedRequest, context: RouteContext) {
  const params = await context.params;
  const postId = parseInt(params.postId, 10);
  
  if (isNaN(postId)) {
    return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
  }

  try {
    await query('DELETE FROM posts WHERE id = $1', [postId]);
    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(`[API] Error deleting post ${postId}:`, error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

export const DELETE = withAuth(deletePostHandler, true);
