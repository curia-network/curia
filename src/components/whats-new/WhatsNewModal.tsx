'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWhatsNew } from '@/contexts/WhatsNewContext';
import { cn } from '@/lib/utils';
import { WhatsNewContent } from './WhatsNewContent';
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

  // Body scroll lock and focus management when modal is open
  useEffect(() => {
    if (isNotificationsOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      // Lock scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal container for screen readers
      const modalContainer = document.querySelector('[role="dialog"]');
      if (modalContainer instanceof HTMLElement) {
        modalContainer.focus();
      }
      
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
      <div 
        className={cn(
          "fixed z-50 bg-background shadow-2xl border overscroll-contain flex flex-col focus:outline-none",
          isDesktop
            ? // Desktop: Left sidebar (384px = w-96)
              "left-0 top-0 bottom-0 w-96 rounded-r-2xl animate-in slide-in-from-left-5 fade-in-0 duration-300"
            : // Mobile: Bottom drawer
              "left-0 right-0 bottom-0 max-h-[80vh] rounded-t-2xl animate-in slide-in-from-bottom-4 fade-in-0 duration-300"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-primary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Bell size={18} />
              </div>
              <h2 id="whats-new-title" className="text-lg font-semibold">What&apos;s New</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeNotifications}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
              aria-label="Close notifications"
            >
              <X size={16} />
              <span className="sr-only">Close notifications</span>
            </Button>
          </div>
        </div>

        {/* Content Area - Full height with WhatsNewContent managing its own layout */}
        <div className="flex-1 overflow-hidden">
          <WhatsNewContent />
        </div>
      </div>
    </>,
    document.body
  );
}