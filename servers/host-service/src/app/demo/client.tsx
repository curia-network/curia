/**
 * Demo - Full Screen Forum Experience
 * 
 * This page shows the forum embed in full-screen mode with a subtle top bar.
 */

'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function DemoPageClient() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Load the embed script for full-screen experience
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.async = true;
    script.setAttribute('data-container', 'curia-forum');
    script.setAttribute('data-theme', resolvedTheme); // Use current theme
    script.setAttribute('data-width', '100%');
    script.setAttribute('data-height', '100%');
    script.setAttribute('data-background-color', resolvedTheme === 'dark' ? '#0F172A' : '#FFFFFF');
    
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // Clean up global reference
      if (window.curiaEmbed) {
        if (window.curiaEmbed.destroy) {
          window.curiaEmbed.destroy();
        }
        delete window.curiaEmbed;
      }
    };
  }, [resolvedTheme]);

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Subtle Top Bar */}
      <div className="bg-background border-b border-border px-4 py-3 flex items-center shadow-sm flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        
        <div className="ml-auto text-sm text-muted-foreground">
          Full Page Demo
        </div>
      </div>

      {/* Full Screen Embed Container */}
      <div className="flex-1 bg-background min-h-0 overflow-hidden">
        <div 
          id="curia-forum" 
          className="w-full h-full"
          style={{
            maxHeight: '100%',
            overflow: 'hidden'
          }}
        ></div>
      </div>
    </div>
  );
} 