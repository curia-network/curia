# Partner Community Navigation Migration Roadmap

## 🎯 **Objective**
Replace the deprecated `cg.navigate()` method in `PartnerCommunitiesWidget.tsx` with the new `switchCommunity()` function to enable seamless community switching via partner community logos. **Design for reusability** across multiple community navigation scenarios.

## 📊 **Current State Analysis**

### **Current Implementation Flow:**
```typescript
// 1. User clicks partner community logo
handleCommunityClick(communityId) →
// 2. Find partner with communityShortId & pluginId  
partner = partnersWithLogos.find(p => p.id === communityId)
// 3. Call deprecated navigation method
navigateToPost(partner.communityShortId, partner.pluginId, -1, -1) →
// 4. useCrossCommunityNavigation sets cookies + calls cgInstance.navigate()
cgInstance.navigate(`${baseUrl}/c/${communityShortId}/plugin/${pluginId}`)
```

### **Issues with Current Implementation:**
- ❌ Uses deprecated `cgInstance.navigate()` method  
- ❌ Requires `communityShortId` + `pluginId` mapping
- ❌ Manual cookie management for navigation state
- ❌ Limited error handling and user feedback
- ❌ No loading states or context preservation
- ❌ **Not reusable** for future community switching features

## 🚀 **Target State**

### **New Implementation Flow:**
```typescript
// 1. User clicks partner community logo
handleCommunityClick(communityId) →
// 2. Show loading state with community branding
setLoadingState(communityId) →
// 3. Call new community switcher
cglib.switchCommunity(communityId) →
// 4. Handle success/error with user feedback
updateUIAndShowFeedback(result)
```

### **Key Improvements:**
- ✅ Uses modern `switchCommunity()` API
- ✅ Direct database ID usage (no mapping needed)
- ✅ **Simplified flow** - no pre-validation complexity
- ✅ **Reusable design** for any community switching scenario
- ✅ Enhanced UX with loading states and community branding
- ✅ **Let users discover access rules naturally** at destination

---

## 📋 **Step-by-Step Migration Roadmap**

### **Phase 1: Foundation & Setup** ⚙️

#### **Step 1.1: Verify CG Library Integration**
- [ ] **Task**: Confirm `cglib.switchCommunity()` is available in `CgLibContext`
- [ ] **Files**: `src/contexts/CgLibContext.tsx`
- [ ] **Validation**: Test basic function call with simple community ID
- [ ] **Estimated Time**: 30 minutes

#### **Step 1.2: Analyze Current Data Flow**
- [ ] **Task**: Document current data structures used in `PartnerCommunitiesWidget`
- [ ] **Focus Areas**:
  - Partnership API response format
  - Community metadata fetching
  - Required fields for navigation
- [ ] **Output**: Data mapping documentation
- [ ] **Estimated Time**: 45 minutes

### **Phase 2: Create Reusable Navigation Components** 🎯

#### **Step 2.1: Create Generic Community Loading States**
- [ ] **Task**: Design **reusable** community-branded loading UI component
- [ ] **Location**: `src/components/ui/CommunityNavigationLoader.tsx`
- [ ] **Features**:
  - Target community logo (when available)
  - Community name
  - Animated loading indicator
  - "Switching to..." message
  - **Reusable for any community switching scenario**
- [ ] **Estimated Time**: 1 hour

#### **Step 2.2: Implement Simplified Error Handling**
- [ ] **Task**: Create generic community switching error handling
- [ ] **Error Types**:
  - Community not found/not accessible
  - Network/system errors
  - Generic switchCommunity() failures
- [ ] **UI**: Simple error toast with retry option
- [ ] **Estimated Time**: 45 minutes

### **Phase 3: Core Implementation** 🔧

#### **Step 3.1: Create Generic Navigation Hook**
- [ ] **Task**: Create new **reusable** `useCommunityNavigation()` hook
- [ ] **Location**: `src/hooks/useCommunityNavigation.ts`
- [ ] **Features**:
  ```typescript
  const useCommunityNavigation = () => {
    const navigateToCommunity = async (communityId: string, options?: {
      communityName?: string;
      logoUrl?: string;
    }) => {
      // Loading state management  
      // switchCommunity() call
      // Error handling
      // Success feedback
    };
    return { navigateToCommunity, navigatingTo };
  };
  ```
- [ ] **Reusable**: Works for partners, search results, mentions, etc.
- [ ] **Estimated Time**: 1.5 hours

#### **Step 3.2: Update PartnerCommunitiesWidget**
- [ ] **Task**: Replace current `handleCommunityClick` implementation
- [ ] **Location**: `src/components/partnerships/PartnerCommunitiesWidget.tsx`
- [ ] **Changes**:
  - Remove `useCrossCommunityNavigation` import
  - Add `useCommunityNavigation` import  
  - Replace click handler logic (much simpler!)
  - Update loading state UI
  - Use `target_community_id` directly (no mapping needed)
- [ ] **Estimated Time**: 1 hour

#### **Step 3.3: Update Data Fetching**
- [ ] **Task**: Simplify community data fetching (remove plugin/shortId lookup)
- [ ] **Optimization**: Since we only need `target_community_id`, remove complex mapping
- [ ] **Keep**: Logo URLs for loading states and branding
- [ ] **Estimated Time**: 45 minutes

### **Phase 4: User Experience Enhancements** ✨

#### **Step 4.1: Add Context Preservation**
- [ ] **Task**: Implement breadcrumb/return navigation system
- [ ] **Features**:
  - Track previous community for "return" option
  - Update browser history appropriately
  - Preserve user's current view context
- [ ] **UI**: Optional breadcrumb showing navigation path
- [ ] **Estimated Time**: 1.5 hours

#### **Step 4.2: Add Analytics & Tracking**
- [ ] **Task**: Track partner community navigation events
- [ ] **Metrics**:
  - Partner click events
  - Successful navigation count
  - Permission failures
  - Error types and frequency
- [ ] **Implementation**: Add tracking calls to navigation hook
- [ ] **Estimated Time**: 45 minutes

#### **Step 4.3: Implement Loading State Improvements**
- [ ] **Task**: Add partner community preview on hover
- [ ] **Features**:
  - Tooltip showing partner community name
  - Connection status indicator
  - Recent activity hint (optional)
- [ ] **Estimated Time**: 1 hour

### **Phase 5: Testing & Validation** 🧪

#### **Step 5.1: Unit Testing**
- [ ] **Task**: Create comprehensive tests for navigation logic
- [ ] **Test Cases**:
  - Permission validation logic
  - Error handling scenarios
  - Loading state management
  - Success flow end-to-end
- [ ] **Location**: `src/hooks/__tests__/usePartnerCommunityNavigation.test.ts`
- [ ] **Estimated Time**: 2 hours

#### **Step 5.2: Integration Testing**
- [ ] **Task**: Test with real partnership data in development
- [ ] **Scenarios**:
  - Valid partnership with navigation permissions
  - Partnership without navigation permissions
  - Inactive partnership
  - Non-existent community
  - Network failure scenarios
- [ ] **Estimated Time**: 1.5 hours

#### **Step 5.3: User Acceptance Testing**
- [ ] **Task**: Test complete user flows in staging environment
- [ ] **Focus Areas**:
  - Click responsiveness and loading feedback
  - Error message clarity and usefulness
  - Return navigation functionality
  - Cross-browser compatibility
- [ ] **Estimated Time**: 1 hour

### **Phase 6: Cleanup & Documentation** 📝

#### **Step 6.1: Remove Deprecated Code**
- [ ] **Task**: Clean up old navigation implementation
- [ ] **Files to Update**:
  - Remove `useCrossCommunityNavigation` if no longer used elsewhere
  - Clean up unused community metadata fetching
  - Remove plugin/shortId mapping logic
- [ ] **Estimated Time**: 30 minutes

#### **Step 6.2: Update Documentation**
- [ ] **Task**: Document new navigation system
- [ ] **Files**:
  - Update component documentation
  - Add hook usage examples
  - Update partnership integration guide
- [ ] **Estimated Time**: 45 minutes

#### **Step 6.3: Performance Validation**
- [ ] **Task**: Verify performance improvements
- [ ] **Metrics**:
  - Reduced data fetching (no shortId/pluginId lookup needed)
  - Faster navigation response times
  - Reduced bundle size (if old code removed)
- [ ] **Estimated Time**: 30 minutes

---

## 🔧 **Implementation Details**

### **Key Code Changes Preview**

#### **New Generic Hook Structure:**
```typescript
// src/hooks/useCommunityNavigation.ts
export const useCommunityNavigation = () => {
  const { cgInstance } = useCgLib();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  
  const navigateToCommunity = async (communityId: string, options?: {
    communityName?: string;
    logoUrl?: string;
  }) => {
    // Loading state
    setNavigatingTo(communityId);
    
    try {
      const result = await cgInstance.switchCommunity(communityId);
      showSuccess(`Switched to ${result.data.communityInfo.name}`);
    } catch (error) {
      handleNavigationError(error, communityId);
    } finally {
      setNavigatingTo(null);
    }
  };
  
  return { navigateToCommunity, navigatingTo };
};
```

#### **Updated Widget Handler (Much Simpler!):**
```typescript
// src/components/partnerships/PartnerCommunitiesWidget.tsx
const { navigateToCommunity, navigatingTo } = useCommunityNavigation();

const handlePartnerClick = (partner: PartnerCommunity) => {
  navigateToCommunity(partner.target_community_id, {
    communityName: partner.target_community_name,
    logoUrl: partner.logoUrl
  });
};

// In render:
disabled={navigatingTo === partner.target_community_id}
```

### **Data Flow Simplification**

#### **Before (Complex):**
```
Partnership API → Community API (for shortId/pluginId) → Navigation
```

#### **After (Simple):**
```
Partnership API → Direct Navigation (using target_community_id)
```

---

## ⏱️ **Timeline & Effort Estimation**

| Phase | Tasks | Estimated Time | Dependencies |
|-------|-------|----------------|--------------|
| **Phase 1** | Foundation & Setup | 1.25 hours | CG Library ready |
| **Phase 2** | Reusable Navigation Components | 1.75 hours | Phase 1 complete |
| **Phase 3** | Core Implementation | 3.25 hours | Phase 2 complete |
| **Phase 4** | UX Enhancements | 3.25 hours | Phase 3 complete |
| **Phase 5** | Testing & Validation | 4.5 hours | Phase 4 complete |
| **Phase 6** | Cleanup & Documentation | 1.75 hours | Phase 5 complete |
| **Total** | **All Phases** | **~15.75 hours** | **~2 dev days** |

---

## 🚨 **Risk Assessment & Mitigation**

### **High Risk:**
- **switchCommunity() API changes**: Test thoroughly in development first
- **Partnership permission edge cases**: Create comprehensive test scenarios

### **Medium Risk:**  
- **User experience disruption**: Implement feature flags for gradual rollout
- **Performance regression**: Monitor navigation response times

### **Low Risk:**
- **Data structure changes**: Partnership API is stable
- **Browser compatibility**: switchCommunity() uses standard web APIs

---

## ✅ **Success Criteria**

### **Functional Requirements:**
- [ ] Partner community logos trigger seamless navigation
- [ ] Permission validation prevents unauthorized access
- [ ] Clear error messages for failed navigation attempts
- [ ] Loading states provide immediate user feedback

### **Technical Requirements:**
- [ ] Complete removal of deprecated `cg.navigate()` usage
- [ ] Reduced complexity in data fetching pipeline  
- [ ] Proper error handling for all failure scenarios
- [ ] Comprehensive test coverage (>90%)

### **User Experience Requirements:**
- [ ] Navigation feels instant and responsive
- [ ] Error messages are actionable and clear
- [ ] Users can easily return to previous community
- [ ] Partner community branding visible during loading

---

## 📚 **Additional Resources**

- **CG Library Documentation**: `switchCommunity()` API reference
- **Partnership System Guide**: Understanding permission structure
- **Testing Strategy**: Component and integration testing approaches
- **Performance Monitoring**: Metrics to track post-migration

---

**Ready to implement! 🚀** 

This roadmap provides a clear path from the current deprecated implementation to a modern, robust partner community navigation system using the new `switchCommunity()` function. 