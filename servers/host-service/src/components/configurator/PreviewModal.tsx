'use client';

import { useEffect, useRef } from 'react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EmbedConfig;
}

export function PreviewModal({ isOpen, onClose, config }: PreviewModalProps) {
  const embedRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

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
    script.setAttribute('data-community', 'test-community');
    script.setAttribute('data-theme', config.theme);
    script.setAttribute('data-width', config.width);
    script.setAttribute('data-height', config.height);
    
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
    <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-900">
      {/* Safari-style Browser Window - Full Screen */}
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 w-full h-full flex flex-col">
        {/* Browser Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="w-3 h-3 bg-red-400 rounded-full hover:bg-red-500 transition-colors"></button>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="ml-3 text-sm text-slate-600 dark:text-slate-300">yourwebsite.com</span>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Forum: {config.width} × {config.height} • Theme: {config.theme}
          </div>
        </div>
        
        {/* Website Content Area */}
        <div className="flex-1 bg-white dark:bg-slate-900 p-6 flex flex-col overflow-hidden">
          {/* Mock webpage header */}
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-3 w-1/3"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3"></div>
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
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 