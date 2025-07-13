import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

/**
 * POST /api/auth/create-anonymous
 * 
 * Creates anonymous user accounts and sessions for temporary access
 */

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface CreateAnonymousRequest {
  origin?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get request origin for CORS
    const origin = request.headers.get('origin') || '';
    
    const body: CreateAnonymousRequest = await request.json();
    const { origin: requestOrigin } = body;

    // Generate anonymous user ID and name
    const anonymousId = generateAnonymousId();
    const userId = `anon:${anonymousId}`;
    const name = `Anonymous ${anonymousId.slice(-6)}`;

    // Create anonymous user account
    const user = await createAnonymousUser(userId, name);

    // Create authentication session
    const session = await createAnonymousSession({
      userId: user.user_id,
      origin: requestOrigin
    });

    const responseData = {
      user: {
        user_id: user.user_id,
        name: user.name,
        profile_picture_url: user.profile_picture_url,
        identity_type: user.identity_type,
        wallet_address: user.wallet_address,
        ens_domain: user.ens_domain,
        up_address: user.up_address,
        is_anonymous: user.is_anonymous
      },
      token: session.session_token,
      expiresAt: session.expires_at,
      authMethod: 'anonymous'
    };

    const response = NextResponse.json(responseData);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;

  } catch (error) {
    console.error('[create-anonymous] Error:', error);
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    
    // Add CORS headers to error response
    errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Generate anonymous user ID
function generateAnonymousId(): string {
  const array = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      array[i] = buffer[i];
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create anonymous user account
async function createAnonymousUser(userId: string, name: string) {
  const insertQuery = `
    INSERT INTO users (
      user_id,
      name,
      identity_type,
      is_anonymous,
      auth_expires_at,
      last_auth_at
    ) VALUES (
      $1, $2, 'anonymous', true,
      NOW() + INTERVAL '7 days',
      NOW()
    )
    RETURNING *
  `;
  
  const result = await pool.query(insertQuery, [userId, name]);
  return result.rows[0];
}

// Create anonymous authentication session
async function createAnonymousSession(params: {
  userId: string;
  origin?: string;
}) {
  const { userId, origin } = params;

  // Generate session token
  const sessionToken = generateSessionToken();
  // Anonymous sessions expire in 7 days (shorter than wallet-based sessions)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

  const insertQuery = `
    INSERT INTO authentication_sessions (
      user_id,
      session_token,
      identity_type,
      signed_message,
      signature,
      expires_at
    ) VALUES ($1, $2, 'anonymous', $3, $4, $5)
    RETURNING *
  `;

  // For anonymous sessions, we use placeholder values for signed_message and signature
  const placeholderMessage = `Anonymous session created at ${new Date().toISOString()}${origin ? ` from ${origin}` : ''}`;
  const placeholderSignature = 'anonymous';

  const result = await pool.query(insertQuery, [
    userId,
    sessionToken,
    placeholderMessage,
    placeholderSignature,
    expiresAt
  ]);

  return result.rows[0];
}

// Generate secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) {
      array[i] = buffer[i];
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
} 