'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbedConfigurator } from '@/components/configurator/EmbedConfigurator';
import { CodeGenerator } from '@/components/configurator/CodeGenerator';
import { PreviewModal } from '@/components/configurator/PreviewModal';
import { ArrowLeft, Settings, Code } from 'lucide-react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
}

export default function GetStartedPage() {
  const [config, setConfig] = useState<EmbedConfig>({
    width: '100%',
    height: '600px',
    theme: 'auto'
  });
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const handleConfigChange = (newConfig: Partial<EmbedConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
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
              
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                <Settings className="w-3 h-3 mr-1" />
                Configuration Tool
              </Badge>
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
              Customize your embed size and appearance, then get the code to add to your website. 
              No signup required—just configure and deploy.
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
                onPreview={openPreview}
              />
            </div>

            {/* Right: Generated Code */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Implementation</h2>
              </div>
              <CodeGenerator config={config} />
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
    </main>
  );
} 