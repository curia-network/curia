'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWhatsNew } from '@/contexts/WhatsNewContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Hook to detect desktop (reuse from GlobalSearchModal pattern)
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768 && !('ontouchstart' in window));
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isDesktop;
};

export function WhatsNewModal() {
  const { isNotificationsOpen, closeNotifications } = useWhatsNew();
  const isDesktop = useIsDesktop();

  // Body scroll lock when modal is open (pattern from ModalContainer)
  useEffect(() => {
    if (isNotificationsOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      // Lock scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isNotificationsOpen]);

  // Keyboard handling (ESC to close)
  useEffect(() => {
    if (!isNotificationsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeNotifications();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNotificationsOpen, closeNotifications]);

  if (!isNotificationsOpen) return null;

  return createPortal(
    <>
      {/* Backdrop - Same pattern as GlobalSearchModal */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={closeNotifications}
        onTouchMove={(e) => e.preventDefault()}
        onWheel={(e) => e.preventDefault()}
      />
      
      {/* Modal Content - Responsive Design */}
      <div className={cn(
        "fixed z-50 bg-background shadow-2xl border overscroll-contain",
        isDesktop
          ? // Desktop: Left sidebar (384px = w-96)
            "left-0 top-0 bottom-0 w-96 rounded-r-2xl animate-in slide-in-from-left-5 fade-in-0 duration-300"
          : // Mobile: Bottom drawer
            "left-0 right-0 bottom-0 max-h-[80vh] rounded-t-2xl animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Bell size={18} />
              </div>
              <h2 className="text-lg font-semibold">What&apos;s New</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeNotifications}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
              aria-label="Close notifications"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Placeholder content - will be replaced with actual WhatsNewContent */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications Modal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  🎉 Modal is working! This will be replaced with the actual What&apos;s New content in Step 3.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Test Notification 1</p>
                    <p className="text-xs text-muted-foreground">This is a placeholder notification</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Test Notification 2</p>
                    <p className="text-xs text-muted-foreground">Another placeholder notification</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  {isDesktop ? '🖥️ Desktop sidebar mode' : '📱 Mobile drawer mode'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}