'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Unlock, 
  Sparkles, 
  Clock,
  X,
  Check,
  Plus
} from 'lucide-react';
import { LockWithStats } from '@/types/locks';
import { LockBrowser } from './LockBrowser';
import { PostSettings } from '@/types/settings';
import { cn } from '@/lib/utils';

interface PostGatingSelectorProps {
  settings: PostSettings;
  onChange: (settings: PostSettings) => void;
  disabled?: boolean;
  className?: string;
  onCreateLockRequested?: () => void;
}

type SelectionMode = 'none' | 'browse_locks';

export const PostGatingSelector: React.FC<PostGatingSelectorProps> = ({
  settings,
  onChange,
  disabled = false,
  className = '',
  onCreateLockRequested
}) => {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [selectedLock, setSelectedLock] = useState<LockWithStats | null>(null);
  
  // Determine current gating state
  const hasGating = settings.responsePermissions?.categories && 
                    settings.responsePermissions.categories.length > 0;
  const currentLockId = (settings as unknown as { lockId?: number }).lockId; // From potential lock_id field
  
  useEffect(() => {
    if (currentLockId) {
      setSelectionMode('browse_locks');
    } else {
      setSelectionMode('none');
    }
  }, [hasGating, currentLockId]);
  
  // Handle lock selection
  const handleLockSelect = (lock: LockWithStats) => {
    setSelectedLock(lock);
    
    // Apply the lock's gating configuration to the post
    const newSettings: PostSettings = {
      ...settings,
      responsePermissions: lock.gatingConfig
    };
    
    // Also store lock ID if we have that capability
    (newSettings as unknown as { lockId?: number }).lockId = lock.id;
    
    onChange(newSettings);
    setSelectionMode('browse_locks');
  };
  
  // Handle removing gating
  const handleRemoveGating = () => {
    const newSettings: PostSettings = {
      ...settings,
      responsePermissions: undefined
    };
    
    // Remove lock ID
    const extendedSettings = newSettings as unknown as { lockId?: number };
    delete extendedSettings.lockId;
    
    onChange(newSettings);
    setSelectedLock(null);
    setSelectionMode('none');
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Control */}
      <Card className={cn(
        'transition-all',
        disabled && 'opacity-50 pointer-events-none',
        hasGating && 'border-primary/50 bg-primary/5'
      )}>
        <CardContent className="p-4">
          {/* No Gating State */}
          {selectionMode === 'none' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Unlock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium">Public Post</h3>
                  <p className="text-sm text-muted-foreground">
                    Anyone can reply to this post
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setSelectionMode('browse_locks')}
                  disabled={disabled}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Choose Lock
                </Button>
                {onCreateLockRequested && (
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={onCreateLockRequested}
                    disabled={disabled}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lock
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* Lock Selected State */}
          {selectionMode === 'browse_locks' && selectedLock && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div 
                    className="p-2 rounded-lg text-white"
                    style={{ backgroundColor: selectedLock.color }}
                  >
                    {selectedLock.icon || <Lock className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{selectedLock.name}</h3>
                      {selectedLock.isTemplate && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="h-2 w-2 mr-1" />
                          Template
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedLock.description || 'Gated post using lock requirements'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:items-center">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={handleRemoveGating}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Remove</span>
                  </Button>
                </div>
              </div>
              
              {/* Usage Stats */}
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Used {selectedLock.usageCount} time{selectedLock.usageCount !== 1 ? 's' : ''}</span>
                </div>
                {selectedLock.successRate > 0 && (
                  <div className="flex items-center space-x-1">
                    <Check className="h-3 w-3" />
                    <span>{(selectedLock.successRate * 100).toFixed(0)}% success rate</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Lock Browser (when in browse mode) */}
      {selectionMode === 'browse_locks' && !selectedLock && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Choose a Lock</CardTitle>
              <Button 
                type="button"
                variant="ghost" 
                size="sm"
                onClick={() => setSelectionMode('none')}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {onCreateLockRequested && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Need a custom lock?</span>
                  </div>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    className="w-full sm:w-auto text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                    onClick={onCreateLockRequested}
                    disabled={disabled}
                  >
                    Create New Lock
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Create a reusable lock for this and future posts
                </p>
              </div>
            )}
            <LockBrowser
              onSelectLock={handleLockSelect}
              selectedLockId={currentLockId}
            />
          </CardContent>
        </Card>
      )}
      
      {/* Quick Actions */}
      {selectionMode === 'none' && (
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            🔓 This post will be public - anyone can reply without restrictions
          </p>
        </div>
      )}
    </div>
  );
}; 