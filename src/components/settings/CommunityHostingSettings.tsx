'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe,
  Info,
  ExternalLink,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CommunitySettings } from '@/types/settings';
import { cn } from '@/lib/utils';

interface CommunityHostingSettingsProps {
  currentSettings?: CommunitySettings;
  onSettingsChange: (settings: CommunitySettings) => void;
  isLoading?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export const CommunityHostingSettings: React.FC<CommunityHostingSettingsProps> = ({
  currentSettings,
  onSettingsChange,
  isLoading = false,
  theme = 'light',
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localDomain, setLocalDomain] = useState(currentSettings?.hosting?.domain || '');
  const [hasChanges, setHasChanges] = useState(false);

  const handleDomainChange = (value: string) => {
    setLocalDomain(value);
    setHasChanges(value !== (currentSettings?.hosting?.domain || ''));
  };

  const handleSave = () => {
    const newSettings: CommunitySettings = {
      ...currentSettings,
      hosting: localDomain.trim() ? { domain: localDomain.trim() } : undefined
    };
    
    onSettingsChange(newSettings);
    setHasChanges(false);
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain.trim()) return true; // Empty is valid (will use env var)
    
    try {
      const url = new URL(domain);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isDomainValid = validateDomain(localDomain);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors touch-manipulation select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={20} />
            <div>
              <CardTitle className="text-lg">Community Hosting</CardTitle>
              <CardDescription>
                Configure the domain where your forum is hosted
              </CardDescription>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={20} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={20} className="text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This domain will be used for generating shareable links and RSS feeds. 
              If not set, the system will use the default environment configuration.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="domain" className="text-sm font-medium">
                Community Domain
              </Label>
              <div className="mt-1">
                <Input
                  id="domain"
                  type="url"
                  placeholder="https://mycommunity.com"
                  value={localDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className={cn(
                    "w-full",
                    !isDomainValid && localDomain.trim() && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {!isDomainValid && localDomain.trim() && (
                  <p className="text-sm text-destructive mt-1">
                    Please enter a valid URL (e.g., https://mycommunity.com)
                  </p>
                )}
                <p className={cn(
                  "text-xs mt-1",
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                )}>
                  Include the protocol (https://) and domain where your forum is embedded
                </p>
              </div>
            </div>

            {localDomain.trim() && isDomainValid && (
              <div className={cn(
                "p-3 rounded-lg border",
                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink size={16} />
                  <span className="text-sm font-medium">Preview</span>
                </div>
                <p className="text-sm">
                  Share links will use: <code className="text-xs bg-muted px-1 py-0.5 rounded">{localDomain}</code>
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || !isDomainValid || isLoading}
                size="sm"
              >
                <Save size={16} className="mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              {hasChanges && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLocalDomain(currentSettings?.hosting?.domain || '');
                    setHasChanges(false);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}; 