import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Database connection (same pattern as verify-signature)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Database row type
interface CommunityRow {
  id: string;
  name: string;
  logo_url: string | null;
  is_public: boolean;
  requires_approval: boolean;
  created_at: Date;
  member_count: string;
}

// Request body interface for community creation
interface CreateCommunityRequest {
  name: string;
  community_short_id: string;
  is_public?: boolean;
  requires_approval?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get request origin for CORS
    const origin = request.headers.get('origin') || '';
    
    const client = await pool.connect();
    
    try {
      // Check for authentication
      const authHeader = request.headers.get('authorization');
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const sessionToken = authHeader.substring(7);
        
        // Validate session and get user ID
        const sessionQuery = `
          SELECT s.user_id 
          FROM authentication_sessions s
          WHERE s.session_token = $1 
            AND s.is_active = true 
            AND s.expires_at > NOW()
        `;
        
        const sessionResult = await client.query(sessionQuery, [sessionToken]);
        if (sessionResult.rows.length > 0) {
          userId = sessionResult.rows[0].user_id;
          console.log('[communities] Authenticated request for user:', userId);
        }
      }

      if (userId) {
        // Authenticated user: separate their communities from available ones
        
        // Get user's existing communities
        const userCommunitiesQuery = `
          SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.is_public,
            c.requires_approval,
            c.created_at,
            COUNT(uc_all.user_id) as member_count,
            uc_user.role as user_role,
            uc_user.last_visited_at
          FROM communities c
          JOIN user_communities uc_user ON c.id = uc_user.community_id 
            AND uc_user.user_id = $1 
            AND uc_user.status = 'active'
          LEFT JOIN user_communities uc_all ON c.id = uc_all.community_id 
            AND uc_all.status = 'active'
          GROUP BY c.id, c.name, c.logo_url, c.is_public, c.requires_approval, c.created_at, uc_user.role, uc_user.last_visited_at
          ORDER BY uc_user.last_visited_at DESC, c.created_at DESC
        `;

        // Get available communities (public, user is not a member)
        const availableCommunitiesQuery = `
          SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.is_public,
            c.requires_approval,
            c.created_at,
            COUNT(uc.user_id) as member_count
          FROM communities c
          LEFT JOIN user_communities uc ON c.id = uc.community_id 
            AND uc.status = 'active'
          WHERE c.is_public = true
            AND c.id NOT IN (
              SELECT community_id 
              FROM user_communities 
              WHERE user_id = $1 AND status = 'active'
            )
          GROUP BY c.id, c.name, c.logo_url, c.is_public, c.requires_approval, c.created_at
          ORDER BY member_count DESC, c.created_at DESC
          LIMIT 10
        `;

        const [userCommunitiesResult, availableCommunitiesResult] = await Promise.all([
          client.query(userCommunitiesQuery, [userId]),
          client.query(availableCommunitiesQuery, [userId])
        ]);

        // Transform user's communities
        const userCommunities = userCommunitiesResult.rows.map((row: CommunityRow & { user_role: string }) => ({
          id: row.id,
          name: row.name,
          description: `Continue to ${row.name}`, // Different description for user's communities
          memberCount: parseInt(row.member_count) || 0,
          isPublic: row.is_public,
          gradientClass: getGradientClass(row.name),
          icon: getIconForCommunity(row.name),
          logoUrl: row.logo_url,
          requiresApproval: row.requires_approval,
          userRole: row.user_role, // Include user's role
          isMember: true, // Flag to indicate user is already a member
          createdAt: row.created_at.toISOString()
        }));

        // Transform available communities
        const availableCommunities = availableCommunitiesResult.rows.map((row: CommunityRow) => ({
          id: row.id,
          name: row.name,
          description: `Join the ${row.name} community`,
          memberCount: parseInt(row.member_count) || 0,
          isPublic: row.is_public,
          gradientClass: getGradientClass(row.name),
          icon: getIconForCommunity(row.name),
          logoUrl: row.logo_url,
          requiresApproval: row.requires_approval,
          isMember: false, // Flag to indicate user is not a member
          createdAt: row.created_at.toISOString()
        }));

        const response = NextResponse.json({ 
          userCommunities,
          availableCommunities,
          isAuthenticated: true
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;

      } else {
        // Unauthenticated user: show all public communities
        const result = await client.query(`
          SELECT 
            c.id,
            c.name,
            c.logo_url,
            c.is_public,
            c.requires_approval,
            c.created_at,
            COUNT(uc.user_id) as member_count
          FROM communities c
          LEFT JOIN user_communities uc ON c.id = uc.community_id 
            AND uc.status = 'active'
          WHERE c.is_public = true
          GROUP BY c.id, c.name, c.logo_url, c.is_public, c.requires_approval, c.created_at
          ORDER BY member_count DESC, c.created_at DESC
          LIMIT 10
        `);

        // Transform database data to match Community interface
        const communities = result.rows.map((row: CommunityRow) => ({
          id: row.id,
          name: row.name,
          description: `Join the ${row.name} community`,
          memberCount: parseInt(row.member_count) || 0,
          isPublic: row.is_public,
          gradientClass: getGradientClass(row.name),
          icon: getIconForCommunity(row.name),
          logoUrl: row.logo_url,
          requiresApproval: row.requires_approval,
          isMember: false,
          createdAt: row.created_at.toISOString()
        }));

        const response = NextResponse.json({ 
          communities,
          userCommunities: [],
          availableCommunities: communities,
          isAuthenticated: false
        });
        
        // Add CORS headers
        response.headers.set('Access-Control-Allow-Origin', origin || '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        return response;
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[communities] Error fetching communities:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch communities' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    const origin = request.headers.get('origin') || '';
    errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get request origin for CORS
    const origin = request.headers.get('origin') || '';
    
    const client = await pool.connect();
    
    try {
      // Check for authentication
      const authHeader = request.headers.get('authorization');
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        const sessionToken = authHeader.substring(7);
        
        // Validate session and get user ID
        const sessionQuery = `
          SELECT s.user_id 
          FROM authentication_sessions s
          WHERE s.session_token = $1 
            AND s.is_active = true 
            AND s.expires_at > NOW()
        `;
        
        const sessionResult = await client.query(sessionQuery, [sessionToken]);
        if (sessionResult.rows.length > 0) {
          userId = sessionResult.rows[0].user_id;
          console.log('[communities] Authenticated POST request for user:', userId);
        }
      }

      if (!userId) {
        const errorResponse = NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      // Check user identity type - community creation requires secure identity
      const userQuery = `
        SELECT identity_type 
        FROM users 
        WHERE user_id = $1
      `;
      
      const userResult = await client.query(userQuery, [userId]);
      if (userResult.rows.length === 0) {
        const errorResponse = NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      const identityType = userResult.rows[0].identity_type;
      if (identityType === 'anonymous') {
        const errorResponse = NextResponse.json(
          { error: 'Community creation requires ENS or Universal Profile authentication' },
          { status: 403 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      console.log('[communities] User identity type verified:', identityType, 'for user:', userId);

      // Parse request body
      const body: CreateCommunityRequest = await request.json();
      
      // Validate required fields
      if (!body.name || !body.community_short_id) {
        const errorResponse = NextResponse.json(
          { error: 'Name and community_short_id are required' },
          { status: 400 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      // Validate community_short_id format (alphanumeric + hyphens, no spaces)
      const shortIdRegex = /^[a-zA-Z0-9-_]+$/;
      if (!shortIdRegex.test(body.community_short_id)) {
        const errorResponse = NextResponse.json(
          { error: 'Community short ID can only contain letters, numbers, hyphens, and underscores' },
          { status: 400 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      // Check if community_short_id is already taken
      const existingCommunity = await client.query(
        'SELECT id FROM communities WHERE community_short_id = $1',
        [body.community_short_id]
      );

      if (existingCommunity.rows.length > 0) {
        const errorResponse = NextResponse.json(
          { error: 'Community short ID is already taken' },
          { status: 409 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      // Create the community
      const communityId = randomUUID();
      const result = await client.query(
        `INSERT INTO communities (id, name, community_short_id, owner_user_id, is_public, requires_approval, plugin_id, settings)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, created_at, updated_at, community_short_id, plugin_id, is_public, requires_approval, settings, logo_url`,
        [
          communityId,
          body.name,
          body.community_short_id,
          userId,
          body.is_public ?? true,
          body.requires_approval ?? false,
          body.community_short_id, // Initially set plugin_id = community_short_id
          '{}'
        ]
      );

      if (result.rows.length === 0) {
        const errorResponse = NextResponse.json(
          { error: 'Failed to create community' },
          { status: 500 }
        );
        errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
        errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return errorResponse;
      }

      // Add user as owner in user_communities table
      await client.query(
        `INSERT INTO user_communities (user_id, community_id, role, status, first_visited_at, last_visited_at)
         VALUES ($1, $2, 'owner', 'active', NOW(), NOW())`,
        [userId, result.rows[0].id]
      );

      const newCommunity = result.rows[0];
      
      // Format response to match the GET endpoint structure
      const responseData = {
        id: newCommunity.id,
        name: newCommunity.name,
        description: `Continue to ${newCommunity.name}`,
        memberCount: 1, // Creator is the first member
        isPublic: newCommunity.is_public,
        gradientClass: getGradientClass(newCommunity.name),
        icon: getIconForCommunity(newCommunity.name),
        logoUrl: newCommunity.logo_url,
        requiresApproval: newCommunity.requires_approval,
        userRole: 'owner',
        isMember: true,
        createdAt: newCommunity.created_at.toISOString(),
        communityShortId: newCommunity.community_short_id,
        pluginId: newCommunity.plugin_id
      };

      console.log('[communities] Community created successfully:', newCommunity.id);
      
      const response = NextResponse.json(responseData, { status: 201 });
      
      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[communities] Error creating community:', error);
    const errorResponse = NextResponse.json(
      { error: 'Failed to create community' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    const origin = request.headers.get('origin') || '';
    errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Helper function to assign gradient classes based on community name
function getGradientClass(name: string): string {
  const gradients = [
    'gradient-pink-purple',
    'gradient-blue-cyan', 
    'gradient-emerald-teal',
    'gradient-orange-pink',
    'gradient-purple-blue',
    'gradient-cyan-emerald'
  ];
  
  // Use a simple hash of the name to consistently assign gradients
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
}

// Helper function to assign icons based on community name
function getIconForCommunity(name: string): string {
  const lowercaseName = name.toLowerCase();
  
  if (lowercaseName.includes('lukso')) return '🆙';
  if (lowercaseName.includes('ethereum')) return '⟠';
  if (lowercaseName.includes('defi') || lowercaseName.includes('governance')) return '🏛️';
  if (lowercaseName.includes('nft') || lowercaseName.includes('art')) return '🎨';
  if (lowercaseName.includes('gaming')) return '🎮';
  if (lowercaseName.includes('dao')) return '🏛️';
  if (lowercaseName.includes('social')) return '👥';
  if (lowercaseName.includes('tech')) return '🔧';
  if (lowercaseName.includes('crypto')) return '💎';
  
  // Default icons for variety
  const defaultIcons = ['🌟', '🚀', '💫', '🔮', '⚡', '🌈', '🎯', '🎪'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return defaultIcons[hash % defaultIcons.length];
} 