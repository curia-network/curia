/**
 * Embed Theme Provider - Dedicated theme provider for embed pages
 * 
 * Applies theme directly from URL parameters without localStorage pollution
 * or conflicts with the main app theme system. Theme is locked to URL param
 * and cannot be overridden by user preferences.
 */

'use client';

import React, { useEffect } from 'react';

interface EmbedThemeProviderProps {
  children: React.ReactNode;
  theme: 'light' | 'dark' | 'auto';
}

export function EmbedThemeProvider({ children, theme }: EmbedThemeProviderProps) {
  useEffect(() => {
    // Resolve theme based on URL parameter
    const resolvedTheme = theme === 'auto' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      theme;
    
    // Apply theme to document without localStorage
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    
    // Cleanup function to restore original theme when component unmounts
    return () => {
      document.documentElement.classList.remove('light', 'dark');
    };
  }, [theme]);

  return <>{children}</>;
} 