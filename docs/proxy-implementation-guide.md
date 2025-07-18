# Forum Integration Guide: CSP API Proxy

## 📦 Package Installation

```bash
# Install the API proxy package
yarn add @curia_/iframe-api-proxy

# Verify installation
yarn list @curia_/iframe-api-proxy
```

## 🎯 Integration Overview

The forum app needs to include an **ApiProxyServer** component that runs in the background to handle API requests from the customer page. This server receives PostMessage requests and makes actual API calls to the host service.

## 🔧 Implementation Steps

### Step 1: Import the Package

```typescript
// In your main app file or root component
import { ApiProxyServer } from '@curia_/iframe-api-proxy';
```

### Step 2: Create ApiProxyServer Component

```typescript
// Create a background component that initializes the proxy server
const ApiProxyServerComponent: React.FC = () => {
  React.useEffect(() => {
    // Initialize API proxy server when forum loads
    const proxyServer = new ApiProxyServer({
      baseUrl: process.env.REACT_APP_HOST_SERVICE_URL || 'https://curia.network',
      debug: true,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Optional: Restrict origins for security
      allowedOrigins: ['https://customer.com', 'https://example.com'] // or [] for any origin
    });

    console.log('[Forum] API proxy server initialized:', proxyServer.getStatus());

    // Cleanup on unmount
    return () => {
      proxyServer.destroy();
      console.log('[Forum] API proxy server destroyed');
    };
  }, []);

  return null; // This component doesn't render anything
};
```

### Step 3: Integration Timing (CRITICAL)

**🚨 TIMING REQUIREMENT**: The ApiProxyServer MUST be initialized **BEFORE** the forum makes any API requests to the parent.

```typescript
// In your main App component or root layout
function ForumApp() {
  return (
    <div>
      {/* STEP 1: Initialize proxy server FIRST */}
      <ApiProxyServerComponent />
      
      {/* STEP 2: Then render your forum components */}
      <ForumLayout>
        <ForumContent />
      </ForumLayout>
    </div>
  );
}
```

### Step 4: Environment Configuration

Add to your `.env` file:

```bash
# Host service URL where API calls should be made
REACT_APP_HOST_SERVICE_URL=https://curia.network

# For local development
REACT_APP_HOST_SERVICE_URL=http://localhost:3001
```

### Step 5: Verification

Add debug logging to verify the proxy is working:

```typescript
// In your API request code (wherever you call the parent)
console.log('[Forum] Making API request through proxy:', {
  method: 'getUserInfo',
  userId: 'user123'
});

// The parent should now log:
// [InternalPluginHost] Making API request via proxy: getUserInfo
// [ApiProxyServer] Received proxy request: getUserInfo
// [ApiProxyServer] Success response sent: {...}
```

## 🔄 Message Flow After Integration

```
Forum Component
  ↓ PostMessage: API_REQUEST
InternalPluginHost (Parent)
  ↓ PostMessage: PROXY_API_REQUEST  
ApiProxyServer (Forum Iframe) ← YOUR NEW CODE
  ↓ fetch() to host service (same domain, CSP allowed)
Host Service API
  ↓ HTTP Response
ApiProxyServer
  ↓ PostMessage: PROXY_API_RESPONSE
InternalPluginHost
  ↓ PostMessage: API_RESPONSE
Forum Component ← Gets response
```

## 🛠️ Configuration Options

```typescript
interface ProxyServerConfig {
  baseUrl: string;                    // Required: Host service URL
  timeout?: number;                   // Default: 30000ms
  debug?: boolean;                    // Default: false
  headers?: Record<string, string>;   // Custom headers
  allowedOrigins?: string[];          // Security whitelist ([] = allow all)
  serverId?: string;                  // Custom server ID
}
```

## 🧪 Testing Steps

### Local Testing
1. Start host service: `http://localhost:3001`
2. Start forum app with proxy server integrated
3. Test forum in iframe context with CSP-enabled customer page
4. Verify console logs show proxy requests working

### Production Testing
1. Deploy forum with proxy server
2. Test on customer sites with strict CSP policies
3. Verify no CSP violations in browser console
4. Verify API requests complete successfully

## 🚨 Common Gotchas

### 1. **Timing Issues**
```typescript
// ❌ BAD: Forum makes API call before proxy server ready
useEffect(() => {
  makeApiCall(); // This might fail if proxy not ready
}, []);

// ✅ GOOD: Wait for proxy server to initialize
useEffect(() => {
  const timer = setTimeout(() => {
    makeApiCall(); // Give proxy server time to initialize
  }, 100);
  return () => clearTimeout(timer);
}, []);
```

### 2. **Environment Variables**
```typescript
// ❌ BAD: Hardcoded URLs
baseUrl: 'https://curia.network'

// ✅ GOOD: Environment-based URLs
baseUrl: process.env.REACT_APP_HOST_SERVICE_URL || 'https://curia.network'
```

### 3. **Debug Logging**
```typescript
// Always enable debug in development
const proxyServer = new ApiProxyServer({
  baseUrl: hostServiceUrl,
  debug: process.env.NODE_ENV === 'development', // Auto-enable in dev
  // ...other config
});
```

## 🎯 Success Indicators

After integration, you should see:

```bash
# Browser console logs
[Forum] API proxy server initialized: {requestCount: 0, errorCount: 0}
[Forum] Making API request through proxy: getUserInfo
[ApiProxyServer] Received proxy request: getUserInfo  
[ApiProxyServer] Success response sent: {success: true}

# No CSP violations
# No "fetch API cannot load" errors
# Forum loads and functions normally on customer sites
```

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify proxy server initialization logs
3. Ensure environment variables are set correctly
4. Test on a simple HTML page with strict CSP first

The proxy server handles all the PostMessage complexity automatically - you just need to initialize it before your forum starts making API requests.