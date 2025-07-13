'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Monitor, Sun, Moon, PanelLeft, FileText, Layout, Maximize } from 'lucide-react';

export interface EmbedConfig {
  width: string;
  height: string;
  theme: 'light' | 'dark' | 'auto';
}

interface EmbedConfiguratorProps {
  config: EmbedConfig;
  onChange: (config: Partial<EmbedConfig>) => void;
  onPreview: () => void;
}

interface SizePreset {
  name: string;
  width: string;
  height: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SIZE_PRESETS: SizePreset[] = [
  { name: 'Sidebar Widget', width: '400px', height: '600px', description: 'Compact but usable', icon: PanelLeft },
  { name: 'Article Embed', width: '100%', height: '500px', description: 'Embedded in blog posts', icon: FileText },
  { name: 'Main Content', width: '100%', height: '800px', description: 'Large content area', icon: Layout },
  { name: 'Full Container', width: '100%', height: '100%', description: 'Fill parent container', icon: Maximize },
];

// Helper function to cap dimensions to screen size
function capToScreenSize(value: string, dimension: 'width' | 'height'): string {
  if (typeof window === 'undefined' || !value.endsWith('px')) return value; // Only cap px values
  
  const numValue = parseInt(value);
  const maxValue = dimension === 'width' 
    ? Math.min(window.innerWidth * 0.95, 1200) // Cap at 95% viewport or 1200px
    : Math.min(window.innerHeight * 0.9, 800);  // Cap at 90% viewport or 800px
    
  return numValue > maxValue ? `${maxValue}px` : value;
}

export function EmbedConfigurator({ config, onChange, onPreview }: EmbedConfiguratorProps) {
  const [customWidth, setCustomWidth] = useState(config.width);
  const [customHeight, setCustomHeight] = useState(config.height);

  // Update local state when config changes
  useEffect(() => {
    setCustomWidth(config.width);
    setCustomHeight(config.height);
  }, [config.width, config.height]);

  const handlePresetClick = (preset: SizePreset) => {
    const cappedWidth = capToScreenSize(preset.width, 'width');
    const cappedHeight = capToScreenSize(preset.height, 'height');
    
    onChange({ 
      width: cappedWidth, 
      height: cappedHeight 
    });
  };

  const handleCustomSizeChange = () => {
    const cappedWidth = capToScreenSize(customWidth, 'width');
    const cappedHeight = capToScreenSize(customHeight, 'height');
    
    onChange({ 
      width: cappedWidth, 
      height: cappedHeight 
    });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    onChange({ theme });
  };

  return (
    <div className="space-y-6">
      {/* Size Configuration */}
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">📏 Size Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Size Presets */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
              Quick Presets
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SIZE_PRESETS.map((preset) => {
                const isSelected = config.width === preset.width && config.height === preset.height;
                const IconComponent = preset.icon;
                return (
                  <div
                    key={preset.name}
                    className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400' 
                        : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <div className="font-medium text-slate-900 dark:text-white">{preset.name}</div>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{preset.width} × {preset.height}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{preset.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Size Inputs */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
              Custom Size
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="width" className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Width</label>
                <input
                  id="width"
                  type="text"
                  value={customWidth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomWidth(e.target.value)}
                  onBlur={handleCustomSizeChange}
                  placeholder="100%, 600px, 50vw"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
              <div>
                <label htmlFor="height" className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Height</label>
                <input
                  id="height"
                  type="text"
                  value={customHeight}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomHeight(e.target.value)}
                  onBlur={handleCustomSizeChange}
                  placeholder="600px, 80vh, 400px"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              💡 Supports: px, %, vw, vh, em, rem
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Theme Configuration */}
      <Card className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">🎨 Theme Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md flex flex-col items-center ${
                config.theme === 'light' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="w-5 h-5 mb-2 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-900 dark:text-white">Light</span>
            </div>
            <div
              className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md flex flex-col items-center ${
                config.theme === 'dark' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="w-5 h-5 mb-2 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-900 dark:text-white">Dark</span>
            </div>
            <div
              className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 hover:shadow-md flex flex-col items-center ${
                config.theme === 'auto' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-400' 
                  : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
              onClick={() => handleThemeChange('auto')}
            >
              <Monitor className="w-5 h-5 mb-2 text-slate-600 dark:text-slate-400" />
              <span className="text-slate-900 dark:text-white">Auto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Button */}
      <Button 
        onClick={onPreview}
        size="lg" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Eye className="w-5 h-5 mr-2" />
        Preview Your Forum
      </Button>
    </div>
  );
} 