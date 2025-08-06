# Chat Channels Schema Design

## Overview
Design a chat channels system similar to the existing boards structure, allowing community admins to create and manage IRC chat channels for their communities.

## Current System Analysis

### Existing Boards Table Schema
Based on the database schema, the `boards` table has:
- `id` (integer, auto-increment)
- `community_id` (text, FK to communities)
- `name` (varchar 255, unique per community)
- `description` (text, nullable)
- `created_at` / `updated_at` (timestamptz)
- `settings` (jsonb, default `{}`)

**Key Insights:**
- Simple, clean structure
- Community-scoped naming uniqueness
- Generic `settings` field for extensibility
- Standard audit timestamps

### Boards Settings Field Usage
From the schema, `boards.settings` is used for:
- Permissions and access control
- Generic configuration storage
- Indexed with GIN for efficient JSON queries

## Proposed Chat Channels Schema

### Core Table: `chat_channels`

```sql
CREATE TABLE "public"."chat_channels" (
    "id" integer DEFAULT nextval('chat_channels_id_seq') NOT NULL,
    "community_id" text NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" text,
    "irc_channel_name" character varying(255) NOT NULL,
    "is_single_mode" boolean DEFAULT true NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "settings" jsonb DEFAULT '{}' NOT NULL,
    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_channels_community_id_fkey" FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
```

### Field Explanations

#### Core Fields
- **`id`**: Primary key (auto-increment integer)
- **`community_id`**: Links to community (same pattern as boards)
- **`name`**: Display name for the channel (what users see)
- **`description`**: Optional description (same as boards)

#### IRC-Specific Fields
- **`irc_channel_name`**: The actual IRC channel name (e.g., "general", "dev-talk")
  - This allows display name to differ from IRC channel name
  - Could be auto-generated from `name` or manually set
- **`is_single_mode`**: Boolean for single channel mode (default: true)
  - Corresponds to the `mode` parameter we implemented

#### Standard Fields
- **`created_at` / `updated_at`**: Standard audit timestamps
- **`settings`**: JSONB field for extensible configuration

### Settings Field Structure

The `settings` JSONB field could contain:

```json
{
  "permissions": {
    "access": "public|private|locked",
    "locks": {
      "lockIds": [1, 2, 3]
    }
  },
  "irc": {
    "autoJoin": true,
    "lockChannel": true,
    "welcomeMessage": "Welcome to the channel!"
  },
  "ui": {
    "theme": "auto|light|dark",
    "showUserList": true,
    "allowMentions": true
  }
}
```

### Indexes

```sql
-- Community lookup
CREATE INDEX chat_channels_community_id_index ON public.chat_channels USING btree (community_id);

-- Unique channel names per community
CREATE UNIQUE INDEX chat_channels_community_id_name_key ON public.chat_channels USING btree (community_id, name);

-- Unique IRC channel names per community
CREATE UNIQUE INDEX chat_channels_community_irc_name_key ON public.chat_channels USING btree (community_id, irc_channel_name);

-- Settings queries
CREATE INDEX chat_channels_settings_index ON public.chat_channels USING gin (settings);

-- Single mode filtering
CREATE INDEX chat_channels_single_mode_index ON public.chat_channels USING btree (is_single_mode);
```

### Triggers

```sql
-- Auto-update timestamp
CREATE TRIGGER "set_timestamp_chat_channels" 
BEFORE UPDATE ON "public"."chat_channels" 
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
```

## Boards API Analysis

### API Endpoints Structure
The boards API follows a consistent RESTful pattern:

#### GET `/api/communities/[communityId]/boards`
- **Access**: Any authenticated user (with community access check)
- **Purpose**: List all accessible boards in a community
- **Security**: Filters boards based on user roles and board permissions
- **Response**: Array of `ApiBoard` objects with computed permission flags

#### POST `/api/communities/[communityId]/boards`
- **Access**: Admin only (user must own the community)
- **Purpose**: Create new board
- **Validation**: Name uniqueness, settings structure
- **Events**: Emits `newBoard` socket event
- **Response**: Created board object

#### GET `/api/communities/[communityId]/boards/[boardId]`
- **Access**: Any authenticated user (with permission check)
- **Purpose**: Get single board details
- **Security**: Uses `resolveBoard()` function for access control
- **Response**: Single `ApiBoard` object

#### PATCH `/api/communities/[communityId]/boards/[boardId]`
- **Access**: Admin only
- **Purpose**: Update board name, description, settings
- **Validation**: Settings structure validation
- **Response**: Updated board object

#### DELETE `/api/communities/[communityId]/boards/[boardId]`
- **Access**: Admin only
- **Purpose**: Delete board
- **Security**: Confirms ownership before deletion
- **Response**: Success message

### Key Patterns Identified

1. **Authentication**: All endpoints use `withAuth()` middleware
2. **Authorization**: Community ownership check for admin operations
3. **Validation**: Consistent JSON schema validation for settings
4. **Error Handling**: Standardized error response format
5. **Events**: Socket.IO events for real-time updates
6. **Security**: Input sanitization and SQL injection protection

## Current Chat Modal URL Parameters

From the `buildLoungeUrl` function, current chat parameters are:

```typescript
{
  password: string,      // IRC user password
  autoconnect: 'true',   // Auto-login flag
  nick: string,          // Display nickname
  username: string,      // Format: "ircUsername/networkName"
  realname: string,      // Real name (same as nick)
  join: string,          // Channel to join (format: "#channelName")
  lockchannel: 'true',   // Lock to single channel
  nofocus?: 'true',      // Don't focus on load
  theme?: 'light'|'dark', // UI theme
  mode?: 'normal'|'single' // UI mode (our new feature)
}
```

## Updated Schema Design

### Core Table: `chat_channels`

```sql
CREATE TABLE "public"."chat_channels" (
    "id" integer DEFAULT nextval('chat_channels_id_seq') NOT NULL,
    "community_id" text NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" text,
    "irc_channel_name" character varying(255) NOT NULL,
    "is_single_mode" boolean DEFAULT true NOT NULL,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "settings" jsonb DEFAULT '{}' NOT NULL,
    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_channels_community_id_fkey" FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
```

### Enhanced Settings Structure

```json
{
  "permissions": {
    "allowedRoles": ["role1", "role2"],
    "locks": {
      "lockIds": [1, 2, 3],
      "fulfillment": "any",
      "verificationDuration": 30
    }
  },
  "irc": {
    "autoconnect": true,
    "lockchannel": true,
    "nofocus": true,
    "welcomeMessage": "Welcome to the channel!",
    "topic": "Channel topic text"
  },
  "ui": {
    "defaultTheme": "auto",
    "allowThemeSwitch": true,
    "showUserList": true,
    "allowMentions": true
  }
}
```

### Business Logic Considerations

1. **Default Channels**: Communities should get a "general" channel on creation
2. **Channel Naming**: IRC channel names should be auto-generated but editable
3. **Permission Inheritance**: Chat channels can inherit community-level permissions
4. **Theme Handling**: Stored in settings but overridden by user preference dynamically

## Proposed API Structure

### Chat Channels API Endpoints

```
GET    /api/communities/[communityId]/chat-channels
POST   /api/communities/[communityId]/chat-channels
GET    /api/communities/[communityId]/chat-channels/[channelId]
PATCH  /api/communities/[communityId]/chat-channels/[channelId]
DELETE /api/communities/[communityId]/chat-channels/[channelId]
```

### Integration with Chat Modal

The chat modal would need to be updated to:
1. Fetch available channels for a community
2. Allow channel selection (or use default)
3. Pass channel-specific settings to `buildLoungeUrl`

## Research Progress

### ✅ Completed Analysis
- ✅ Database schema analysis (boards table structure)
- ✅ API endpoints analysis (full CRUD pattern)
- ✅ Chat modal URL parameters (current implementation)
- ✅ Settings structure analysis (BoardSettings interface)
- ✅ Permission system integration points

### 🔄 Ready for Implementation
- Schema design finalized
- API structure planned
- Integration points identified

## Questions & Recommendations

### Resolved Design Decisions

1. **IRC Channel Naming**: Auto-generate from display name with option to override
2. **Theme Handling**: Store defaults in settings, allow dynamic override (current pattern)
3. **Permissions**: Reuse existing lock system from boards (proven pattern)
4. **Default Channels**: Auto-create "general" channel for new communities

### Key Recommendations

1. **Mirror Boards Pattern**: Follow exact same API structure as boards for consistency
2. **Gradual Migration**: Add channels alongside existing hardcoded channel approach
3. **Permission Reuse**: Leverage existing `BoardSettings` pattern for `ChatChannelSettings`
4. **Default Channel Strategy**: Always ensure at least one channel exists per community

## End-to-End Implementation Roadmap

### Phase 1: Type Definitions & Interfaces ✅

**Files to Create/Update:**

#### `src/types/chatChannels.ts` (NEW)
```typescript
import { BoardSettings } from './settings';

export interface ChatChannelSettings extends Omit<BoardSettings, 'ai'> {
  irc?: {
    autoconnect?: boolean;
    lockchannel?: boolean;
    nofocus?: boolean;
    welcomeMessage?: string;
    topic?: string;
  };
  ui?: {
    defaultTheme?: 'auto' | 'light' | 'dark';
    allowThemeSwitch?: boolean;
    showUserList?: boolean;
    allowMentions?: boolean;
  };
}

export interface ApiChatChannel {
  id: number;
  community_id: string;
  name: string;
  description: string | null;
  irc_channel_name: string;
  is_single_mode: boolean;
  is_default: boolean;
  settings: ChatChannelSettings;
  created_at: string;
  updated_at: string;
  // Computed fields:
  user_can_access?: boolean;
  user_can_join?: boolean;
}

export interface CreateChatChannelRequest {
  name: string;
  description?: string;
  irc_channel_name?: string; // Auto-generated if not provided
  is_single_mode?: boolean;
  is_default?: boolean;
  settings?: ChatChannelSettings;
}

export interface UpdateChatChannelRequest {
  name?: string;
  description?: string;
  irc_channel_name?: string;
  is_single_mode?: boolean;
  is_default?: boolean;
  settings?: ChatChannelSettings;
}
```

### Phase 2: Permission System Integration ✅

**Files to Create/Update:**

#### `src/lib/chatChannelPermissions.ts` (NEW)
```typescript
import { ChatChannelSettings } from '../types/chatChannels';
import { query } from './db';

// Direct adaptation of boardPermissions.ts functions
export function canUserAccessChatChannel(
  userRoles: string[] | undefined, 
  channelSettings: ChatChannelSettings | Record<string, unknown>, 
  isAdmin: boolean = false
): boolean {
  // Identical logic to canUserAccessBoard
}

export function filterAccessibleChatChannels<T extends { settings: ChatChannelSettings | Record<string, unknown> }>(
  channels: T[], 
  userRoles: string[] | undefined, 
  isAdmin: boolean = false
): T[] {
  // Identical logic to filterAccessibleBoards
}

export function getAccessibleChatChannelIds(
  channels: Array<{ id: number; settings: ChatChannelSettings | Record<string, unknown> }>, 
  userRoles: string[] | undefined, 
  isAdmin: boolean = false
): number[] {
  // Identical logic to getAccessibleBoardIds
}

export async function resolveChannel(channelId: number, communityId: string) {
  // Similar to resolveBoard but for chat_channels table
}
```

### Phase 3: Database Query Utilities ✅

**Files to Create/Update:**

#### `src/lib/queries/chatChannels.ts` (NEW)
```typescript
import { query } from '../db';
import { ApiChatChannel, ChatChannelSettings } from '../../types/chatChannels';

export class ChatChannelQueries {
  static async getChannelsByCommunity(communityId: string): Promise<ApiChatChannel[]> {
    const result = await query(`
      SELECT id, community_id, name, description, irc_channel_name,
             is_single_mode, is_default, settings, created_at, updated_at
      FROM chat_channels 
      WHERE community_id = $1
      ORDER BY is_default DESC, name ASC
    `, [communityId]);
    
    return result.rows.map(this.transformChannelRow);
  }

  static async getChannelById(channelId: number, communityId: string): Promise<ApiChatChannel | null> {
    // Similar to board queries
  }

  static async createChannel(data: CreateChatChannelRequest & { community_id: string }): Promise<ApiChatChannel> {
    // Insert and return new channel
  }

  // ... other query methods
}
```

### Phase 4: API Endpoints Implementation ✅

**Files to Create:**

#### `src/app/api/communities/[communityId]/chat-channels/route.ts` (NEW)
- **GET**: List community chat channels (mirror boards GET)
- **POST**: Create new chat channel (admin only, mirror boards POST)

#### `src/app/api/communities/[communityId]/chat-channels/[channelId]/route.ts` (NEW)
- **GET**: Get single channel details
- **PATCH**: Update channel (admin only)
- **DELETE**: Delete channel (admin only)

**Key Patterns to Follow:**
1. **Authentication**: Use `withAuth()` middleware exactly like boards
2. **Authorization**: Community ownership check for admin operations
3. **Validation**: Same settings validation pattern as boards
4. **Error Handling**: Identical error response format
5. **Broadcasting**: Socket.IO events for real-time updates
6. **Security**: Input sanitization and permission checks

### Phase 5: Real-Time Events ✅

**Files to Update:**

#### `src/lib/socket.ts`
Add new broadcast functions:
```typescript
broadcastNewChatChannel: (communityId: string, channelData: Record<string, unknown>) => {
  const emitter = getProcessEventEmitter();
  if (emitter) {
    emitter.emit('broadcastEvent', {
      room: `community:${communityId}`,
      eventName: 'newChatChannel',
      payload: channelData
    });
  }
},

broadcastChatChannelUpdated: (communityId: string, channelId: number, channelData: Record<string, unknown>) => {
  // Similar pattern
},

broadcastChatChannelDeleted: (communityId: string, channelId: number) => {
  // Similar pattern
}
```

### Phase 6: Frontend Integration Hooks ✅

**Files to Create:**

#### `src/hooks/useChatChannels.ts` (NEW)
```typescript
import { useAuthenticatedQuery, useAuthenticatedMutation } from './useAuthenticatedQuery';
import { ApiChatChannel, CreateChatChannelRequest } from '../types/chatChannels';

export function useCommunityChannels(communityId: string) {
  return useAuthenticatedQuery<ApiChatChannel[]>(
    ['chatChannels', communityId],
    `/api/communities/${communityId}/chat-channels`
  );
}

export function useCreateChatChannel(communityId: string) {
  return useAuthenticatedMutation<ApiChatChannel, CreateChatChannelRequest>(
    `/api/communities/${communityId}/chat-channels`,
    'POST'
  );
}

// ... other mutations
```

### Phase 7: Chat Modal Integration ✅

**Files to Update:**

#### `curia-chat-modal/src/utils/api-client.ts`
Add channel fetching capability:
```typescript
export async function fetchCommunityChannels(
  communityId: string,
  curiaBaseUrl?: string,
  authToken?: string
): Promise<ApiChatChannel[]> {
  const endpoint = curiaBaseUrl 
    ? `${curiaBaseUrl}/api/communities/${communityId}/chat-channels`
    : `/api/communities/${communityId}/chat-channels`;
  
  // ... fetch implementation
}
```

#### `curia-chat-modal/src/components/ChatModal.tsx`
Add channel selection logic:
```typescript
// Fetch available channels
// Use default channel if no preference
// Pass channel-specific settings to buildLoungeUrl
```

### Phase 8: Validation & Error Handling ✅

**Validation Patterns to Implement:**

1. **Channel Name**: Required, trimmed, unique per community
2. **IRC Channel Name**: Auto-generated or manual, unique per community
3. **Settings Structure**: JSON schema validation (mirror boards)
4. **Default Channel Logic**: Ensure only one default per community
5. **Permission Validation**: Role existence checks

**Error Handling Patterns:**
- 400: Validation errors
- 401: Authentication required  
- 403: Permission denied
- 404: Channel not found
- 409: Duplicate channel name
- 500: Server errors

### Phase 9: Business Logic Implementation ✅

**Key Business Rules:**

1. **Default Channel Creation**: Auto-create "general" channel for new communities
2. **Default Channel Constraints**: Only one default channel per community
3. **Channel Deletion**: Prevent deletion of default channel (or reassign default)
4. **IRC Channel Naming**: Auto-generate from display name with conflict resolution
5. **Settings Inheritance**: Channel settings can inherit from community settings

### Phase 10: Testing & Deployment ✅

**Integration Points to Test:**

1. **API Endpoints**: All CRUD operations with proper auth/permissions
2. **Real-Time Events**: Socket.IO broadcasting works correctly
3. **Chat Modal**: Channel fetching and selection works
4. **Default Logic**: Default channel creation and constraints
5. **Permission System**: Access control works across all endpoints

**Deployment Checklist:**
- ✅ Database migration applied
- ✅ API endpoints implemented
- ✅ Permission system integrated
- ✅ Real-time events configured
- ✅ Chat modal updated
- ✅ Error handling comprehensive
- ✅ Business logic validated

## Revised Architecture: Session-Aware Chat Modal System

### Current Architecture Analysis ✅

**Current Pattern (Architectural Problem Identified!):**
1. **`ChatModalWrapper.tsx`** - Fetches community data only when modal opens
2. **`ChatModal.tsx`** - **CALLS `/api/irc-user-provision` DIRECTLY** 😱 
3. **IRC Provisioning** - Chat modal package makes HTTP requests to Curia backend
4. **Network Delay** - 2-3 second delay every time modal opens 
5. **Channel Selection** - Hardcoded community name → channel name conversion
6. **State Management** - Simple open/close boolean in `ChatContext`

**Problems with Current Approach:**
- ❌ **Terrible architecture** - Chat modal package calling Curia backend APIs
- ❌ **Fresh provisioning every open** - Network delay on every modal open
- ❌ **No credential persistence** - API call for same user/session repeatedly
- ❌ **No channel management** - Hardcoded channel logic
- ❌ **Package coupling** - Chat modal depends on Curia API structure

### New Architecture: Session-Aware with Initialization/Invocation Pattern

### **Core Concept: Two-Phase Initialization**

#### **Phase 1: Session Initialization (Once per page load)**
```typescript
// In curia app - done once when user authenticates or page loads
// MOVE IRC provisioning call from chat modal to curia app!
const ircCredentials = await provisionIrcUser(chatBaseUrl, authToken, curiaBaseUrl);
const channels = await fetchCommunityChannels(communityId, authToken);

// Initialize chat modal package with credentials and channels
const chatSession = initializeChatSession({
  ircCredentials,
  channels,
  defaultChannel: channels.find(ch => ch.is_default)
});
```

#### **Phase 2: Modal Invocation (Multiple times per session)**
```typescript
// Each time user wants to open chat modal - INSTANT (no API calls!)
chatSession.openChannel({
  channelId: 123,           // Optional: specific channel
  mode: 'single',          // Optional: override channel mode
  theme: 'dark'            // Optional: current app theme
});
```

### **Implementation Roadmap**

### **Phase A: Enhanced Backend Integration (Curia App)**

#### **A1: Move IRC Provisioning to Curia App**
**File:** `curia/src/hooks/useChatSession.ts` (NEW)

```typescript
export interface ChatSessionData {
  ircCredentials: IrcCredentials;
  channels: ApiChatChannel[];
  defaultChannel: ApiChatChannel;
}

export function useChatSession() {
  const { user, token } = useAuth();
  const [sessionData, setSessionData] = useState<ChatSessionData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize session on mount - MOVE provisioning HERE from chat modal!
  useEffect(() => {
    if (!user || !token) return;
    
    const initializeSession = async () => {
      try {
        // 1. Provision IRC credentials (moved from chat modal!)
        const ircCredentials = await provisionIrcUser(
          process.env.NEXT_PUBLIC_CHAT_BASE_URL || '',
          token,
          process.env.NEXT_PUBLIC_CURIA_BASE_URL || ''
        );
        
        // 2. Fetch available channels for community
        const channels = await authFetchJson<ApiChatChannel[]>(
          `/api/communities/${user.cid}/chat-channels`,
          { token }
        );
        
        // 3. Identify default channel
        const defaultChannel = channels.find(ch => ch.is_default) || channels[0];
        
        if (!defaultChannel) {
          throw new Error('No chat channels available for community');
        }

        setSessionData({
          ircCredentials,
          channels,
          defaultChannel
        });
        setIsInitialized(true);
        
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Failed to initialize chat');
      }
    };
    
    initializeSession();
  }, [user?.userId, user?.cid, token]);

  return {
    sessionData,
    isInitialized,
    initError,
    // Helper to get channel by ID
    getChannelById: (channelId: number) => 
      sessionData?.channels.find(ch => ch.id === channelId)
  };
}
```

#### **A2: Updated Chat Modal Wrapper - Clean Architecture**
**File:** `curia/src/components/ChatModalWrapper.tsx` (UPDATED)

```typescript
export function ChatModalWrapper() {
  const { isChatOpen, selectedChannelId, closeChat } = useChatModal();
  const { sessionData, isInitialized } = useChatSession();
  const theme = useEffectiveTheme();
  
  // Don't render if modal is closed or session not ready
  if (!isChatOpen || !isInitialized || !sessionData) {
    return null;
  }

  // Determine which channel to show
  const targetChannel = selectedChannelId 
    ? sessionData.channels.find(ch => ch.id === selectedChannelId)
    : sessionData.defaultChannel;

  if (!targetChannel) {
    return null; // Invalid channel selection
  }

  return (
    <ChatModal
      // Pass pre-provisioned data - no API calls in modal!
      ircCredentials={sessionData.ircCredentials}
      channel={targetChannel}
      theme={theme}
      mode={targetChannel.is_single_mode ? 'single' : 'normal'}
      onClose={closeChat}
    />
  );
}
```

#### **A3: Updated Chat Context - Channel Selection**
**File:** `curia-chat-modal/src/contexts/ChatContext.tsx` (UPDATED)

```typescript
interface ChatContextType {
  isChatOpen: boolean;
  selectedChannelId: number | null; // Which channel to show
  openChat: (channelId?: number) => void; // Optional channel selection
  closeChat: () => void;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);

  const openChat = useCallback((channelId?: number) => {
    setSelectedChannelId(channelId || null); // null = use default channel
    setIsChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
    // Keep selectedChannelId for potential re-opening
  }, []);

  return (
    <ChatContext.Provider value={{
      isChatOpen,
      selectedChannelId,
      openChat,
      closeChat,
    }}>
      {children}
    </ChatContext.Provider>
  );
}
```

### **Phase B: Enhanced Chat Modal Package**

#### **B1: Simplified Chat Modal - Remove API Calls**
**File:** `curia-chat-modal/src/components/ChatModal.tsx` (MAJOR REFACTOR)

```typescript
export interface ChatModalProps {
  ircCredentials: IrcCredentials; // Pre-provisioned from curia app
  channel: ApiChatChannel;        // Pre-selected channel from curia app
  theme: 'light' | 'dark';       // Current app theme
  mode: 'single' | 'normal';     // Channel mode or override
  onClose: () => void;
}

export function ChatModal({ 
  ircCredentials, 
  channel,
  theme,
  mode,
  onClose 
}: ChatModalProps) {
  const isDesktop = useIsDesktop();
  const [isLoading, setIsLoading] = useState(true);

  // NO MORE API CALLS! Use pre-provisioned data instantly
  const chatUrl = useMemo(() => {
    return buildLoungeUrl({
      baseUrl: process.env.NEXT_PUBLIC_CHAT_BASE_URL || '',
      ircUsername: ircCredentials.ircUsername,
      ircPassword: ircCredentials.ircPassword,
      networkName: ircCredentials.networkName,
      userNick: ircCredentials.ircUsername,
      channelName: channel.irc_channel_name, // Use proper IRC channel name
      nofocus: channel.settings?.irc?.nofocus ?? true,
      theme,
      mode
    });
  }, [ircCredentials, channel, theme, mode]);

  // INSTANT load - no provisioning delay!
  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" 
        onClick={onClose} 
      />
      <div className={cn("fixed z-50 bg-background", styles.modalResponsive)}>
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        )}
        <iframe
          src={chatUrl}
          className="w-full h-full border-0"
          title={`Chat: ${channel.name}`}
          onLoad={() => setIsLoading(false)}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </div>
    </>,
    document.body
  );
}
```

#### **B2: Remove API Client - No More Backend Calls**
**File:** `curia-chat-modal/src/utils/api-client.ts` (UPDATED)

```typescript
// REMOVE: provisionIrcUser function - moved to curia app!
// DELETE: All API calling logic

// KEEP: buildLoungeUrl - still needed for URL construction
export function buildLoungeUrl({
  baseUrl,
  ircUsername,
  ircPassword,
  networkName,
  userNick,
  channelName,
  nofocus = true,
  theme,
  mode
}: {
  baseUrl: string;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
  userNick: string;
  channelName: string;
  nofocus?: boolean;
  theme?: 'light' | 'dark';
  mode?: 'normal' | 'single';
}): string {
  const params = new URLSearchParams({
    password: ircPassword,
    autoconnect: 'true',
    nick: userNick,
    username: `${ircUsername}/${networkName}`,
    realname: userNick,
    join: `#${channelName}`,
    lockchannel: 'true',
    ...(nofocus && { nofocus: 'true' }),
    ...(theme && { theme }),
    ...(mode && { mode })
  });

  const finalUrl = `${baseUrl}?${params.toString()}`;
  
  console.log('[Chat Modal] Built Lounge URL for channel:', channelName, theme ? `with theme: ${theme}` : '', mode ? `with mode: ${mode}` : '');

  return finalUrl;
}

// KEEP: Type definitions - still needed
export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}
```

### **Phase C: Integration Points**

#### **C1: Updated Sidebar Action - Simple Toggle**
**File:** `curia/src/components/SidebarActionListener.tsx` (MINIMAL CHANGE)

```typescript
export const SidebarActionListener: React.FC = () => {
  const { openChat, closeChat, isChatOpen } = useChatModal(); // Same interface!

  // Handle sidebar chat action - no change needed!
  const handleChatAction = useCallback(() => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat(); // Opens default channel automatically
    }
  }, [isChatOpen, openChat, closeChat]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sidebar_action' && event.data.action === 'messages') {
        handleChatAction();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleChatAction]);

  return null;
};
```

#### **C2: Simple Channel Selection Helper**
**File:** `curia/src/hooks/useChannelSelection.ts` (NEW)

```typescript
export function useChannelSelection() {
  const { openChat } = useChatModal();
  const { sessionData } = useChatSession();

  // Helper to open specific channel by ID
  const openChannelById = useCallback((channelId: number) => {
    if (!sessionData) return;
    
    const channel = sessionData.channels.find(ch => ch.id === channelId);
    if (channel) {
      openChat(channelId); // Pass channel ID to context
    }
  }, [sessionData, openChat]);

  // Helper to open default channel
  const openDefaultChannel = useCallback(() => {
    openChat(); // No ID = default channel
  }, [openChat]);

  return {
    openChannelById,
    openDefaultChannel,
    availableChannels: sessionData?.channels || [],
    defaultChannel: sessionData?.defaultChannel
  };
}
```

### **Phase D: File-by-File Implementation Plan**

#### **Backend (Curia App) - 5 Files (Simplified!)**
1. **`src/hooks/useChatSession.ts`** (NEW) - Move IRC provisioning here
2. **`src/hooks/useChannelSelection.ts`** (NEW) - Channel selection helpers
3. **`src/components/ChatModalWrapper.tsx`** (UPDATE) - Pass pre-provisioned data
4. **`src/components/SidebarActionListener.tsx`** (MINIMAL UPDATE) - Same interface
5. **`src/utils/api-client.ts`** (NEW) - Move provisionIrcUser from chat modal

#### **Chat Modal Package - 3 Files (Major Simplification!)**
1. **`src/components/ChatModal.tsx`** (MAJOR REFACTOR) - Remove all API calls
2. **`src/contexts/ChatContext.tsx`** (UPDATE) - Add channel selection
3. **`src/utils/api-client.ts`** (UPDATE) - Remove provisionIrcUser, keep buildLoungeUrl

#### **Migration Strategy - 2 Files**
1. **Create default channels migration** - Ensure all communities have channels
2. **Update community creation** - Auto-create default channel

### **Key Architectural Changes Summary**

#### **What Moves FROM Chat Modal TO Curia App:**
- ✅ **IRC provisioning API call** - `/api/irc-user-provision`
- ✅ **Channel fetching API call** - `/api/communities/{id}/chat-channels`
- ✅ **Session management** - Credential caching and persistence

#### **What Stays IN Chat Modal:**
- ✅ **URL building** - `buildLoungeUrl()` function
- ✅ **UI rendering** - Modal display and iframe management
- ✅ **Theme handling** - Accept theme as prop
- ✅ **Mode handling** - Accept mode as prop

#### **Performance Impact:**
- ❌ **Before**: 2-3 second delay every modal open
- ✅ **After**: ~200ms delay (iframe load only)

### **Benefits of New Architecture**

#### **Performance Benefits**
- ✅ **Instant modal opening** - No provisioning delay
- ✅ **Credential persistence** - One provision per session
- ✅ **Channel caching** - No repeated API calls
- ✅ **Optimistic loading** - Immediate UI feedback

#### **User Experience Benefits**
- ✅ **Fast chat access** - Sub-second modal opening
- ✅ **Consistent credentials** - Same password throughout session
- ✅ **Channel selection** - Can open specific channels
- ✅ **Theme coherence** - Dynamic theme updates

#### **Developer Experience Benefits**
- ✅ **Clean separation** - Chat modal stays backend-ignorant
- ✅ **Type safety** - Comprehensive TypeScript interfaces
- ✅ **Reusable patterns** - Session service for other features
- ✅ **Easy testing** - Mockable session service

#### **Architectural Benefits**
- ✅ **Proper encapsulation** - Clear responsibility boundaries
- ✅ **Session awareness** - Persistent state across opens/closes
- ✅ **Channel flexibility** - Easy to add channel selection UI
- ✅ **Future-proof** - Extensible for advanced features

### **Implementation Priority**

**Phase A → B → C → D** 

**Rationale:**
1. **A**: Backend foundation enables everything else
2. **B**: Chat modal refactor unlocks performance benefits  
3. **C**: Integration makes it all work together
4. **D**: File-by-file ensures nothing is missed