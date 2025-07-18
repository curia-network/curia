# Redis-Based Presence Storage Research & Implementation Plan

## 🎯 **Problem Statement**

**Current Issue**: Multi-instance Socket.IO setup with Redis adapter successfully propagates events across instances, but initial presence synchronization (`globalPresenceSync`) only shows users connected to the same instance. This creates a "one-directional visibility" bug where users don't see each other consistently.

**Root Cause**: Presence data is stored in local in-memory maps (`devicePresence`, `userPresence`) on each instance, while only events are shared via Redis adapter.

---

## 🏗️ **Current Architecture Analysis**

### **In-Memory Data Structures**
```typescript
// Current implementation (server.ts)
const devicePresence = new Map<string, DevicePresence>();  // frameUID -> DevicePresence
const userPresence = new Map<string, EnhancedUserPresence>(); // userId -> EnhancedUserPresence
```

### **Data Flow Issues**
1. **Connection**: User connects → Stored in local map → Event broadcast via Redis ✅
2. **Initial Sync**: `getOnlineUsers()` → Returns only local map data ❌
3. **Real-time Updates**: Events propagate correctly via Redis ✅

### **Current DevicePresence Structure**
```typescript
interface DevicePresence {
  frameUID: string;              // Unique device identifier
  userId: string;
  userName: string;
  avatarUrl?: string;
  communityId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  currentBoardId?: number;
  currentBoardName?: string;
  connectedAt: Date;
  lastSeen: Date;
  socketId: string;
  isActive: boolean;
  communityShortId?: string;
  pluginId?: string;
  isTyping?: boolean;
  typingPostId?: number;
  typingBoardId?: number;
  typingContext?: 'post' | 'comment';
  typingTimestamp?: Date;
}
```

---

## 🔄 **Proposed Redis Architecture**

### **Redis Data Structure Strategy**

#### **Option A: Hash-Based Storage (Recommended)**
```redis
# Device presence by frameUID
HSET device:presence:ABC123 userId "user_123"
HSET device:presence:ABC123 userName "John Doe"
HSET device:presence:ABC123 communityId "community_456"
HSET device:presence:ABC123 currentBoardId "5"
HSET device:presence:ABC123 lastSeen "2025-01-15T20:47:00Z"
HSET device:presence:ABC123 socketId "socket_789"
HSET device:presence:ABC123 isActive "true"
# ... other fields

# User aggregated presence
HSET user:presence:user_123 devices "ABC123,XYZ789"
HSET user:presence:user_123 totalDevices "2"
HSET user:presence:user_123 isOnline "true"
HSET user:presence:user_123 lastSeen "2025-01-15T20:47:00Z"

# Index by community for fast queries
SADD community:presence:community_456 "user_123"

# TTL for automatic cleanup
EXPIRE device:presence:ABC123 600  # 10 minutes
EXPIRE user:presence:user_123 600
```

#### **Option B: JSON Storage (Alternative)**
```redis
# Store entire presence object as JSON
SET device:presence:ABC123 '{"userId":"user_123","userName":"John Doe",...}'
SET user:presence:user_123 '{"userId":"user_123","devices":[...],...}'

# TTL for cleanup
EXPIRE device:presence:ABC123 600
```

### **Redis Key Patterns**
```
device:presence:{frameUID}     # Individual device presence
user:presence:{userId}         # Aggregated user presence  
community:presence:{communityId} # Set of online users in community
active:devices                 # Set of all active device frameUIDs
active:users                   # Set of all active user IDs
```

---

## ⚡ **Performance Considerations**

### **Read Performance**
- **Current**: O(1) map lookup, ~1μs
- **Redis**: Network call + lookup, ~1-5ms over localhost
- **Impact**: 1000-5000x slower per operation

### **Write Performance**  
- **Current**: O(1) map update, ~1μs
- **Redis**: Network call + Redis write, ~1-5ms
- **Impact**: Similar latency increase

### **Memory Usage**
- **Current**: ~500 bytes per device in Node.js heap
- **Redis**: ~800-1200 bytes per device in Redis (depending on encoding)
- **Benefit**: Moves memory pressure off Node.js processes

### **Network Traffic**
- **Reads**: Each `getOnlineUsers()` → Redis query (vs free local read)
- **Writes**: Each presence update → Redis write (vs free local write)  
- **Estimation**: ~10-50KB/second additional traffic for active community

---

## 🛠️ **Implementation Strategy**

### **Phase 1: Dual-Write Pattern (Safe Migration)**
```typescript
// Write to both Redis and local maps during transition
async function updateDevicePresence(frameUID: string, data: DevicePresence) {
  // Write to Redis
  await redis.hset(`device:presence:${frameUID}`, data);
  await redis.expire(`device:presence:${frameUID}`, 600);
  
  // Write to local map (backwards compatibility)
  devicePresence.set(frameUID, data);
  
  // Update community index
  await redis.sadd(`community:presence:${data.communityId}`, data.userId);
}
```

### **Phase 2: Redis-First with Local Cache**
```typescript
// Read from Redis, cache locally for short periods
async function getOnlineUsers(): Promise<EnhancedUserPresence[]> {
  // Try local cache first (30 second TTL)
  if (presenceCache.has('online_users') && presenceCache.get('online_users').ttl > Date.now()) {
    return presenceCache.get('online_users').data;
  }
  
  // Fetch from Redis
  const activeUsers = await redis.smembers('active:users');
  const presenceData = await Promise.all(
    activeUsers.map(userId => redis.hgetall(`user:presence:${userId}`))
  );
  
  // Cache result
  presenceCache.set('online_users', { data: presenceData, ttl: Date.now() + 30000 });
  
  return presenceData;
}
```

### **Phase 3: Full Redis Integration**
- Remove local maps entirely
- All reads/writes go to Redis
- Implement Redis connection pooling
- Add Redis clustering support

---

## 🧹 **Cleanup & TTL Strategy**

### **Automatic Expiration**
```typescript
// Set TTL on all presence keys
const PRESENCE_TTL = 600; // 10 minutes

async function setDevicePresence(frameUID: string, data: DevicePresence) {
  await redis.hset(`device:presence:${frameUID}`, data);
  await redis.expire(`device:presence:${frameUID}`, PRESENCE_TTL);
}
```

### **Active Cleanup Process**
```typescript
// Background cleanup every 2 minutes
setInterval(async () => {
  // Find expired devices
  const allDevices = await redis.keys('device:presence:*');
  const expiredDevices = [];
  
  for (const key of allDevices) {
    const ttl = await redis.ttl(key);
    if (ttl <= 0) {
      expiredDevices.push(key.split(':')[2]); // Extract frameUID
    }
  }
  
  // Clean up expired devices
  for (const frameUID of expiredDevices) {
    await cleanupDevicePresence(frameUID);
  }
}, 120000);
```

---

## 🔧 **Redis Configuration Requirements**

### **Memory Settings**
```redis
# Redis configuration for presence storage
maxmemory 512mb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

### **Persistence Settings**
```redis
# Presence data doesn't need persistence (ephemeral)
save ""  # Disable RDB snapshots
appendonly no  # Disable AOF
```

### **Connection Pooling**
```typescript
// Use connection pooling for performance
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
  maxLoadTimeout: 5000
});
```

---

## 🎯 **API Changes Required**

### **Modified Functions**
```typescript
// Before: Synchronous local map access
function getOnlineUsers(): EnhancedUserPresence[] {
  return Array.from(userPresence.values());
}

// After: Async Redis access
async function getOnlineUsers(): Promise<EnhancedUserPresence[]> {
  const userIds = await redis.smembers('active:users');
  const userData = await redis.mget(userIds.map(id => `user:presence:${id}`));
  return userData.map(data => JSON.parse(data)).filter(Boolean);
}
```

### **Connection Handler Changes**
```typescript
// Before: Local map updates
devicePresence.set(frameUID, devicePresenceData);
const aggregatedUser = aggregateUserPresence(user.sub);
userPresence.set(user.sub, aggregatedUser);

// After: Redis updates
await setDevicePresence(frameUID, devicePresenceData);
const aggregatedUser = await aggregateUserPresence(user.sub);
await setUserPresence(user.sub, aggregatedUser);
```

---

## 🚨 **Risk Assessment**

### **High Risk**
- **Network latency**: 1000x slower than local access
- **Redis failure**: Single point of failure for presence
- **Memory usage**: Redis memory pressure
- **Race conditions**: Concurrent updates to same user

### **Medium Risk**  
- **Connection pooling**: Need to manage Redis connections properly
- **TTL edge cases**: Users disappearing due to TTL expiration
- **Migration complexity**: Dual-write pattern coordination

### **Low Risk**
- **Data consistency**: Redis atomic operations help
- **Scalability**: Redis can handle the load easily

---

## 🎁 **Benefits**

### **Immediate**
- ✅ **Fixed presence sync**: All instances see all users
- ✅ **Consistent state**: Single source of truth
- ✅ **Better scalability**: Stateless Node.js processes

### **Long-term**
- ✅ **Cross-instance coordination**: Enable more features
- ✅ **Persistence options**: Could persist presence across restarts
- ✅ **Analytics potential**: Presence data in queryable format
- ✅ **Horizontal scaling**: Add instances without state concerns

---

## 📋 **Implementation Roadmap**

### **Week 1: Foundation**
1. Redis connection setup and pooling
2. Basic Redis presence storage functions
3. TTL and cleanup mechanisms

### **Week 2: Dual-Write Migration**
1. Implement dual-write pattern
2. Update connection/disconnection handlers  
3. Test presence sync across instances

### **Week 3: Redis-First with Caching**
1. Switch to Redis-first reads
2. Implement local caching layer
3. Performance optimization

### **Week 4: Full Migration**
1. Remove local maps entirely
2. Stress testing and optimization
3. Production deployment

---

## 🧪 **Testing Strategy**

### **Unit Tests**
- Redis presence storage functions
- TTL and expiration handling
- Error handling and fallbacks

### **Integration Tests**  
- Multi-instance presence synchronization
- Network failure scenarios
- Redis restart/failover

### **Performance Tests**
- Latency impact measurements
- Memory usage comparison
- Load testing with multiple instances

---

## 💰 **Resource Requirements**

### **Redis Memory Estimation**
```
100 concurrent users × 2 devices avg × 1KB per device = 200KB
1000 concurrent users × 2 devices avg × 1KB per device = 2MB  
10000 concurrent users × 2 devices avg × 1KB per device = 20MB
```

### **Development Time**
- **Phase 1 (Dual-write)**: 3-4 days
- **Phase 2 (Redis-first)**: 2-3 days  
- **Phase 3 (Full migration)**: 1-2 days
- **Testing & optimization**: 2-3 days
- **Total**: ~10 days

---

## 📚 **References**

- [Redis Hash Commands](https://redis.io/commands/?group=hash)
- [Redis TTL and Expiration](https://redis.io/commands/expire)
- [Socket.IO Scaling Documentation](https://socket.io/docs/v4/scaling-up/)
- [Node.js Redis Best Practices](https://github.com/NodeRedis/node-redis) 