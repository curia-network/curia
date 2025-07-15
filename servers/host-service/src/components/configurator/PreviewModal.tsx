'use client';

import { useEffect, useRef } from 'react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  borderRadius?: string;
  selectedCommunityId?: string | null;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmbedConfig;
}

export function PreviewModal({ isOpen, onClose, config }: PreviewModalProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !embedRef.current) return;

    // Clean up any existing embed
    if (embedRef.current) {
      embedRef.current.innerHTML = '';
    }

    // Create unique container ID to avoid conflicts
    const containerId = `curia-preview-${Date.now()}`;
    if (embedRef.current) {
      embedRef.current.id = containerId;
    }

    // Load the embed script with user's configuration
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.async = true;
    script.setAttribute('data-container', containerId);
    script.setAttribute('data-theme', config.theme);
    script.setAttribute('data-width', config.width);
    script.setAttribute('data-height', config.height);
    
    // Set community ID if specified
    if (config.selectedCommunityId) {
      script.setAttribute('data-community', config.selectedCommunityId);
    }
    
    // Only set background color if specified
    if (config.backgroundColor) {
      script.setAttribute('data-background-color', config.backgroundColor);
    }
    
    // Only set border radius if specified
    if (config.borderRadius) {
      script.setAttribute('data-border-radius', config.borderRadius);
    }
    
    document.head.appendChild(script);
    scriptRef.current = script;

    // Cleanup function
    return () => {
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
      }
      if (embedRef.current) {
        embedRef.current.innerHTML = '';
      }
      // Clean up global reference
      if (window.curiaEmbed) {
        if (window.curiaEmbed.destroy) {
          window.curiaEmbed.destroy();
        }
        delete window.curiaEmbed;
      }
    };
  }, [isOpen, config]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/40 dark:bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        // Force consistent positioning regardless of page context
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        // Ensure backdrop works over complex backgrounds
        backdropFilter: 'blur(12px) saturate(120%)',
        WebkitBackdropFilter: 'blur(12px) saturate(120%)'
      }}
    >
      {/* Safari-style Browser Window - Slightly smaller to show context */}
      <div 
        className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 w-[90vw] h-[90vh] flex flex-col rounded-lg shadow-2xl overflow-hidden"
        style={{
          // Ensure consistent sizing regardless of viewport context
          maxWidth: 'calc(100vw - 32px)', // Account for p-4 padding
          maxHeight: 'calc(100vh - 32px)', // Account for p-4 padding
          width: '90vw',
          height: '90vh'
        }}
      >
        {/* Browser Header Bar */}
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          {/* Traffic lights only - no navigation buttons */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="w-3 h-3 bg-red-400 rounded-full hover:bg-red-500 transition-colors" title="Close preview"></button>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
          
          {/* Address bar with navigation buttons */}
          <div className="flex items-center gap-2">
            {/* Navigation buttons - positioned like real browser */}
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0L2.586 11l3.707-3.707a1 1 0 011.414 1.414L5.414 11l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4.414 4.414-4.414 4.414a1 1 0 01-1.414-1.414L14.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/></svg>
            </div>
            
            <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
              <span className="text-sm text-slate-600 dark:text-slate-300 flex-1">https://yourwebsite.com/forum</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {config.width} × {config.height} • {config.theme}
            </div>
          </div>
        </div>
        
        {/* Website Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-6 flex flex-col overflow-hidden">
          {/* Mock webpage header */}
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-3 w-1/3 flex items-center justify-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your page title</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3 flex items-center pl-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">Your website content...</span>
            </div>
          </div>
          
          {/* The actual embed - constrained to remaining space */}
          <div className="flex-1 min-h-0">
            <div 
              ref={embedRef}
              className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-600 shadow-sm"
              style={{
                width: config.width,
                height: config.height === '100%' ? '100%' : Math.min(parseInt(config.height) || 600, 800) + 'px',
                maxHeight: '100%',
                overflow: 'hidden'
              }}
            />
          </div>
          
          {/* Mock webpage footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2 flex items-center pl-3">
              <span className="text-xs text-slate-400 dark:text-slate-500">More of your content below...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 