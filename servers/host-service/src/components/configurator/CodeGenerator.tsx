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
}

interface CodeGeneratorProps {
  config: EmbedConfig;
}

export function CodeGenerator({ config }: CodeGeneratorProps) {
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
      `data-community="your-community-id"`
    ];

    // Add background color if specified
    if (config.backgroundColor) {
      attributes.splice(-2, 0, `data-background-color="${config.backgroundColor}"`);
    }

    return `<script ${attributes.join('\n        ')}></script>

<!-- Container where the forum will appear -->
<div id="curia-forum"></div>`;
  };

  const embedCode = generateEmbedCode();

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
      {/* Configuration Summary - Moved to Top */}
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">⚙️ Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Size:</span>
            <span className="font-medium text-slate-900 dark:text-white">{config.width} × {config.height}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Theme:</span>
            <span className="font-medium capitalize text-slate-900 dark:text-white">{config.theme}</span>
          </div>
          {config.backgroundColor && (
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-400">Background:</span>
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-slate-300 dark:border-slate-600" 
                  style={{ backgroundColor: config.backgroundColor }}
                ></div>
                <span className="font-medium font-mono text-slate-900 dark:text-white">{config.backgroundColor}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">Container ID:</span>
            <span className="font-medium font-mono text-slate-900 dark:text-white">curia-forum</span>
          </div>
        </CardContent>
      </Card>

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
                🔗 Your Embed Code
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