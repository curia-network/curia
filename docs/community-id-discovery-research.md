# Community ID Discovery Feature - Research & Implementation Plan

## 🎯 Problem Statement

Users on the `/get-started` page can generate embed code but it contains a placeholder `data-community="your-community-id"`. They need a streamlined way to:

1. **Find their existing community ID** (if they already have a community)
2. **Create a new community and get its ID** (if they need a new community)
3. **Get the complete, functional embed code** with their actual community ID

## 💡 Proposed Solution

Add a **"Find My Community ID"** button on the get-started page that opens a specialized modal with the embed in "discovery mode". This mode focuses purely on community ID acquisition rather than normal forum usage.

### User Flow
```
Get Started Page
    ↓ Click "Find My Community ID" 
Discovery Modal (Embed in Discovery Mode)
    ↓ User authenticates + selects/creates community
Community ID Acquired
    ↓ Copy ID to clipboard + show success dialog
User Returns to Get Started
    ↓ Updates embed code with real community ID
Complete Embed Code Ready
```

## 🏗️ Technical Architecture

### 1. New Query Parameter System

**New Parameter**: `discovery=true`
- Triggers discovery mode in embed
- Changes behavior to focus on community ID acquisition
- Disables normal forum navigation

**Enhanced Embed URL**:
```javascript
// Normal mode
/embed?community=test-community&theme=light

// Discovery mode  
/embed?discovery=true&theme=light&return_target=community_id
```

### 2. Discovery Mode Behavior Changes

**Normal Flow**:
```
Auth → Community Selection → Forum Application
```

**Discovery Flow**:
```
Auth → Community Selection → ID Acquisition → PostMessage Parent
```

**Key Differences in Discovery Mode**:
- No forum iframe loading after community selection
- Focus on community ID display and copy functionality
- Success state shows instructions for embed code usage
- PostMessage sends community ID to parent for clipboard copy

### 3. File Modifications Required

#### **A. Get Started Page** (`servers/host-service/src/app/get-started/page.tsx`)

**Addition**: New button above/below "Preview Your Forum":

```typescript
// Add to GetStartedPage component
const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);

// New button component
<Button 
  onClick={() => setIsDiscoveryModalOpen(true)}
  variant="outline"
  size="lg" 
  className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
>
  <Search className="w-5 h-5 mr-2" />
  Find My Community ID
</Button>

// New modal component
<CommunityDiscoveryModal 
  isOpen={isDiscoveryModalOpen}
  onClose={() => setIsDiscoveryModalOpen(false)}
  onCommunityIdFound={(communityId) => {
    // Update embed code with real community ID
    // Copy to clipboard
    // Show success notification
  }}
/>
```

#### **B. Community Discovery Modal** (`servers/host-service/src/components/configurator/CommunityDiscoveryModal.tsx`)

**New Component**: Specialized modal for community ID discovery

```typescript
interface CommunityDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityIdFound: (communityId: string) => void;
}

export function CommunityDiscoveryModal({ isOpen, onClose, onCommunityIdFound }: CommunityDiscoveryModalProps) {
  const [discoveredCommunityId, setDiscoveredCommunityId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // PostMessage listener for community ID from embed
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'curia-community-discovered') {
        const { communityId } = event.data;
        setDiscoveredCommunityId(communityId);
        
        // Copy to clipboard
        navigator.clipboard.writeText(communityId);
        
        // Show success dialog
        setShowSuccessDialog(true);
        
        // Notify parent
        onCommunityIdFound(communityId);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onCommunityIdFound]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        {/* Embed in discovery mode */}
        <iframe 
          src="/embed?discovery=true&return_target=community_id&theme=light"
          className="w-full h-full border-0 rounded-lg"
        />
        
        {/* Success Dialog Overlay */}
        {showSuccessDialog && (
          <SuccessDialog 
            communityId={discoveredCommunityId}
            onClose={() => setShowSuccessDialog(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

#### **C. Embed Page Discovery Mode** (`servers/host-service/src/app/embed/page.tsx`)

**Modifications**:

1. **Parse Discovery Parameters**:
```typescript
// In EmbedContent component
const config: EmbedConfig = {
  community: searchParams.get('community') || undefined,
  theme: (searchParams.get('theme') as 'light' | 'dark' | 'auto') || 'light',
  backgroundColor: searchParams.get('background_color') || undefined,
  // NEW: Discovery mode detection
  discoveryMode: searchParams.get('discovery') === 'true',
  returnTarget: searchParams.get('return_target') || undefined,
};
```

2. **Update Community Selection Handler**:
```typescript
const handleCommunitySelected = useCallback((communityId?: string) => {
  if (communityId) {
    setSelectedCommunityId(communityId);
    
    // NEW: Discovery mode behavior
    if (config.discoveryMode && config.returnTarget === 'community_id') {
      // Send community ID to parent instead of auth complete
      sendCommunityDiscoveredMessage(communityId);
      return;
    }
    
    // Normal behavior for regular embed
    sendAuthCompleteMessage(userId, communityId, sessionToken);
    setCurrentStep('auth-complete');
  }
}, [config.discoveryMode, config.returnTarget, /* other deps */]);
```

3. **New PostMessage Sender**:
```typescript
const sendCommunityDiscoveredMessage = useCallback((communityId: string) => {
  const message = {
    type: 'curia-community-discovered',
    communityId,
    timestamp: new Date().toISOString()
  };
  
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
}, []);
```

#### **D. Community Selection Step** (`servers/host-service/src/components/embed/CommunitySelectionStep.tsx`)

**Modifications**: 

1. **Discovery Mode UI Changes**:
```typescript
// Accept discovery mode prop
interface CommunitySelectionStepProps {
  onCommunitySelected: (communityId?: string) => void;
  config: EmbedConfig;
  sessionToken?: string;
  discoveryMode?: boolean; // NEW
}

// Update UI for discovery mode
{discoveryMode ? (
  <div className="text-center mb-6">
    <h2 className="text-xl font-semibold mb-2">Find Your Community ID</h2>
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Select an existing community or create a new one to get your community ID for embedding.
    </p>
  </div>
) : (
  // Normal community selection header
)}
```

2. **Enhanced Community Cards**:
```typescript
// In discovery mode, emphasize community ID display
{discoveryMode && (
  <div className="mt-2 p-2 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">
    ID: {community.id}
  </div>
)}
```

#### **E. Success Dialog Component** (`servers/host-service/src/components/configurator/SuccessDialog.tsx`)

**New Component**: Shows success state and instructions

```typescript
interface SuccessDialogProps {
  communityId: string;
  onClose: () => void;
}

export function SuccessDialog({ communityId, onClose }: SuccessDialogProps) {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Community ID Found!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✅ Community ID copied to clipboard
            </p>
            <code className="block mt-1 font-mono text-xs text-green-700 dark:text-green-300">
              {communityId}
            </code>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps:</h4>
            <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
              <li>1. Replace <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">your-community-id</code> in your embed code</li>
              <li>2. Paste your community ID: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{communityId}</code></li>
              <li>3. Deploy your embed code to your website</li>
            </ol>
          </div>
          
          <Button onClick={onClose} className="w-full">
            Continue to Embed Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. Enhanced Code Generator Integration

**Update CodeGenerator** to use discovered community ID:

```typescript
// In CodeGenerator component
interface CodeGeneratorProps {
  config: EmbedConfig;
  previewButton: React.ReactNode;
  communityId?: string; // NEW: Allow override of community ID
}

// Update embed code generation
const generateEmbedCode = () => {
  const actualCommunityId = communityId || 'your-community-id';
  
  const attributes = [
    `src="${hostUrl}/embed.js"`,
    `data-width="${config.width}"`,
    `data-height="${config.height}"`,
    `data-theme="${config.theme}"`,
    `data-container="curia-forum"`,
    `data-community="${actualCommunityId}"` // Use actual ID when available
  ];
  
  // ... rest of generation logic
};
```

## 🎨 User Experience Flow

### 1. Initial State (Get Started Page)
```
┌─────────────────────────────────────┐
│ Configure Your Web3 Forum          │
├─────────────────────────────────────┤
│ [Configurator Panel]                │
│                                     │
│ [Generated Embed Code]              │
│ data-community="your-community-id"  │ ← Placeholder
│                                     │
│ [🔍 Find My Community ID]          │ ← NEW BUTTON
│ [👁️ Preview Your Forum]            │
└─────────────────────────────────────┘
```

### 2. Discovery Modal Opens
```
┌─────────────────────────────────────┐
│ Find Your Community ID              │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Embed in Discovery Mode]       │ │
│ │                                 │ │
│ │ Authentication → Community      │ │
│ │ Selection → ID Display          │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 3. Success State
```
┌─────────────────────────────────────┐
│ ✅ Community ID Found!              │
├─────────────────────────────────────┤
│ ✅ Copied to clipboard              │
│ abc123-def456-ghi789                │
│                                     │
│ Next Steps:                         │
│ 1. Replace "your-community-id"      │
│ 2. Paste: abc123-def456-ghi789      │
│ 3. Deploy to your website           │
│                                     │
│ [Continue to Embed Code]            │
└─────────────────────────────────────┘
```

### 4. Updated Get Started Page
```
┌─────────────────────────────────────┐
│ Configure Your Web3 Forum          │
├─────────────────────────────────────┤
│ [Configurator Panel]                │
│                                     │
│ [Generated Embed Code]              │
│ data-community="abc123-def456-ghi789"│ ← Real ID!
│                                     │
│ [🔍 Find My Community ID] ✅        │
│ [👁️ Preview Your Forum]            │
└─────────────────────────────────────┘
```

## 🧪 Testing Strategy

### Unit Tests
- CommunityDiscoveryModal PostMessage handling
- SuccessDialog display logic  
- Discovery mode parameter parsing
- Community ID validation

### Integration Tests
- Full discovery flow (auth → community → clipboard)
- PostMessage communication between modal and embed
- Embed code generation with discovered ID
- Error handling for failed discovery

### User Acceptance Tests
- **Existing Community User**: Can find and use their community ID
- **New User**: Can create community and get ID
- **Anonymous User**: Proper guidance to authentication
- **Error Cases**: Network failures, invalid communities, etc.

## 📝 Implementation Phases

### Phase 1: Core Infrastructure
1. Add discovery mode parameter parsing to embed
2. Create CommunityDiscoveryModal component skeleton
3. Update community selection step for discovery mode
4. Implement PostMessage communication

### Phase 2: UI & UX
1. Add "Find My Community ID" button to get-started page
2. Create SuccessDialog component
3. Update community cards for discovery mode
4. Add loading states and error handling

### Phase 3: Integration & Polish
1. Integrate discovered ID with CodeGenerator
2. Add clipboard functionality and notifications  
3. Comprehensive testing across browsers
4. Error recovery and edge case handling

### Phase 4: Documentation & Deployment
1. Update user documentation
2. Create help tooltips and guidance text
3. Analytics tracking for discovery usage
4. Performance optimization

## 🔧 Technical Considerations

### Security
- Validate community IDs before embedding
- Sanitize PostMessage data
- Rate limiting for community creation
- CSRF protection for authenticated actions

### Performance  
- Lazy load discovery modal
- Optimize embed iframe loading
- Cache community data appropriately
- Minimize PostMessage overhead

### Browser Compatibility
- Test clipboard API across browsers
- Fallback for older browsers without clipboard API
- PostMessage compatibility with iframes
- Modal rendering in different viewports

### Accessibility
- Keyboard navigation in discovery modal
- Screen reader support for success states
- Focus management during modal transitions
- Color contrast for discovery UI elements

## 🚀 Success Metrics

### Primary KPIs
- **Discovery Completion Rate**: % of users who successfully get community ID
- **Embed Code Usage**: % of generated codes with real vs placeholder IDs  
- **User Time to Deployment**: Average time from discovery to successful embed

### Secondary Metrics
- Community creation rate through discovery flow
- User retention after successful discovery
- Support ticket reduction for "how to get community ID"
- Conversion from discovery to active community usage

## 🎯 Next Steps & Proposal

Based on this research, I recommend proceeding with **Phase 1: Core Infrastructure** first:

1. **Start with Backend**: Add discovery mode parameter parsing and PostMessage handling
2. **Basic Modal**: Create minimal CommunityDiscoveryModal with iframe embed
3. **Community Selection Updates**: Modify existing component for discovery behavior
4. **Simple Integration**: Add basic button to get-started page

This approach allows for incremental development and testing while building on the existing, proven embed architecture. The solution leverages current patterns (PostMessage, query parameters, clipboard API) and integrates seamlessly with the existing user experience.

**Estimated Development Time**: 2-3 weeks for full implementation across all phases.

**Risk Assessment**: Low - builds on existing infrastructure with minimal architectural changes. 