'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbedConfigurator } from '@/components/configurator/EmbedConfigurator';
import { CodeGenerator } from '@/components/configurator/CodeGenerator';
import { PreviewModal } from '@/components/configurator/PreviewModal';
import { Footer } from '@/components/landing/Footer';
import { ArrowLeft, Settings, Code, Eye } from 'lucide-react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  borderRadius?: string;
  selectedCommunityId?: string | null;
}

export function GetStartedPageClient() {
  const [config, setConfig] = useState<EmbedConfig>({
    width: '100%',
    height: '100%',
    theme: 'auto',
    borderRadius: '8px',
    selectedCommunityId: null
  });
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }

    // Listen for auth completion from embedded auth-only modal
    const handleAuthComplete = (event: MessageEvent) => {
      if (event.data?.type === 'curia-auth-complete' && event.data?.mode === 'auth-only') {
        const { sessionToken, userId } = event.data;
        if (sessionToken) {
          localStorage.setItem('authToken', sessionToken);
          setAuthToken(sessionToken);
          setIsAuthenticated(true);
          console.log('Authentication completed for user:', userId);
        }
      }
    };

    window.addEventListener('message', handleAuthComplete);
    return () => window.removeEventListener('message', handleAuthComplete);
  }, []);

  const handleConfigChange = (newConfig: Partial<EmbedConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleAuthRequired = () => {
    // Open auth-only embed modal for authentication
    const authUrl = `/embed?mode=auth-only&redirectTo=${encodeURIComponent(window.location.href)}`;
    
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
    iframe.src = authUrl;
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

  const openPreview = () => {
    setIsPreviewModalOpen(true);
  };

  return (
    <main className="bg-white dark:bg-slate-900">
      {/* Background decorations matching main theme */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 -z-10" />
      <div className="fixed inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] bg-[size:20px_20px] -z-10" />
      <div className="fixed -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <div className="relative z-10">
        {/* Navigation Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  <Settings className="w-3 h-3 mr-1" />
                  Configuration Tool
                </Badge>
                {isAuthenticated && (
                  <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
                    ✓ Authenticated
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              Configure Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Web3 Forum
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Choose your community, customize your embed size and appearance, then get the code to add to your website. 
              {!isAuthenticated && ' Sign in to access your communities and create new ones.'}
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Configurator */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Configure</h2>
              </div>
              <EmbedConfigurator 
                config={config}
                onChange={handleConfigChange}
                isAuthenticated={isAuthenticated}
                onAuthRequired={handleAuthRequired}
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
                    onClick={openPreview}
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
      </div>

      {/* Preview Modal */}
      <PreviewModal 
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        config={config}
      />
      
      <Footer />
    </main>
  );
} 