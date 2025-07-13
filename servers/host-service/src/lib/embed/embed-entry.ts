/**
 * Embed Script Entry Point
 * 
 * This is the main entry point for the embed.js bundle.
 * It imports the actual TypeScript classes and creates a self-contained script.
 */

import { EmbedConfig } from './types/EmbedTypes';
import { parseEmbedConfig } from './core/EmbedConfig';
import { InternalPluginHost } from './plugin-host/InternalPluginHost';

// Use global interface from EmbedTypes (avoids circular import issues)
// window.curiaEmbed will be InternalPluginHost but typed as any

// Get environment URLs (injected at build time via esbuild define)
declare const CURIA_HOST_URL: string;
declare const CURIA_FORUM_URL: string;

// Capture script element during initial execution when document.currentScript works
const EMBED_SCRIPT_ELEMENT = document.currentScript as HTMLScriptElement;

// Validate that we have the script element
if (!EMBED_SCRIPT_ELEMENT) {
  console.error('[Embed] Failed to capture script element during initialization');
}

// Main embed initialization function
function initializeEmbed() {
  console.log('[Embed] Initializing Curia embed script...');

  try {
    // Parse configuration from script attributes using captured script element
    // If capture failed, parseEmbedConfig will try document.currentScript as fallback
    const config = parseEmbedConfig(EMBED_SCRIPT_ELEMENT);
    console.log('[Embed] Parsed config:', config);

    // Find or create target container
    const containerId = config.container || 'curia-forum';
    let container = document.getElementById(containerId);
    
    if (!container) {
      console.log(`[Embed] Container "${containerId}" not found, creating it`);
      container = document.createElement('div');
      container.id = containerId;
      
      // Try to insert next to script element, otherwise append to body
      if (EMBED_SCRIPT_ELEMENT?.parentNode) {
        EMBED_SCRIPT_ELEMENT.parentNode.insertBefore(container, EMBED_SCRIPT_ELEMENT.nextSibling);
      } else {
        console.warn('[Embed] No script element available, appending container to body');
        document.body.appendChild(container);
      }
    }

    // Clean up any existing embed instance
    if (window.curiaEmbed) {
      console.log('[Embed] Cleaning up existing embed instance');
      window.curiaEmbed.destroy();
      delete window.curiaEmbed;
    }

    // Create new embed instance using the real TypeScript class
    console.log('[Embed] Creating InternalPluginHost instance');
    const embedInstance = new InternalPluginHost(
      container,
      config,
      CURIA_HOST_URL,
      CURIA_FORUM_URL
    );

    // Store global reference for cleanup
    window.curiaEmbed = embedInstance;
    
    console.log('[Embed] Embed initialized successfully');
    
  } catch (error) {
    console.error('[Embed] Failed to initialize embed:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeEmbed);
} else {
  // DOM already loaded, initialize immediately
  initializeEmbed();
} 