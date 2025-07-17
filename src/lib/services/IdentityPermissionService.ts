import { query } from '@/lib/db';
import { IdentityType, IdentityPermissions, CommunityIdentityGating } from '@/types/settings';
import jwt from 'jsonwebtoken';

export interface IdentityDetectionResult {
  identityType: IdentityType;
  userId: string;
  isAuthenticated: boolean;
  sessionToken?: string;
}

export interface PermissionCheckResult {
  allowed: boolean;
  identityType: IdentityType;
  reason?: string;
}

interface JwtPayload {
  sub: string; // User ID
  name?: string | null;
  picture?: string | null;
  adm?: boolean;
  uid?: string | null;
  cid?: string | null;
  roles?: string[];
  communityShortId?: string;
  pluginId?: string;
  previousVisit?: string | null;
  identity_type?: string; // User identity type for permission checks
  iat?: number;
  exp?: number;
}

export class IdentityPermissionService {
  /**
   * Default permissions when community has no identity gating settings
   */
  private static readonly DEFAULT_PERMISSIONS: Record<IdentityType, IdentityPermissions> = {
    legacy: {
      canJoinCommunity: true,
      canPost: true,
      canComment: true,
      canUpvote: true,
      canReact: true,
    },
    ens: {
      canJoinCommunity: true,
      canPost: true,
      canComment: true,
      canUpvote: true,
      canReact: true,
    },
    universal_profile: {
      canJoinCommunity: true,
      canPost: true,
      canComment: true,
      canUpvote: true,
      canReact: true,
    },
    anonymous: {
      canJoinCommunity: true,
      canPost: false,
      canComment: false,
      canUpvote: false,
      canReact: false,
    },
  };

  /**
   * Detect identity type from session token
   * Uses JWT payload to eliminate database queries for performance
   */
  async detectIdentity(sessionToken?: string): Promise<IdentityDetectionResult> {
    if (!sessionToken) {
      return {
        identityType: 'anonymous',
        userId: 'anonymous',
        isAuthenticated: false,
      };
    }

    try {
      // Decode JWT token to get user_id and identity_type
      const JWT_SECRET = process.env.JWT_SECRET;
      if (!JWT_SECRET) {
        console.error('JWT_SECRET not configured for identity detection');
        return {
          identityType: 'anonymous',
          userId: 'anonymous',
          isAuthenticated: false,
        };
      }

      const decoded = jwt.verify(sessionToken, JWT_SECRET) as JwtPayload;
      const userId = decoded.sub; // JWT sub field contains user_id
      const identityType = decoded.identity_type; // JWT identity_type field
      
      if (!userId) {
        console.warn('No user_id (sub) found in JWT token');
        return {
          identityType: 'anonymous',
          userId: 'anonymous',
          isAuthenticated: false,
        };
      }

      // Use identity_type from JWT payload (fallback to 'legacy' if not present)
      const userIdentityType = identityType || 'legacy';
      
      return {
        identityType: userIdentityType as IdentityType,
        userId: userId,
        isAuthenticated: true,
        sessionToken,
      };

    } catch (jwtError) {
      console.error('Error decoding JWT token:', jwtError);
      return {
        identityType: 'anonymous',
        userId: 'anonymous',
        isAuthenticated: false,
      };
    }
  }

  /**
   * Get community identity gating settings from the existing settings field
   */
  async getCommunityIdentityGating(communityId: string): Promise<CommunityIdentityGating | null> {
    try {
      const queryText = `
        SELECT settings
        FROM communities
        WHERE id = $1
      `;
      
      const result = await query(queryText, [communityId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const settings = result.rows[0].settings;
      if (!settings || typeof settings !== 'object') {
        return null;
      }

      // Extract identity gating from the settings field
      const identityGating = settings.identityGating;
      return identityGating ? identityGating as CommunityIdentityGating : null;
    } catch (error) {
      console.error('Error getting community identity gating:', error);
      return null;
    }
  }

  /**
   * Check if identity has permission for specific action
   */
  async checkPermission(
    identityType: IdentityType,
    communityId: string,
    action: keyof IdentityPermissions
  ): Promise<PermissionCheckResult> {
    try {
      const gatingSettings = await this.getCommunityIdentityGating(communityId);
      
      let permissions: IdentityPermissions;
      
      if (gatingSettings?.permissions?.[identityType]) {
        // Use community-specific settings
        permissions = gatingSettings.permissions[identityType];
      } else {
        // Use default permissions
        permissions = IdentityPermissionService.DEFAULT_PERMISSIONS[identityType];
      }

      const allowed = permissions[action];
      
      return {
        allowed,
        identityType,
        reason: allowed ? undefined : `${identityType} users cannot ${action} in this community`,
      };
    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        allowed: false,
        identityType,
        reason: 'Permission check failed',
      };
    }
  }

  /**
   * Check if user can join community
   */
  async canJoinCommunity(sessionToken: string | undefined, communityId: string): Promise<PermissionCheckResult> {
    const identity = await this.detectIdentity(sessionToken);
    return this.checkPermission(identity.identityType, communityId, 'canJoinCommunity');
  }

  /**
   * Check if user can create posts
   */
  async canPost(sessionToken: string | undefined, communityId: string): Promise<PermissionCheckResult> {
    const identity = await this.detectIdentity(sessionToken);
    return this.checkPermission(identity.identityType, communityId, 'canPost');
  }

  /**
   * Check if user can create comments
   */
  async canComment(sessionToken: string | undefined, communityId: string): Promise<PermissionCheckResult> {
    const identity = await this.detectIdentity(sessionToken);
    return this.checkPermission(identity.identityType, communityId, 'canComment');
  }

  /**
   * Check if user can upvote posts
   */
  async canUpvote(sessionToken: string | undefined, communityId: string): Promise<PermissionCheckResult> {
    const identity = await this.detectIdentity(sessionToken);
    return this.checkPermission(identity.identityType, communityId, 'canUpvote');
  }

  /**
   * Check if user can react to content
   */
  async canReact(sessionToken: string | undefined, communityId: string): Promise<PermissionCheckResult> {
    const identity = await this.detectIdentity(sessionToken);
    return this.checkPermission(identity.identityType, communityId, 'canReact');
  }

  /**
   * Get all permissions for a user in a community
   */
  async getUserPermissions(
    sessionToken: string | undefined,
    communityId: string
  ): Promise<IdentityPermissions & { identityType: IdentityType }> {
    const identity = await this.detectIdentity(sessionToken);
    const gatingSettings = await this.getCommunityIdentityGating(communityId);
    
    let permissions: IdentityPermissions;
    
    if (gatingSettings?.permissions?.[identity.identityType]) {
      permissions = gatingSettings.permissions[identity.identityType];
    } else {
      permissions = IdentityPermissionService.DEFAULT_PERMISSIONS[identity.identityType];
    }

    return {
      ...permissions,
      identityType: identity.identityType,
    };
  }
}

// Export singleton instance
export const identityPermissionService = new IdentityPermissionService(); 