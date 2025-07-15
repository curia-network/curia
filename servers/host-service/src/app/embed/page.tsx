/**
 * Embed Page - Progressive Authentication Experience
 * 
 * This is what loads inside the iframe on customer sites.
 * Progressive stages: Session Check → Authentication → Community → Auth Complete Message
 * After completion, sends curia-auth-complete message to parent for iframe switching.
 * 
 * Updated to use proven AuthenticationFlow component which handles:
 * - Wallet connection
 * - Profile preview ("moment of delight")
 * - Signature verification
 * - Session creation
 */

'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { QueryClientProvider } from '@/components/providers/QueryClientProvider';
import { EmbedThemeProvider } from '@/contexts/EmbedThemeProvider';
import { Toaster } from 'sonner';
import { 
  LoadingStep,
  SessionCheckStep,
  AuthenticationStep,
  ProfilePreviewStep,
  SignatureVerificationStep,
  CommunitySelectionStep,
  AuthCompleteStep
} from '@/components/embed';
import { EmbedTopBar } from '@/components/embed/EmbedTopBar';
import { EmbedConfig, EmbedStep, ProfileData } from '@/types/embed';

const EmbedContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<EmbedStep>('loading');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [useModernFlow, setUseModernFlow] = useState(true); // Use proven AuthenticationFlow by default

  // Parse embed configuration from URL parameters
  const config: EmbedConfig = {
    community: searchParams.get('community') || undefined,
    theme: (searchParams.get('theme') as 'light' | 'dark' | 'auto') || 'light',
    backgroundColor: searchParams.get('background_color') || undefined,
    mode: (searchParams.get('mode') as 'full' | 'auth-only' | 'secure-auth') || 'full',
  };

  // Check for legacy flow parameter (for backwards compatibility)
  React.useEffect(() => {
    const legacy = searchParams.get('legacy');
    if (legacy === 'true') {
      setUseModernFlow(false);
    }
  }, [searchParams]);

  // Send auth completion message to parent
  const sendAuthCompleteMessage = useCallback((userId: string, communityId: string, sessionToken?: string, identityType?: string) => {
    const message = {
      type: 'curia-auth-complete',
      mode: config.mode || 'full',
      userId,
      communityId,
      sessionToken,
      identityType,
      timestamp: new Date().toISOString()
    };
    
    console.log('[Embed] DEBUG - sendAuthCompleteMessage called with:', { userId, communityId, sessionToken });
    console.log('[Embed] DEBUG - Message to send:', message);
    console.log('[Embed] DEBUG - window.parent:', window.parent);
    console.log('[Embed] DEBUG - window.parent !== window:', window.parent !== window);
    
    // Send to parent window
    if (window.parent && window.parent !== window) {
      console.log('[Embed] DEBUG - Sending PostMessage to parent...');
      window.parent.postMessage(message, '*');
      console.log('[Embed] DEBUG - PostMessage sent successfully');
    } else {
      console.log('[Embed] DEBUG - WARNING: No parent window or same window, cannot send message');
    }
  }, [config.mode]);

  // Step transition handlers
  const handleLoadingComplete = useCallback(() => {
    setCurrentStep('session-check');
  }, []);

  const handleSessionResult = useCallback((hasSession: boolean, userData?: any) => {
    if (hasSession && userData) {
      console.log('[Embed] Session valid with user data:', userData);
      
      // Create ProfileData from session user data
      const sessionProfileData: ProfileData = {
        type: userData.identity_type === 'ens' ? 'ens' : 
              userData.identity_type === 'universal_profile' ? 'universal_profile' : 'anonymous',
        address: userData.wallet_address || userData.up_address,
        name: userData.name,
        domain: userData.ens_domain,
        avatar: userData.profile_picture_url,
        verificationLevel: userData.identity_type === 'anonymous' ? 'unverified' : 'verified',
        sessionToken: localStorage.getItem('curia_session_token') || undefined,
        // Store the actual database user_id for later use
        userId: userData.user_id
      };
      
      // Set profile data from existing session
      setProfileData(sessionProfileData);
      console.log('[Embed] Profile data populated from session:', sessionProfileData);
      
      // Check for auth-only mode - skip community selection entirely
      if (config.mode === 'auth-only') {
        console.log(`[Embed] ${config.mode} mode: sending auth-complete for existing session`);
        const userId = sessionProfileData.userId || sessionProfileData.address || `fallback_${Date.now()}`;
        sendAuthCompleteMessage(userId, 'auth-only-no-community', sessionProfileData.sessionToken, sessionProfileData.type);
        setCurrentStep('auth-complete');
        return;
      }

      // Check for secure-auth mode - handle based on identity type
      if (config.mode === 'secure-auth') {
        // For ENS/UP: existing session should be valid, complete immediately
        // Note: Anonymous sessions are filtered out in SessionCheckStep
        console.log(`[Embed] ${config.mode} mode: sending auth-complete for existing ${sessionProfileData.type} session`);
        const userId = sessionProfileData.userId || sessionProfileData.address || `fallback_${Date.now()}`;
        sendAuthCompleteMessage(userId, 'auth-only-no-community', sessionProfileData.sessionToken, sessionProfileData.type);
        setCurrentStep('auth-complete');
        return;
      }
      
      // Normal flow: Check if embed has a specific community target
      if (config.community) {
        setSelectedCommunityId(config.community);
        setCurrentStep('community-selection');
      } else {
        // Has session + no specific community → show community selection
        setCurrentStep('community-selection');
      }
    } else {
      // No session → show authentication
      setCurrentStep('authentication');
    }
  }, [config.community, config.mode, sendAuthCompleteMessage]);

  const handleAuthenticated = useCallback((data: ProfileData) => {
    setProfileData(data);
    
    // Check for auth-only mode - skip community selection entirely
    if (config.mode === 'auth-only') {
      console.log(`[Embed] ${config.mode} mode: sending auth-complete immediately`);
      const userId = data.userId || data.address || `fallback_${Date.now()}`;
      sendAuthCompleteMessage(userId, 'auth-only-no-community', data.sessionToken, data.type);
      setCurrentStep('auth-complete');
      return;
    }

    // Check for secure-auth mode - handle based on auth type
    if (config.mode === 'secure-auth') {
      // Note: Anonymous auth should not be possible in secure-auth mode (filtered in AuthenticationStep)
      // For ENS/UP: continue to profile preview (session token set there)
      console.log(`[Embed] ${config.mode} mode: continuing to profile preview for ${data.type}`);
      setCurrentStep('profile-preview');
      return;
    }
    
    // Normal flow progression
    if (data.type === 'anonymous') {
      // Skip profile preview and signature for anonymous users
      console.log('[Embed] Anonymous user: proceeding to community selection');
      setCurrentStep('community-selection');
    } else {
      // Show "moment of delight" profile preview for wallet users (both fresh and already connected)
      console.log('[Embed] Wallet connected: showing profile preview');
      setCurrentStep('profile-preview');
    }
  }, [config.mode, sendAuthCompleteMessage]);

  const handleProfileContinue = useCallback((updatedProfileData?: ProfileData) => {
    // Update ProfileData with database user information if provided from signing
    if (updatedProfileData) {
      console.log('[Embed] ProfileData updated from profile preview signing:', updatedProfileData);
      setProfileData(updatedProfileData);
    }
    
    // Check for auth-only mode - skip community selection entirely  
    if (config.mode === 'auth-only') {
      console.log(`[Embed] ${config.mode} mode: sending auth-complete after profile preview`);
      const finalProfileData = updatedProfileData || profileData;
      const userId = finalProfileData?.userId || finalProfileData?.address || `fallback_${Date.now()}`;
      sendAuthCompleteMessage(userId, 'auth-only-no-community', finalProfileData?.sessionToken, finalProfileData?.type);
      setCurrentStep('auth-complete');
      return;
    }

    // Check for secure-auth mode - complete auth flow with session token
    if (config.mode === 'secure-auth') {
      console.log(`[Embed] ${config.mode} mode: sending auth-complete after profile preview with session token`);
      const finalProfileData = updatedProfileData || profileData;
      const userId = finalProfileData?.userId || finalProfileData?.address || `fallback_${Date.now()}`;
      sendAuthCompleteMessage(userId, 'auth-only-no-community', finalProfileData?.sessionToken, finalProfileData?.type);
      setCurrentStep('auth-complete');
      return;
    }
    
    // Normal flow: Skip signature verification - signing happens in profile preview
    setCurrentStep('community-selection');
  }, [config.mode, profileData, sendAuthCompleteMessage]);

  const handleSwitchAccount = useCallback(() => {
    setProfileData(null);
    setCurrentStep('authentication');
  }, []);

  const handleSignatureComplete = useCallback((updatedProfileData?: ProfileData) => {
    // Update ProfileData with database user information if provided
    if (updatedProfileData) {
      console.log('[Embed] ProfileData updated from signature verification:', updatedProfileData);
      setProfileData(updatedProfileData);
    }
    setCurrentStep('community-selection');
  }, []);

  const handleCommunitySelected = useCallback((communityId?: string) => {
    if (communityId) {
      setSelectedCommunityId(communityId);
      console.log('[Embed] Community selected:', communityId);
      console.log('[Embed] Mode:', config.mode || 'full');
      console.log('[Embed] DEBUG - profileData state:', profileData);
      console.log('[Embed] DEBUG - currentStep:', currentStep);
      
      // FIXED: Handle both authenticated and session-only users
      let userId: string;
      let sessionToken: string | undefined;
      
      if (profileData) {
        // User went through full authentication flow
        console.log('[Embed] DEBUG - Using profileData for auth complete');
        if (profileData.userId) {
          // Use the actual database user_id for ALL user types (including anonymous)
          userId = profileData.userId;
        } else {
          // Fallback for cases without stored userId
          userId = profileData.address || `fallback_${Date.now()}`;
        }
        sessionToken = profileData.sessionToken;
      } else {
        // User has existing session but no profileData 
        console.log('[Embed] DEBUG - No profileData, creating fallback userId');
        userId = `session_user_${Date.now()}`;
        sessionToken = undefined; // No session token available
      }
      
      console.log('[Embed] DEBUG - Sending auth complete with userId:', userId);
      
      // Send auth complete message to parent
      sendAuthCompleteMessage(userId, communityId, sessionToken, profileData?.type);
      
      // Check for auth-only or secure-auth mode
      if (config.mode === 'auth-only' || config.mode === 'secure-auth') {
        console.log(`[Embed] 🎯 ${config.mode} mode detected - staying on auth-complete step`);
        setCurrentStep('auth-complete');
        // In auth-only or secure-auth mode, we stop here and don't transition to forum
        return;
      }
      
      // Normal flow: show completion step (will transition to forum later)
      console.log('[Embed] Normal mode - proceeding to auth-complete step');
      setCurrentStep('auth-complete');
    } else {
      console.log('[Embed] DEBUG - No communityId provided to handleCommunitySelected');
    }
  }, [profileData, sendAuthCompleteMessage, currentStep, config.mode]);

  // Handle user disconnect (clear session and reset)
  const handleDisconnect = useCallback(() => {
    console.log('[Embed] User disconnecting - clearing session and resetting');
    
    // Clear all state
    setProfileData(null);
    setSelectedCommunityId(null);
    setCurrentStep('authentication');
    
    // Session token is cleared by the EmbedUserWidget component
  }, []);

  // Initialize loading sequence
  React.useEffect(() => {
    const timer = setTimeout(handleLoadingComplete, 1500);
    return () => clearTimeout(timer);
  }, [handleLoadingComplete]);

  // Note: Signature verification is now properly integrated into the flow

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'loading':
        return <LoadingStep />;
        
      case 'session-check':
        return (
          <SessionCheckStep 
            config={config}
            onSessionResult={handleSessionResult}
          />
        );
        
      case 'authentication':
        return (
          <AuthenticationStep 
            config={config}
            onAuthenticated={handleAuthenticated}
          />
        );
        
      case 'profile-preview':
        return profileData ? (
          <ProfilePreviewStep 
            config={config}
            profileData={profileData}
            onSwitchAccount={handleSwitchAccount}
            onContinue={handleProfileContinue}
          />
        ) : null;
        
      case 'signature-verification':
        return profileData ? (
          <SignatureVerificationStep 
            config={config}
            profileData={profileData}
            onSignatureComplete={handleSignatureComplete}
          />
        ) : null;
        
      case 'community-selection':
        return (
          <CommunitySelectionStep 
            config={config}
            onCommunitySelected={handleCommunitySelected}
            sessionToken={profileData?.sessionToken}
          />
        );
        
      case 'auth-complete':
        return (
          <AuthCompleteStep 
            config={config}
            profileData={profileData}
            communityId={selectedCommunityId}
          />
        );
        
      default:
        return <LoadingStep />;
    }
  };

  return (
    <div className="embed-container">
      {/* Top Bar with Progress and User Info */}
      <EmbedTopBar 
        currentStep={currentStep}
        profileData={profileData}
        onDisconnect={handleDisconnect}
      />
      
      <div className="embed-content">
        {renderStep()}
      </div>
    </div>
  );
};

export default function EmbedPage() {
  return (
    <QueryClientProvider>
      <Suspense fallback={<LoadingStep />}>
        <EmbedPageContent />
      </Suspense>
    </QueryClientProvider>
  );
}

function EmbedPageContent() {
  const searchParams = useSearchParams();
  const themeParam = (searchParams.get('theme') as 'light' | 'dark' | 'auto') || 'light';
  const backgroundColor = searchParams.get('background_color') || undefined;
  
  // Apply custom background color via CSS custom properties only (not document.body)
  React.useEffect(() => {
    if (backgroundColor) {
      // Override CSS custom properties used by theme system
      document.documentElement.style.setProperty('--background', backgroundColor);
      document.documentElement.style.setProperty('--background-color', backgroundColor);
      
      console.log('[Embed] Applied custom background color:', backgroundColor);
    }
    
    // Cleanup function to restore original styles
    return () => {
      if (backgroundColor) {
        document.documentElement.style.removeProperty('--background');
        document.documentElement.style.removeProperty('--background-color');
      }
    };
  }, [backgroundColor]);
  
  // Prepare container styles with custom background if provided
  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    overflow: 'hidden',  // Clip content to iframe border-radius
  };
  
  if (backgroundColor) {
    // Use !important equivalent by setting the property directly
    containerStyles.backgroundColor = backgroundColor;
    containerStyles.background = backgroundColor; // Additional fallback
  }
  
  return (
    <EmbedThemeProvider theme={themeParam}>
      <div 
        className={`min-h-screen text-foreground ${!backgroundColor ? 'bg-background' : ''}`}
        style={containerStyles}
      >
        <Suspense fallback={<LoadingStep />}>
          <EmbedContent />
        </Suspense>
        <Toaster 
          position="top-right"
          dir="ltr"
          toastOptions={{
            style: {
              background: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
            duration: 4000,
          }}
        />
      </div>
    </EmbedThemeProvider>
  );
} 