# Standalone IRC Provisioning Architecture Research

## Problem Statement

When `host-service` embeds the `curia` app with `mod=standalone` query parameter, IRC provisioning should happen at the host-service level, not at the curia app level. This prevents users from logging out of other community iframes when they open a new one.

## Current Architecture Analysis

### Multi-Repo Setup
- **curia**: Main forum app (can run standalone or embedded)
- **host-service**: Hosts multiple curia instances as iframes
- **cg-plugin-lib**: Client-side post-message library
- **cg-plugin-lib-host**: Host-side post-message library  
- **iframe-api-proxy**: Proxy for CORS/CSP restricted API calls

### Current IRC Provisioning Flow
- Currently happens at curia app level in `useChatSession` hook
- Calls `/api/irc-user-provision` endpoint directly
- This invalidates passwords for other open community iframes

## Required Changes

### 1. Detection Logic
- Check for `mod=standalone` query parameter in curia app
- Conditional IRC provisioning based on this parameter

### 2. Post-Message API Extension
- Add new message type for IRC credential requests
- Implement in both cg-plugin-lib packages

### 3. Host-Service IRC Provisioning
- Move IRC provisioning logic to host-service
- Handle multiple community contexts
- Manage shared IRC credentials

### 4. Iframe-API-Proxy Integration
- Route IRC provisioning calls through proxy
- Handle CORS/CSP restrictions

## Code Investigation Progress

### Files Investigated
- [x] Current IRC provisioning implementation
- [x] Post-message system architecture
- [x] Host-service embedding logic
- [x] Iframe-proxy setup

### Key Findings

#### 1. Current IRC Provisioning Implementation
**Location**: `/src/hooks/useChatSession.ts` + `/src/utils/chat-api-client.ts`

- IRC provisioning happens in `useChatSession` hook on app initialization
- Calls `provisionIrcUser()` function which hits `/api/irc-user-provision` endpoint
- Returns `IrcCredentials` with username, password, networkName
- **Problem**: Every curia iframe calls this independently, invalidating other sessions

#### 2. Post-Message System Architecture
**Packages**: `cg-plugin-lib` (client) + `cg-plugin-lib-host` (host)

**Current Message Types**:
```typescript
enum MessageType {
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response', 
  INIT = 'init',
  ERROR = 'error'
}
```

**Message Structure**:
```typescript
interface HostMessage {
  type: MessageType;
  iframeUid: string;
  requestId: string;
  method?: string;     // API method name
  params?: any;        // Method parameters
  data?: any;          // Response data
  signature?: string;  // Crypto signature
  timestamp?: number;
}
```

#### 3. Host-Service Embedding Logic
**Location**: `/host-service/src/lib/embed/plugin-host/InternalPluginHost.ts`

- Host-service creates iframe URLs with `?mod=standalone` parameter
- Format: `http://localhost:3000/?mod=standalone&cg_theme=light&iframeUid=MDOGMXOOER`
- Detection logic exists: `currentIframe.src.includes('mod=standalone')`

#### 4. Iframe-API-Proxy Structure
**Location**: `/iframe-api-proxy/src/`

- Provides `ApiProxyClient` (customer page) and `ApiProxyServer` (iframe)
- Handles CORS/CSP restrictions for cross-origin API calls
- Used for routing API calls from iframe through host

## Implementation Plan

### Phase 1: Detection Logic in Curia App
**Location**: `/src/hooks/useChatSession.ts`

```typescript
// Check for standalone mode
const searchParams = new URLSearchParams(window.location.search);
const isStandalone = searchParams.has('mod') && searchParams.get('mod') === 'standalone';

if (isStandalone) {
  // Request IRC credentials from host-service via post-message
  const ircCredentials = await cgLib.getIrcCredentials();
} else {
  // Use current direct provisioning logic
  const ircCredentials = await provisionIrcUser(token!, chatBaseUrl, curiaBaseUrl);
}
```

### Phase 2: Extend Post-Message API
**Files to modify**:
- `/cg-plugin-lib/src/CgPluginLib.ts` - Add `getIrcCredentials()` method
- `/cg-plugin-lib/src/types.ts` - Add IRC-related types
- `/cg-plugin-lib-host/src/types.ts` - Mirror the types

**New API Method**:
```typescript
// In CgPluginLib.ts
public async getIrcCredentials(): Promise<ApiResponse<IrcCredentials>> {
  return this.makeApiRequest('getIrcCredentials');
}

// New interface in types.ts
export interface IrcCredentials {
  success: boolean;
  ircUsername: string;
  ircPassword: string;
  networkName: string;
}
```

### Phase 3: Host-Service IRC Provisioning
**Location**: `/host-service/src/lib/PluginHost.ts`

Add new case to switch statement:
```typescript
case 'getIrcCredentials':
  responseData = await this.dataProvider.getIrcCredentials(
    request.userId || 'default_user',
    request.communityId
  );
  break;
```

**Location**: `/host-service/src/lib/DataProvider.ts`
```typescript
public async getIrcCredentials(userId: string, communityId: string): Promise<IrcCredentials> {
  // Call curia's IRC provisioning endpoint via iframe-api-proxy
  // Or implement IRC provisioning logic directly in host-service
}
```

### Phase 4: Iframe-API-Proxy Integration
**Option A**: Route through existing proxy
- Use iframe-api-proxy to call curia's `/api/irc-user-provision` from host-service
- Maintains centralized IRC logic in curia

**Option B**: Duplicate IRC logic in host-service  
- Copy IRC provisioning logic to host-service
- Requires duplicating Soju admin service

## Architecture Decision Points

### 1. Where to Handle IRC Provisioning?
- **Option A**: Host-service calls curia's API via proxy (recommended)
- **Option B**: Duplicate IRC logic in host-service
- **Recommendation**: Option A keeps logic centralized

### 2. Session Management Strategy
- Host-service maintains one IRC session per user (not per community)
- Curia iframes receive the same IRC credentials
- Eliminates cross-iframe logout issues

### 3. Backward Compatibility
- Non-standalone mode continues using current direct provisioning
- Standalone mode uses post-message API
- Zero breaking changes for existing deployments

## Questions for Clarification

1. **IRC Session Scope**: Should IRC credentials be per-user globally, or per-user-per-community?
   
2. **Host-Service IRC Logic**: Do you prefer routing through curia's existing API (Option A) or duplicating the logic in host-service (Option B)?

3. **Error Handling**: How should the curia iframe handle IRC provisioning failures from host-service? (Fallback to direct provisioning vs. show error state)

---
*Research Status: In Progress*
*Last Updated: [Current Date]*