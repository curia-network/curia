/**
 * Internal Plugin Host - Self-contained plugin hosting within embed script
 * 
 * This class embeds all ClientPluginHost functionality directly into the embed script,
 * making it completely self-contained so customers don't need to implement any logic.
 * 
 * Responsibilities:
 * 1. Handle auth completion from embed iframe
 * 2. Manage iframe switching (auth → forum)
 * 3. Route API requests from forum to host service
 * 4. Maintain auth context throughout session
 */

import { EmbedConfig } from '../types/EmbedTypes';

/**
 * Authentication context for API requests
 */
export interface InternalAuthContext {
  userId: string;
  communityId: string;
  sessionToken?: string;
}

/**
 * Message types for internal communication
 */
enum InternalMessageType {
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  INIT = 'init',
  ERROR = 'error'
}

/**
 * Internal plugin message interface
 */
interface InternalPluginMessage {
  type: InternalMessageType;
  iframeUid: string;
  requestId: string;
  method?: string;
  params?: any;
  data?: any;
  error?: string;
}

/**
 * Get iframe permissions for forum functionality
 */
function getIframePermissions(): string {
  return [
    'clipboard-write *',
    'clipboard-read *', 
    'fullscreen *',
    'web-share *',
    'autoplay *',
    'picture-in-picture *',
    'payment *',
    'encrypted-media *',
    'storage-access *',
    'camera *',
    'microphone *',
    'geolocation *'
  ].join('; ');
}

/**
 * Internal Plugin Host - completely self-contained within embed script
 */
export class InternalPluginHost {
  private container: HTMLElement;
  private config: EmbedConfig;
  private authContext: InternalAuthContext | null = null;
  private currentIframe: HTMLIFrameElement | null = null;
  private myUid: string; // Instance-specific UID (not singleton)
  private hostServiceUrl: string;
  private forumUrl: string;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor(container: HTMLElement, config: EmbedConfig, hostServiceUrl: string, forumUrl: string) {
    this.container = container;
    this.config = config;
    this.hostServiceUrl = hostServiceUrl;
    this.forumUrl = forumUrl;
    this.myUid = this.generateIframeUid(); // Generate instance-specific UID
    
    this.setupMessageListener();
    this.initializeAuthPhase();
  }

  /**
   * Initialize auth phase - load embed iframe for authentication
   */
  private initializeAuthPhase(): void {
    console.log('[InternalPluginHost] Initializing auth phase');
    
    // Build auth iframe URL with theme and community parameters
    const authUrl = new URL(`${this.hostServiceUrl}/embed`);
    authUrl.searchParams.set('theme', this.config.theme || 'light');
    if (this.config.backgroundColor) {
      authUrl.searchParams.set('background_color', this.config.backgroundColor);
    }
    if (this.config.community) {
      authUrl.searchParams.set('community', this.config.community);
      console.log('[InternalPluginHost] Adding community parameter to auth iframe:', this.config.community);
    }
    if (this.config.mode) {
      authUrl.searchParams.set('mode', this.config.mode);
      console.log('[InternalPluginHost] Adding mode parameter to auth iframe:', this.config.mode);
    }
    
    // Create auth iframe
    const iframe = document.createElement('iframe');
    iframe.src = authUrl.toString();
    iframe.style.width = this.config.width || '100%';
    iframe.style.height = this.config.height || '700px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = this.config.borderRadius || '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    iframe.setAttribute('allow', getIframePermissions());
    
    // Add iframe to container
    this.container.appendChild(iframe);
    this.currentIframe = iframe;
    
    console.log('[InternalPluginHost] Auth iframe loaded with theme:', this.config.theme);
  }

  /**
   * Set up message listener for all plugin communication
   */
  private setupMessageListener(): void {
    // Store listener reference for proper cleanup
    this.messageListener = (event: MessageEvent) => {
      this.handleMessage(event);
    };
    
    window.addEventListener('message', this.messageListener);
    console.log('[InternalPluginHost] Message listener attached for UID:', this.myUid);
  }

  /**
   * Handle all incoming messages
   */
  private async handleMessage(event: MessageEvent): Promise<void> {
    if (!event.data || typeof event.data !== 'object') {
      return;
    }

    // Handle auth completion from embed iframe
    if (event.data.type === 'curia-auth-complete') {
      await this.handleAuthCompletion(event.data);
      return;
    }

    // Handle API requests from forum
    const message = event.data as InternalPluginMessage;
    if (message.type === InternalMessageType.API_REQUEST) {
      await this.handleApiRequest(message, event.source as Window);
      return;
    }

    // Handle other message types
    if (message.type === InternalMessageType.INIT) {
      console.log('[InternalPluginHost] Forum initialized');
      return;
    }
  }

  /**
   * Handle auth completion and switch to forum
   */
  private async handleAuthCompletion(authData: any): Promise<void> {
    console.log('[InternalPluginHost] Auth completion received:', authData);
    
    // Store auth context
    this.authContext = {
      userId: authData.userId,
      communityId: authData.communityId,
      sessionToken: authData.sessionToken
    };
    
    console.log('[InternalPluginHost] Auth context set:', this.authContext);
    
    // Check for auth-only mode
    if (authData.mode === 'auth-only') {
      console.log('[InternalPluginHost] 🎯 Auth-only mode detected - NOT switching to forum');
      console.log('[InternalPluginHost] Auth-only flow complete - embed stays on auth-complete step');
      return; // Don't switch to forum in auth-only mode
    }
    
    // Normal flow: switch to forum phase
    console.log('[InternalPluginHost] Normal mode - switching to forum');
    await this.switchToForum();
  }

  /**
   * Switch iframe from auth to forum
   */
  private async switchToForum(): Promise<void> {
    console.log('[InternalPluginHost] Switching to forum phase');
    
    if (!this.authContext) {
      console.error('[InternalPluginHost] Cannot switch to forum - no auth context');
      return;
    }

    // Use our instance UID for forum communication
    
    // Build forum URL with parameters
    const forumUrl = new URL(this.forumUrl);
    forumUrl.searchParams.set('mod', 'standalone');
    
    // ========================================================================
    // THEME RESOLUTION: Convert "auto" to actual system preference for forum
    // ========================================================================
    // The embed route (/embed) can handle "auto" theme perfectly and will 
    // apply system-aware styling. However, the main Curia forum application
    // only understands explicit "dark" or "light" values, not "auto".
    //
    // This logic resolves "auto" to the user's actual system preference
    // before sending to the forum, while preserving "auto" functionality
    // in the embed authentication flow.
    //
    // Data Flow:
    // 1. ✅ Embed route gets "auto" → Handles system detection internally
    // 2. ✅ Forum route gets "dark"/"light" → Works with resolved value
    // ========================================================================
    let resolvedTheme = this.config.theme || 'light';
    if (resolvedTheme === 'auto') {
      // Detect user's system preference using standard web API
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        resolvedTheme = 'dark';
      } else {
        resolvedTheme = 'light'; // Safe fallback default
      }
      console.log('[InternalPluginHost] Resolved auto theme to:', resolvedTheme, 
                  '(system prefers:', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light', ')');
    }
    
    forumUrl.searchParams.set('cg_theme', resolvedTheme);
    if (this.config.backgroundColor) {
      forumUrl.searchParams.set('cg_bg_color', this.config.backgroundColor);
    }
    forumUrl.searchParams.set('iframeUid', this.myUid);
    
    console.log('[InternalPluginHost] Forum URL:', forumUrl.toString());
    
    // Remove existing iframe
    if (this.currentIframe && this.currentIframe.parentElement) {
      this.currentIframe.parentElement.removeChild(this.currentIframe);
    }
    
    // Create forum iframe
    const iframe = document.createElement('iframe');
    iframe.src = forumUrl.toString();
    iframe.style.width = this.config.width || '100%';
    iframe.style.height = this.config.height || '700px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = this.config.borderRadius || '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
    iframe.setAttribute('allow', getIframePermissions());
    
    // Add forum iframe to container
    this.container.appendChild(iframe);
    this.currentIframe = iframe;
    
    console.log('[InternalPluginHost] Forum iframe loaded');
  }

  /**
   * Handle API requests from forum
   */
  private async handleApiRequest(message: InternalPluginMessage, source: Window): Promise<void> {
    try {
      console.log('[InternalPluginHost] API request:', message.method, message.params);
      
      // Validate auth context
      if (!this.authContext) {
        throw new Error('No authentication context available');
      }

      // Instance-based UID filtering - only handle our own messages
      if (message.iframeUid !== this.myUid) {
        // Silently ignore messages from other embed instances
        return;
      }

      // Determine API endpoint
      let apiEndpoint: string;
      switch (message.method) {
        case 'getUserInfo':
        case 'getUserFriends':
        case 'getContextData':
          apiEndpoint = `${this.hostServiceUrl}/api/user`;
          break;
          
        case 'getCommunityInfo':
        case 'giveRole':
          apiEndpoint = `${this.hostServiceUrl}/api/community`;
          break;
          
        default:
          throw new Error(`Unknown API method: ${message.method}`);
      }

      // Make request to host service
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: message.method,
          params: message.params,
          communityId: this.authContext.communityId,
          userId: this.authContext.userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Send successful response
        this.sendResponse(source, message, result.data);
      } else {
        throw new Error(result.error || 'API request failed');
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[InternalPluginHost] API error:', errorMessage);
      this.sendError(source, message, errorMessage);
    }
  }

  /**
   * Send successful response to forum
   */
  private sendResponse(source: Window, originalMessage: InternalPluginMessage, data: any): void {
    const response: InternalPluginMessage = {
      type: InternalMessageType.API_RESPONSE,
      iframeUid: originalMessage.iframeUid,
      requestId: originalMessage.requestId,
      data: data
    };
    
    source.postMessage(response, '*');
  }

  /**
   * Send error response to forum
   */
  private sendError(source: Window, originalMessage: InternalPluginMessage, error: string): void {
    const response: InternalPluginMessage = {
      type: InternalMessageType.API_RESPONSE,
      iframeUid: originalMessage.iframeUid,
      requestId: originalMessage.requestId,
      error: error
    };
    
    source.postMessage(response, '*');
  }

  /**
   * Generate unique iframe UID
   */
  private generateIframeUid(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${random}`.substring(0, 10);
  }

  /**
   * Cleanup when embed is destroyed
   */
  public destroy(): void {
    // Remove iframe
    if (this.currentIframe && this.currentIframe.parentElement) {
      this.currentIframe.parentElement.removeChild(this.currentIframe);
    }
    
    // Remove message listener to prevent stale listeners
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
      console.log('[InternalPluginHost] Message listener removed');
    }
    
    // Clear state
    this.currentIframe = null;
    this.authContext = null;
    // myUid stays - it's not nullable and helps identify this instance in logs
    
    console.log('[InternalPluginHost] Destroyed instance with UID:', this.myUid);
  }
}

 