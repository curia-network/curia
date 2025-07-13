'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-xl max-w-6xl max-h-[90vh] w-full mx-4 overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              🔍 Preview Your Forum
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-2">
            <span>Size: {config.width} × {config.height}</span>
            <span>•</span>
            <span>Theme: {config.theme}</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Preview Container */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Preview Mode</span>
            </div>
            
            {/* Embed Container */}
            <div 
              ref={embedRef}
              className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-600"
              style={{
                width: config.width === '100%' ? '100%' : config.width,
                height: config.height,
                minHeight: '300px'
              }}
            />
          </div>
          
          {/* Info Text */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
            This is exactly how your forum will look on your website
          </p>
        </div>
      </div>
    </div>
  );
} 