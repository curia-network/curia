# Embed Configurator Authentication & Community Selection Research

**Date**: January 2025  
**Status**: 🎯 **Architecture Finalized - Implementation Ready**  
**Goal**: Enable authenticated community selection/creation in the embed configurator

---

## 🎯 **Problem Statement**

The current embed configurator (`/get-started`) generates embed code with a placeholder:
```html
data-community="your-community-id"
```

**Missing Functionality:**
1. **Authenticated Community List**: Users need to see their existing communities (private data)
2. **Community Creation**: Users should be able to create new communities
3. **Real Community IDs**: Generate embed code with actual database community IDs

**Key Constraint**: Authentication is required, but we want to build this UI in the configurator app (host service) rather than inside the embed iframe.

---

## 🏗️ **Final Solution Architecture**

### **Hybrid Approach: Auth Modal + Native Components**

**Core Concept**: 
- **Authentication**: Use auth-only embed modal (iframe) for getting session token
- **Community Management**: Use native React components (no iframe) for actual selection/creation

### **User Flow**

```
User visits /get-started
    ↓
Community Selector Widget loads
    ↓ 
Check localStorage for curia_session_token
    ↓
IF NOT AUTHENTICATED:
    ├── Show "Sign in to manage communities"
    ├── "Create Community" → Opens auth modal (embed with mode=auth-only)
    ├── After auth complete: Close modal, refresh widget state
    └── Now user can proceed with community management
    ↓
IF AUTHENTICATED:
    ├── Show "Select Existing Community" → Opens selection modal (native component)
    └── Show "Create New Community" → Opens creation modal (native component)
    ↓
User picks/creates community → Widget outputs community ID
    ↓
Embed code generator uses REAL community ID
```

### **Component Architecture - Monolithic Approach**

**Recommendation**: Single self-contained `CommunitySelector` component

```typescript
interface CommunitySelectorProps {
  onCommunitySelected: (communityId: string) => void;
  value?: string; // Currently selected community ID
}

const CommunitySelector: React.FC<CommunitySelectorProps> = ({
  onCommunitySelected,
  value
}) => {
  // Internal state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);

  // Render different UI based on state
  if (!isAuthenticated) return <AuthPromptUI />;
  if (!value) return <CommunityOptionsUI />;
  return <SelectedCommunityUI />;
};
```

**Benefits**:
- Simple integration (single component)
- Internal state management
- Clear interface with single callback
- Self-contained logic

---

## 🔍 **Technical Foundation**

### **1. PostMessage Communication**

**Auth-Only Mode Flow**:
```typescript
// IFRAME (embed) sends to PARENT (configurator)
window.parent.postMessage({
  type: 'curia-auth-complete',
  mode: 'auth-only',
  userId: 'user123',
  communityId: 'community456',
  sessionToken: 'abc123...',
  timestamp: '2025-01-12T...'
}, '*');

// PARENT (configurator) listens and handles
window.addEventListener('message', (event) => {
  if (event.data.type === 'curia-auth-complete' && event.data.mode === 'auth-only') {
    closeAuthModal();
    setSessionToken(event.data.sessionToken);
    refreshAuthState(); // Invalidate React Query cache
  }
});
```

### **2. Database Schema** ✅

**Communities Table Structure**:
```sql
CREATE TABLE "public"."communities" (
    "id" text NOT NULL,                    -- UUID (primary key)
    "name" text NOT NULL,                  -- Display name
    "community_short_id" text,             -- User-chosen handle (like Twitter username)
    "owner_user_id" text,                  -- User who created/owns community
    "plugin_id" text,                      -- Use community_short_id for now
    "settings" jsonb DEFAULT '{}' NOT NULL,-- Community settings
    "requires_approval" boolean DEFAULT false NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "logo_url" text,                       -- Community logo
    "community_url" text,                  -- Future use
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### **3. Community Creation Form**

**User-Facing Fields**:
```typescript
interface CommunityCreationForm {
  name: string;                 // Display name (required) - "My DAO Community"
  community_short_id: string;  // Unique handle (required) - "my-dao"
  requires_approval: boolean;   // Default false
  is_public: boolean;          // Default true
}

// Auto-set fields:
// - id: crypto.randomUUID()
// - owner_user_id: current user
// - plugin_id: same as community_short_id
// - settings: {}
```

### **4. Community ID System**

- **Primary ID**: UUID (`550e8400-e29b-41d4-a716-446655440000`)
- **Short ID**: User-chosen unique handle (`my-dao`, `ethereum-builders`)
- **Display**: "My DAO Community" (@my-dao)

---

## 🚧 **Step-by-Step Implementation Roadmap**

### **PHASE 1: Auth-Only Embed Mode** *(Day 1-2)*

#### **Step 1.1: Add Mode Parameter Support**
- [ ] Update `EmbedConfig` interface to include `mode?: 'full' | 'auth-only'`
- [ ] Modify embed route parsing: `const mode = searchParams.get('mode') || 'full'`
- [ ] Update embed entry point to pass mode to InternalPluginHost

**Files to modify**:
- `src/lib/embed/types/EmbedTypes.ts`
- `src/app/embed/page.tsx`
- `src/lib/embed/embed-entry.ts`

#### **Step 1.2: Modify Community Selection Behavior**
- [ ] Update `CommunitySelectionStep.tsx` to check for auth-only mode
- [ ] Exit early after community selection in auth-only mode
- [ ] Skip forum transition, stay on auth-complete step

**Implementation**:
```typescript
// In CommunitySelectionStep.tsx
const handleCommunitySelected = (communityId: string) => {
  if (mode === 'auth-only') {
    sendAuthCompleteMessage(userId, communityId, sessionToken);
    setCurrentStep('auth-complete');
    return; // Don't transition to forum
  }
  // Normal flow continues...
};
```

#### **Step 1.3: Enhanced Message Protocol**
- [ ] Update auth-complete message to include mode and sessionToken
- [ ] Ensure sessionToken is properly passed from community selection
- [ ] Test PostMessage communication end-to-end

**Message Format**:
```typescript
{
  type: 'curia-auth-complete',
  mode: 'auth-only',
  userId: string,
  communityId: string,
  sessionToken: string,
  timestamp: string
}
```

#### **Step 1.4: Testing & Validation**
- [ ] Create test page to verify auth-only mode works
- [ ] Test PostMessage communication
- [ ] Verify session token is correctly passed
- [ ] Ensure iframe doesn't transition to forum

### **PHASE 2: Community Selector Widget** *(Day 3-5)*

#### **Step 2.1: Create Base Widget Component**
- [ ] Create `CommunitySelector` component with prop interface
- [ ] Implement authentication state detection
- [ ] Add basic UI states (unauthenticated, authenticated, selected)
- [ ] Handle localStorage session token checking

**Location**: `src/components/configurator/CommunitySelector.tsx`

#### **Step 2.2: Auth Modal Integration**
- [ ] Create `AuthModal` component wrapper
- [ ] Implement iframe with auth-only mode
- [ ] Set up PostMessage listener
- [ ] Handle auth completion and cleanup

**Component Structure**:
```typescript
const AuthModal = ({ isOpen, onAuthComplete, onClose }) => {
  // Create iframe with mode=auth-only
  // Listen for auth-complete message
  // Call onAuthComplete with session token
  // Handle cleanup and modal close
};
```

#### **Step 2.3: Integration with EmbedConfigurator**
- [ ] Add CommunitySelector to EmbedConfigurator component
- [ ] Update CodeGenerator to use real community ID
- [ ] Handle community selection state
- [ ] Update embed code generation

**Integration**:
```typescript
const EmbedConfigurator = () => {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();
  
  return (
    <>
      <CommunitySelector 
        onCommunitySelected={setSelectedCommunityId}
        value={selectedCommunityId}
      />
      <CodeGenerator 
        config={config}
        communityId={selectedCommunityId}
      />
    </>
  );
};
```

#### **Step 2.4: React Query Integration**
- [ ] Set up query keys for auth state and communities
- [ ] Implement cache invalidation after auth
- [ ] Add loading and error states
- [ ] Handle authentication refresh

### **PHASE 3: Native Community Management** *(Day 6-9)*

#### **Step 3.1: Extract Community Selection Logic**
- [ ] Analyze existing `CommunitySelectionStep.tsx` (506 lines)
- [ ] Extract reusable utilities for community fetching
- [ ] Create shared community API functions
- [ ] Remove iframe-specific dependencies

**Extraction Strategy**:
- Community fetching logic → `src/hooks/useCommunities.ts`
- Search/filter logic → `src/utils/communityUtils.ts`
- UI components → `src/components/community/`

#### **Step 3.2: Community Selection Modal**
- [ ] Create `CommunitySelectionModal` component
- [ ] Implement community list with search/filter
- [ ] Add responsive design using shadcn/ui
- [ ] Handle community selection and modal close

**Features**:
- Search communities by name
- Filter by membership status
- Visual community cards
- Pagination for large lists

#### **Step 3.3: Community Creation Modal**
- [ ] Create `CommunityCreationModal` component
- [ ] Build form with validation (name, short_id, settings)
- [ ] Handle form submission and API calls
- [ ] Add success/error states

**Form Fields**:
- Community Name (required)
- Handle/Short ID (required, unique validation)
- Requires Approval (checkbox)
- Public/Private (radio buttons)

#### **Step 3.4: Community Creation API**
- [ ] Create `POST /api/communities` endpoint
- [ ] Implement authentication validation
- [ ] Add community creation logic with UUID generation
- [ ] Create default board (like main forum)
- [ ] Handle unique constraint validation

**API Implementation**:
```typescript
export async function POST(request: NextRequest) {
  const { name, community_short_id, requires_approval, is_public } = await request.json();
  const userId = await validateSession(request);
  const communityId = crypto.randomUUID();
  
  // Create community + default board
  // Return community data
}
```

### **PHASE 4: Polish & Integration** *(Day 10-12)*

#### **Step 4.1: Update Code Generator**
- [ ] Modify `CodeGenerator` to accept communityId prop
- [ ] Update embed code template to use real community ID
- [ ] Handle placeholder fallback when no community selected
- [ ] Add visual indicators for community selection status

#### **Step 4.2: Error Handling & UX Polish**
- [ ] Add loading states for all async operations
- [ ] Implement error boundaries and error messaging
- [ ] Add success notifications for community creation
- [ ] Ensure responsive design across all modals
- [ ] Add proper focus management for accessibility

#### **Step 4.3: Validation & Edge Cases**
- [ ] Test unique community short_id validation
- [ ] Handle network errors gracefully
- [ ] Add form validation with proper error messages
- [ ] Test session expiration scenarios
- [ ] Verify cross-browser compatibility

#### **Step 4.4: End-to-End Testing**
- [ ] Test complete auth flow (unauthenticated → authenticated)
- [ ] Test community selection flow
- [ ] Test community creation flow
- [ ] Verify generated embed codes work in actual websites
- [ ] Test with different community configurations

---

## 🎯 **Key Deliverables**

### **New Components**
1. **`CommunitySelector`** - Main widget for configurator page (monolithic)
2. **`AuthModal`** - Wrapper for auth-only embed iframe  
3. **`CommunitySelectionModal`** - Native community selection UI
4. **`CommunityCreationModal`** - Native community creation form

### **Enhanced Components**
1. **`EmbedConfigurator`** - Integrate community selector
2. **`CodeGenerator`** - Use real community ID
3. **`CommunitySelectionStep`** - Add auth-only mode support

### **New APIs**
1. **`POST /api/communities`** - Create new community endpoint

### **New Utilities**
1. **`useCommunities`** - React hook for community data
2. **`communityUtils`** - Shared community logic
3. **Query keys** - React Query cache management

---

## 🔍 **File Structure**

```
servers/host-service/src/
├── components/
│   ├── configurator/
│   │   ├── CommunitySelector.tsx          # NEW - Main widget
│   │   ├── EmbedConfigurator.tsx          # MODIFIED
│   │   └── CodeGenerator.tsx              # MODIFIED
│   ├── community/                         # NEW DIRECTORY
│   │   ├── CommunitySelectionModal.tsx    # NEW
│   │   ├── CommunityCreationModal.tsx     # NEW
│   │   └── AuthModal.tsx                  # NEW
│   └── embed/
│       └── CommunitySelectionStep.tsx     # MODIFIED
├── app/api/
│   └── communities/
│       └── route.ts                       # MODIFIED (add POST)
├── hooks/
│   └── useCommunities.ts                  # NEW
├── utils/
│   └── communityUtils.ts                  # NEW
└── lib/embed/
    ├── types/EmbedTypes.ts                # MODIFIED
    └── embed-entry.ts                     # MODIFIED
```

---

## ⚡ **Implementation Notes**

### **Development Strategy**
1. **Incremental Development**: Each phase builds on the previous
2. **Testing First**: Test auth-only mode before building community UI
3. **Component Isolation**: Build modals independently and integrate
4. **API Last**: Create API after UI is designed and validated

### **Key Technical Decisions**
- **Monolithic Component**: Single `CommunitySelector` for simplicity
- **PostMessage Communication**: Reuse existing embed messaging system
- **shadcn/ui Modals**: Follow existing host service design patterns
- **React Query**: For state management and cache invalidation
- **UUID + Short ID**: Dual identifier system for communities

### **Success Criteria**
- [ ] Users can authenticate via auth-only embed modal
- [ ] Users can select existing communities
- [ ] Users can create new communities with unique handles
- [ ] Generated embed codes use real community IDs
- [ ] All flows work without page refreshes
- [ ] Error handling is robust and user-friendly

---

## 🚀 **Ready for Implementation**

**Starting Point**: Phase 1, Step 1.1 - Add mode parameter support to embed system

**Estimated Timeline**: 
- Phase 1: 2 days
- Phase 2: 3 days  
- Phase 3: 4 days
- Phase 4: 3 days
- **Total**: ~2 weeks

The architecture is finalized, all technical decisions are made, and the roadmap is comprehensive. Ready to begin Phase 1 implementation! 🎯 