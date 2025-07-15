'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbedConfigurator } from '@/components/configurator/EmbedConfigurator';
import { CodeGenerator } from '@/components/configurator/CodeGenerator';
import { PreviewModal } from '@/components/configurator/PreviewModal';
import { CreateCommunityModal } from '@/components/configurator/CreateCommunityModal';
import { Footer } from '@/components/landing/Footer';
import { ArrowLeft, Settings, Code, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  borderRadius?: string;
  selectedCommunityId?: string | null;
}

export function GetStartedPageClient() {
  const { resolvedTheme } = useTheme();
  
  const [config, setConfig] = useState<EmbedConfig>({
    width: '100%',
    height: '100%',
    theme: resolvedTheme, // Use current theme instead of 'auto'
    borderRadius: '8px',
    selectedCommunityId: null
  });
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pendingCreateCommunity, setPendingCreateCommunity] = useState(false);

  const { isAuthenticated } = useAuth();

  // Update theme in config when user changes theme
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      theme: resolvedTheme
    }));
  }, [resolvedTheme]);

  // Listen for auth completion from embedded auth-only modal
  useEffect(() => {
    const handleAuthComplete = (event: MessageEvent) => {
      if (event.data?.type === 'curia-auth-complete' && (event.data?.mode === 'auth-only' || event.data?.mode === 'secure-auth')) {
        const { sessionToken, userId, communityId } = event.data;
        
        console.log('[GetStartedPageClient] Auth completed:', {
          sessionToken: sessionToken ? 'present' : 'missing',
          userId,
          communityId,
          mode: event.data.mode
        });
        
        // Store the session token
        if (sessionToken) {
          localStorage.setItem('curia_session_token', sessionToken);
        }
        
        // Handle different community selection scenarios
        if (communityId && communityId !== 'auth-only-no-community') {
          // User selected existing community
          console.log('[GetStartedPageClient] User selected existing community:', communityId);
          handleConfigChange({ selectedCommunityId: communityId });
        } else if (communityId === 'auth-only-no-community') {
          // User wants to create community after auth
          console.log('[GetStartedPageClient] User wants to create community after auth');
          setPendingCreateCommunity(true);
        }
      }
    };

    window.addEventListener('message', handleAuthComplete);
    return () => window.removeEventListener('message', handleAuthComplete);
  }, []);

  const handleConfigChange = (newConfig: Partial<EmbedConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleAuthRequired = (mode: string = 'auth-only') => {
    console.log('[GetStartedPageClient] Auth required, mode:', mode);
    
    // Clear any existing auth state
    localStorage.removeItem('curia_session_token');
    
    // Determine the embed URL based on mode
    const embedUrl = mode === 'secure-auth' 
      ? `/embed?mode=secure-auth&communityId=${config.selectedCommunityId || 'new'}`
      : `/embed?mode=auth-only&communityId=${config.selectedCommunityId || 'new'}`;

    // Create modal iframe for authentication
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.style.cssText = `
      width: 90vw;
      max-width: 500px;
      height: 80vh;
      max-height: 600px;
      border: none;
      border-radius: 12px;
      background: white;
    `;
    
    modal.appendChild(iframe);
    document.body.appendChild(modal);
    
    // Clean up on auth complete
    const cleanup = () => {
      document.body.removeChild(modal);
    };
    
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'curia-auth-complete') {
        cleanup();
        window.removeEventListener('message', handleAuthMessage);
      }
    };
    
    window.addEventListener('message', handleAuthMessage);
    
    // Allow clicking outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cleanup();
        window.removeEventListener('message', handleAuthMessage);
      }
    });
  };

  const handleClearPendingCreate = () => {
    setPendingCreateCommunity(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                Embed Configurator
              </h1>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Configuration */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configure</h2>
            </div>
            <EmbedConfigurator 
              config={config}
              onChange={handleConfigChange}
              onAuthRequired={handleAuthRequired}
              pendingCreateCommunity={pendingCreateCommunity}
              onClearPendingCreate={handleClearPendingCreate}
            />
          </div>

          {/* Right: Generated Code */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Implementation</h2>
            </div>
            <CodeGenerator 
              config={config} 
              previewButton={
                <Button
                  onClick={() => setIsPreviewModalOpen(true)}
                  size="lg" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={!config.selectedCommunityId}
                >
                  <Eye className="w-5 h-5 mr-2" />
                  {config.selectedCommunityId ? 'Preview Your Forum' : 'Select Community to Preview'}
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Modals */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        config={config}
      />
      
      <CreateCommunityModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCommunityCreated={(community) => {
          handleConfigChange({ selectedCommunityId: community.id });
          setCreateModalOpen(false);
          setPendingCreateCommunity(false);
        }}
      />
    </div>
  );
} 