import { NextRequest, NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { query } from '@/lib/db'; // For potential initial user data sync

// Helper function for background friends sync
async function syncFriendsInBackground(
  userId: string, 
  friends: Array<{ id: string; name: string; image?: string }>
): Promise<void> {
  console.log(`[Friends Background Sync] Starting sync for ${userId} with ${friends.length} friends`);
  
  let syncedCount = 0;
  const errors: string[] = [];

  for (const friend of friends) {
    try {
      // Validate friend data
      if (!friend.id || !friend.name) {
        errors.push(`Invalid friend data: missing id or name`);
        continue;
      }

      // Ensure friend user exists in users table (with empty settings for friends)
      await query(
        `INSERT INTO users (user_id, name, profile_picture_url, settings, updated_at)
         VALUES ($1, $2, $3, '{}', NOW())
         ON CONFLICT (user_id) DO UPDATE SET 
           name = COALESCE(EXCLUDED.name, users.name),
           profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, users.profile_picture_url),
           updated_at = NOW();`,
        [friend.id, friend.name, friend.image || null]
      );

      // Upsert friendship record
      await query(
        `INSERT INTO user_friends (user_id, friend_user_id, friend_name, friend_image_url, friendship_status, synced_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'active', NOW(), NOW(), NOW())
         ON CONFLICT (user_id, friend_user_id) DO UPDATE SET
           friend_name = EXCLUDED.friend_name,
           friend_image_url = EXCLUDED.friend_image_url,
           friendship_status = 'active',
           synced_at = NOW(),
           updated_at = NOW();`,
        [userId, friend.id, friend.name, friend.image || null]
      );

      syncedCount++;
      
    } catch (dbError) {
      console.error(`[Friends Background Sync] Error syncing friend ${friend.id}:`, dbError);
      errors.push(`Failed to sync friend ${friend.name} (${friend.id}): ${dbError}`);
    }
  }

  console.log(`[Friends Background Sync] Completed for ${userId}. Synced: ${syncedCount}/${friends.length}${errors.length > 0 ? `, Errors: ${errors.length}` : ''}`);
  
  if (errors.length > 0) {
    console.warn(`[Friends Background Sync] Sync errors for ${userId}:`, errors);
  }
}

const JWT_SECRET = process.env.JWT_SECRET;
// Use seconds for expiresIn to satisfy linter with current @types/jsonwebtoken
const JWT_EXPIRES_IN_SECONDS = parseInt(process.env.JWT_EXPIRES_IN_SECONDS || '3600', 10); 

interface CommunityRole {
  id: string;
  title: string;
  // Add other properties from Community Info roles if needed by the backend
}

// User settings interface for Common Ground profile data
interface UserSettings {
  luksoAddress?: string;
  username?: string;
  bio?: string;
  social?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  email?: string;
  premiumStatus?: boolean;
  background?: {
    imageUrl: string;
    repeat: string;
    size: string;
    position: string;
    attachment: string;
    opacity: number;
    overlayColor?: string;
    blendMode?: string;
    useThemeColor?: boolean;
    disableCommunityBackground?: boolean;
  };
}

interface SessionRequestBody {
  userId: string;
  name?: string | null;
  profilePictureUrl?: string | null;
  roles?: string[]; // User's role IDs
  communityRoles?: CommunityRole[]; // Full list of community role definitions
  iframeUid?: string | null;
  communityId?: string | null;
  communityName?: string | null; // Added for community upsert
  communityShortId?: string | null; // 🆕 Short ID for URL construction
  pluginId?: string | null;         // 🆕 Plugin ID from context
  communityLogoUrl?: string | null; // 🆕 Community logo/avatar URL
  friends?: Array<{             // 🆕 Friends data from CG lib
    id: string;
    name: string;
    image?: string;
  }>;
  // 🆕 Common Ground profile data
  lukso?: {
    username: string;
    address: string;
  };
  ethereum?: {
    address: string;
  };
  twitter?: {
    username: string;
  };
  farcaster?: {
    displayName: string;
    username: string;
    fid: number;
  };
  premium?: string;
  email?: string;
}

// This should match or be compatible with JwtPayload in withAuth.ts
// For consistency, we can import it if withAuth.ts exports it, 
// or redefine it if it's kept internal to withAuth.ts.
// For now, let's assume the key claims for signing are sub, name, picture, adm.
interface TokenSignPayload {
  sub: string;
  name?: string | null;
  picture?: string | null;
  adm?: boolean;
  uid?: string | null;
  cid?: string | null;
  roles?: string[]; // Add user roles to JWT
  communityShortId?: string; // 🆕 Short ID for URL construction
  pluginId?: string;         // 🆕 Plugin ID from context
  previousVisit?: string | null; // 🆕 ISO timestamp of user's last visit
}

export async function POST(req: NextRequest) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured for signing tokens.');
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    );
  }

  try {
    const rawBodyText = await req.text(); 
    // console.log('[/api/auth/session] Received raw request body text:', rawBodyText); // Optional: keep if useful
    const body = JSON.parse(rawBodyText) as SessionRequestBody; 
    console.log('[/api/auth/session] Parsed request body object immediately after parse:', body);
    console.log('[/api/auth/session] Value of body.communityName immediately after parse:', body.communityName);

    const { userId, name, profilePictureUrl, roles: userRoleIds, communityRoles, iframeUid, communityId, communityShortId, pluginId /*, communityName - will access directly from body */ } = body;
    // console.log('[/api/auth/session] Destructured user role IDs:', userRoleIds);
    // console.log('[/api/auth/session] Destructured communityRoles:', communityRoles);
    // console.log('[/api/auth/session] Destructured iframeUid:', iframeUid);
    // console.log('[/api/auth/session] Destructured communityId:', communityId);
    // console.log('[/api/auth/session] Destructured communityName (from destructuring):', communityName); // This was showing undefined

    if (!userId || !iframeUid || !communityId) { 
      return NextResponse.json(
        { error: 'User ID, iframeUid, and Community ID are required for session' },
        { status: 400 }
      );
    }

    // 🆕 Declare previousVisit at function level for JWT payload
    let previousVisit: string | null = null;

    // --- Community and Default Board Upsert Logic --- 
    if (communityId) {
      try {
        const nameForCommunityUpsert = body.communityName; // Explicit access from body again
        console.log('[/api/auth/session] Value of body.communityName right before community upsert:', nameForCommunityUpsert);
        
        // 🆕 FIRST: Capture user's previous visit timestamp BEFORE updating anything
        try {
          const userResult = await query(
            `SELECT updated_at FROM users WHERE user_id = $1`,
            [userId]
          );
          
          if (userResult.rows.length > 0) {
            previousVisit = userResult.rows[0].updated_at;
            console.log(`[/api/auth/session] Captured previous visit for user ${userId}:`, previousVisit);
          } else {
            console.log(`[/api/auth/session] First-time user ${userId} - no previous visit`);
          }
        } catch (error) {
          console.error(`[/api/auth/session] Error capturing previous visit for user ${userId}:`, error);
          // Continue without previousVisit - non-critical for session creation
        }
        
        // 1. Upsert Community with CG lib metadata including logo
        await query(
          `INSERT INTO communities (id, name, community_short_id, plugin_id, logo_url, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (id) DO UPDATE SET 
             name = EXCLUDED.name, 
             community_short_id = COALESCE(EXCLUDED.community_short_id, communities.community_short_id),
             plugin_id = COALESCE(EXCLUDED.plugin_id, communities.plugin_id),
             logo_url = COALESCE(EXCLUDED.logo_url, communities.logo_url),
             updated_at = NOW();`,
                     [communityId, nameForCommunityUpsert || communityId, communityShortId ?? null, pluginId ?? null, body.communityLogoUrl ?? null]
        );
        console.log(`[/api/auth/session] Upserted community: ${communityId} with metadata (short_id: ${communityShortId}, plugin_id: ${pluginId})`);

        // 2. Upsert Default Board for this Community
        const defaultBoardName = 'General Discussion';
        const defaultBoardDescription = 'Main discussion board for the community.';
        const boardResult = await query(
          `INSERT INTO boards (community_id, name, description, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (community_id, name) DO UPDATE SET description = EXCLUDED.description, updated_at = NOW()
           RETURNING id;`,
          [communityId, defaultBoardName, defaultBoardDescription]
        );
        console.log(`[/api/auth/session] Upserted default board for community ${communityId}. Board ID: ${boardResult.rows[0]?.id}`);

        // 3. Fetch existing user settings to preserve them (especially background settings)
        let existingSettings: UserSettings = {};
        try {
          const existingUserResult = await query(
            `SELECT settings FROM users WHERE user_id = $1`,
            [userId]
          );
          
          if (existingUserResult.rows.length > 0 && existingUserResult.rows[0].settings) {
            const existing = existingUserResult.rows[0].settings;
            existingSettings = typeof existing === 'string' ? JSON.parse(existing) : existing;
            console.log(`[/api/auth/session] Found existing settings for ${userId}:`, Object.keys(existingSettings));
          }
        } catch (error) {
          console.warn(`[/api/auth/session] Error fetching existing settings for ${userId}:`, error);
          // Continue with empty existing settings if query fails
        }

        // 4. Extract and prepare Common Ground profile data for settings (merge with existing)
        const newProfileData: Partial<UserSettings> = {};
        
        // Capture LUKSO profile data if available
        if (body.lukso?.address && body.lukso?.username) {
          newProfileData.luksoAddress = body.lukso.address;
          newProfileData.username = body.lukso.username;
          console.log(`[/api/auth/session] Captured LUKSO profile for ${userId}: ${body.lukso.address} (${body.lukso.username})`);
        }
        
        // Capture Twitter data if available
        if (body.twitter?.username) {
          newProfileData.social = { twitter: body.twitter.username };
        }
        
        // Capture Ethereum address if available
        if (body.ethereum?.address) {
          // Store in bio or other field since we simplified the interface
          console.log(`[/api/auth/session] Captured Ethereum address for ${userId}: ${body.ethereum.address}`);
        }
        
        // Capture Farcaster profile data if available
        if (body.farcaster?.displayName && body.farcaster?.username && body.farcaster?.fid) {
          newProfileData.bio = body.farcaster.displayName; // Store display name in bio
          console.log(`[/api/auth/session] Captured Farcaster profile for ${userId}: ${body.farcaster.displayName} (@${body.farcaster.username}, FID: ${body.farcaster.fid})`);
        }
        if (body.premium) {
          newProfileData.premiumStatus = true;
        }
        if (body.email) {
          newProfileData.email = body.email;
        }

        // 🔧 CRITICAL FIX: Merge new profile data with existing settings (preserving background!)
        const mergedSettings: UserSettings = {
          ...existingSettings,  // Keep existing settings (especially background)
          ...newProfileData     // Update with new Common Ground profile data
        };

        console.log(`[/api/auth/session] Merging settings for ${userId}. Existing keys:`, Object.keys(existingSettings), 'New profile keys:', Object.keys(newProfileData), 'Merged keys:', Object.keys(mergedSettings));

        // 5. Ensure user record exists with merged settings
        await query(
          `INSERT INTO users (user_id, name, profile_picture_url, settings, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (user_id) DO UPDATE SET 
             name = COALESCE(EXCLUDED.name, users.name),
             profile_picture_url = COALESCE(EXCLUDED.profile_picture_url, users.profile_picture_url),
             settings = EXCLUDED.settings,
             updated_at = NOW();`,
          [userId, name ?? null, profilePictureUrl ?? null, JSON.stringify(mergedSettings)]
        );

        // 6. Track user-community relationship for cross-device "What's New"
        const userCommunityResult = await query(
          `INSERT INTO user_communities (user_id, community_id, first_visited_at, last_visited_at, visit_count, created_at, updated_at)
           VALUES ($1, $2, NOW(), NOW(), 1, NOW(), NOW())
           ON CONFLICT (user_id, community_id) DO UPDATE SET 
             last_visited_at = NOW(),
             visit_count = user_communities.visit_count + 1,
             updated_at = NOW()
           RETURNING visit_count, first_visited_at;`,
          [userId, communityId]
        );
        
        const visitInfo = userCommunityResult.rows[0];
        console.log(`[/api/auth/session] Updated user-community relationship for ${userId} in ${communityId}. Visit count: ${visitInfo?.visit_count}, First visit: ${visitInfo?.first_visited_at}`);

        // 7. Auto-sync friends if provided (non-blocking)
        if (body.friends && Array.isArray(body.friends) && body.friends.length > 0) {
          console.log(`[/api/auth/session] Starting automatic friends sync for ${userId} (${body.friends.length} friends)`);
          
          // Run friends sync in background (don't await to avoid blocking session creation)
          syncFriendsInBackground(userId, body.friends).catch((syncError: unknown) => {
            console.error(`[/api/auth/session] Background friends sync failed for ${userId}:`, syncError);
          });
        } else if (body.friends !== undefined) {
          console.log(`[/api/auth/session] No friends data provided for ${userId} (friends array empty or invalid)`);
        }

      } catch (dbError) {
        console.error(`[/api/auth/session] Error during community/board upsert for community ${communityId}:`, dbError);
        // Non-critical for session token generation, but log it. 
        // Depending on requirements, you might want to return an error here.
      }
    }
    // --- END Community and Default Board Upsert Logic --- 

    let isUserAdmin = false;
    const adminRoleTitleEnvVar = process.env.NEXT_PUBLIC_ADMIN_ROLE_IDS;

    // Check 1: Role-based admin status
    if (adminRoleTitleEnvVar && userRoleIds && userRoleIds.length > 0 && communityRoles && communityRoles.length > 0) {
      const adminTitlesFromEnv = adminRoleTitleEnvVar.split(',').map(roleTitle => roleTitle.trim().toLowerCase());
      
      const userTitles = userRoleIds.map(roleId => {
        const matchingCommunityRole = communityRoles.find(cr => cr.id === roleId);
        return matchingCommunityRole ? matchingCommunityRole.title.trim().toLowerCase() : null;
      }).filter(title => title !== null) as string[];

      console.log('[/api/auth/session] User role titles derived:', userTitles);
      console.log('[/api/auth/session] Admin role titles from ENV:', adminTitlesFromEnv);

      isUserAdmin = userTitles.some(userRoleTitle => adminTitlesFromEnv.includes(userRoleTitle));
    }
    console.log(`[/api/auth/session] Determined admin status based on role titles: ${isUserAdmin}`);

    // Check 2: Community owner status
    if (!isUserAdmin) {
      try {
        const ownerCheckResult = await query(
          'SELECT owner_user_id FROM communities WHERE id = $1',
          [communityId]
        );
        
        if (ownerCheckResult.rows.length > 0) {
          const ownerUserId = ownerCheckResult.rows[0].owner_user_id;
          if (ownerUserId === userId) {
            isUserAdmin = true;
            console.log(`[/api/auth/session] User ${userId} is community owner for ${communityId}`);
          }
        }
      } catch (ownerCheckError) {
        console.error(`[/api/auth/session] Error checking community owner status:`, ownerCheckError);
        // Non-critical error, continue with existing admin status
      }
    }

    console.log(`[/api/auth/session] Final admin status (role + owner check): ${isUserAdmin}`);

    const payloadToSign: TokenSignPayload = {
      sub: userId,
      name: name,
      picture: profilePictureUrl,
      adm: isUserAdmin, // Set adm based on role title check
      uid: iframeUid,
      cid: communityId,
      roles: userRoleIds,
      communityShortId: communityShortId ?? undefined, // 🆕 Short ID for URL construction
      pluginId: pluginId ?? undefined,                 // 🆕 Plugin ID from context
      previousVisit: previousVisit,                    // 🆕 User's last visit timestamp
    };
    console.log('[/api/auth/session] Payload to sign (checking adm, uid, cid claims):', payloadToSign);

    const secret = JWT_SECRET as string;

    const signOptions: SignOptions = {
      expiresIn: JWT_EXPIRES_IN_SECONDS, 
    };
    console.log('[/api/auth/session] JWT Sign Options:', signOptions); // Log signOptions

    const token = jwt.sign(payloadToSign, secret, signOptions);

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error creating session token:', error);
    if (error instanceof SyntaxError) { // Potential req.json() error
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 