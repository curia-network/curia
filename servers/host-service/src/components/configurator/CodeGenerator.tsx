'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sparkles } from 'lucide-react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
  backgroundColor?: string;
  borderRadius?: string;
  selectedCommunityId?: string | null;
}

interface CodeGeneratorProps {
  config: EmbedConfig;
  previewButton?: React.ReactNode;
}

export function CodeGenerator({ config, previewButton }: CodeGeneratorProps) {
  const [copied, setCopied] = useState(false);

  // Generate the embed code
  const generateEmbedCode = () => {
    const hostUrl = process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://your-host-url.com';
    
    const attributes = [
      `src="${hostUrl}/embed.js"`,
      `data-width="${config.width}"`,
      `data-height="${config.height}"`,
      `data-theme="${config.theme}"`,
      `data-container="curia-forum"`,
      `data-community="${config.selectedCommunityId || 'your-community-id'}"`
    ];

    // Add background color if specified
    if (config.backgroundColor) {
      attributes.splice(-2, 0, `data-background-color="${config.backgroundColor}"`);
    }

    // Add border radius if specified
    if (config.borderRadius) {
      attributes.splice(-2, 0, `data-border-radius="${config.borderRadius}"`);
    }

    return `<script ${attributes.join('\n        ')}></script>

<!-- Container where the forum will appear -->
<div id="curia-forum"></div>`;
  };

  const embedCode = generateEmbedCode();

  // Check if we have a real community selected
  const hasRealCommunity = config.selectedCommunityId && config.selectedCommunityId !== 'your-community-id';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

        return (
        <div className="space-y-6">
          {/* Community Status Indicator */}
          {!hasRealCommunity && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <div className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                    Community Selection Required
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    Select a community above to generate your final embed code. The placeholder will be replaced with your community's ID.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated Code with Gradient Magic */}
          <div className="relative">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-75 blur-sm animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg opacity-90 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            
            <Card className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    {hasRealCommunity ? '🔗 Your Embed Code' : '📝 Preview Embed Code'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className={`flex items-center gap-2 transition-all duration-200 ${
                      copied 
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
          <CardContent>
            <div className="bg-slate-900 dark:bg-slate-950 text-green-400 p-6 rounded-lg font-mono text-sm overflow-x-auto border border-slate-700">
              <pre className="whitespace-pre-wrap">{embedCode}</pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Button */}
      {previewButton && (
        <div>
          {previewButton}
        </div>
      )}

      {/* Instructions */}
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">📋 Quick Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-white">1. Copy the code above</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Copy the generated embed code and paste it into your website's HTML.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-white">2. Replace community ID</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Change <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-800 dark:text-slate-200">your-community-id</code> to your actual community identifier.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 dark:text-white">3. Test it out</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Save your changes and refresh your website to see your Web3 forum in action!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 