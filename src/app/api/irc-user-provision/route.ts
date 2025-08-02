import { NextResponse } from 'next/server';
import { AuthenticatedRequest, withAuth } from '@/lib/withAuth';
import { Pool } from 'pg';
import { 
  generateIrcUsername, 
  generateSecurePassword, 
  hashIrcPassword 
} from '@curia_/curia-chat-modal';

// IRC Database Connection
const ircPool = new Pool({
  connectionString: process.env.IRC_DATABASE_URL,
  max: 5, // Smaller pool for IRC operations
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

async function ircQuery(text: string, values?: unknown[]): Promise<{ rows: unknown[] }> {
  const client = await ircPool.connect();
  try {
    const res = await client.query(text, values);
    return res;
  } catch (error) {
    console.error('[IRC Database] Query failed:', {
      query: text,
      values,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString()
    });
    throw error;
  } finally {
    client.release();
  }
}

interface ProvisionResponse {
  success: boolean;
  ircUsername: string;
  ircPassword: string; // Generated password for The Lounge
  networkName: string;
}

async function upsertSojuUser({
  ircUsername,
  hashedPassword,
  nickname,
  realname
}: {
  ircUsername: string;
  hashedPassword: string;
  nickname: string;
  realname: string;
}) {
  // Atomic UPSERT - eliminates race condition
  const result = await ircQuery(
    `INSERT INTO "User" (username, password, nick, realname, admin, enabled) 
     VALUES ($1, $2, $3, $4, false, true) 
     ON CONFLICT (username) 
     DO UPDATE SET 
       password = EXCLUDED.password, 
       nick = EXCLUDED.nick, 
       realname = EXCLUDED.realname
     RETURNING id`,
    [ircUsername, hashedPassword, nickname, realname]
  );

  const userId = (result.rows[0] as { id: number }).id;

  // Ensure network exists for user
  await ircQuery(
    `INSERT INTO "Network" (name, "user", addr, nick, username, enabled) 
     VALUES ($1, $2, $3, $4, $5, true) 
     ON CONFLICT (name, "user") DO UPDATE SET
       nick = EXCLUDED.nick,
       username = EXCLUDED.username`,
    ['commonground', userId, 'irc+insecure://ergo:6667', nickname, ircUsername]
  );

  return { userId, ircUsername };
}

async function provisionIrcUserHandler(req: AuthenticatedRequest) {
  const user = req.user;
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Use community ID from JWT token instead of request body
  const communityId = user.cid;
  
  if (!communityId) {
    return NextResponse.json(
      { error: 'Community ID not found in authentication token' }, 
      { status: 400 }
    );
  }

  try {
    // Generate IRC username (avoid conflicts)
    const ircUsername = generateIrcUsername(user.name || user.sub, user.sub);
    
    // Generate secure password for IRC
    const ircPassword = generateSecurePassword();
    const hashedPassword = await hashIrcPassword(ircPassword);

    // Upsert user in Soju database
    await upsertSojuUser({
      ircUsername,
      hashedPassword,
      nickname: user.name || ircUsername,
      realname: user.name || ircUsername
    });

    console.log('[IRC Provision] Successfully provisioned IRC user:', {
      ircUsername,
      userId: user.sub,
      userName: user.name,
      communityId,
      networkName: 'commonground',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      ircUsername,
      ircPassword, // Plain password for The Lounge login
      networkName: 'commonground'
    } as ProvisionResponse);
    
  } catch (error) {
    console.error('[IRC Provision] Error provisioning IRC user:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.sub,
      userName: user.name,
      communityId,
      timestamp: new Date().toISOString()
    });
    
    // Return user-friendly error message
    const userMessage = error instanceof Error && error.message.includes('connection') 
      ? 'Unable to connect to chat service. Please try again.'
      : 'Failed to set up chat access. Please try again or contact support.';
      
    return NextResponse.json(
      { error: userMessage, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(provisionIrcUserHandler, false);
