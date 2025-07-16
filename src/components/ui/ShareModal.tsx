import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Copy, Share2, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  postTitle: string;
  isGenerating?: boolean;
  isWebShareFallback?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  postTitle,
  isGenerating = false,
  isWebShareFallback = false,
  hasError = false,
  errorMessage = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  // Auto-select the URL when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.select();
        inputRef.current?.focus();
      }, 100);
    }
    // Reset copied state when modal opens
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Handle manual copy attempt with feedback
  const handleCopyClick = async () => {
    if (inputRef.current) {
      try {
        // First try to select text
        inputRef.current.select();
        inputRef.current.setSelectionRange(0, shareUrl.length);
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(shareUrl);
          console.log('[ShareModal] URL copied via Clipboard API');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          // Fallback to execCommand
          const success = document.execCommand('copy');
          if (success) {
            console.log('[ShareModal] URL copied via execCommand');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            console.log('[ShareModal] Copy failed, but text is selected for manual copy');
          }
        }
      } catch {
        console.log('[ShareModal] Copy not available, but text is selected for manual copy');
        // The text is still selected, so user can manually copy with Ctrl+C
      }
    }
  };

  // Handle input click to select all
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4 max-w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={20} />
            Share Post
          </DialogTitle>
          <DialogDescription>
            Share this discussion: <span className="font-medium">&ldquo;{postTitle}&rdquo;</span>
          </DialogDescription>
          {isWebShareFallback && (
            <div className="text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded-md border border-amber-200 dark:border-amber-800 mt-2">
              <strong>📱 Mobile Share Note:</strong> Direct sharing isn&apos;t available in this context. Copy the link below to share manually.
            </div>
          )}
          {hasError && (
            <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800 mt-2">
              <strong>⚠️ Configuration Required:</strong> {errorMessage || 'The admin of this community has to enable link sharing in the Community Settings by configuring the Community Hosting URL.'}
            </div>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-url" className="text-sm font-medium">
              Shareable Link
            </Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                ref={inputRef}
                value={isGenerating ? '' : (hasError ? '' : shareUrl)}
                readOnly
                onClick={!hasError ? handleInputClick : undefined}
                className="font-mono text-sm"
                placeholder={isGenerating ? "Generating share link..." : (hasError ? "Share URL unavailable" : "Share URL")}
                disabled={hasError}
              />
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopyClick}
                className="px-3 min-w-[80px]"
                title={copied ? "Copied!" : "Copy to clipboard"}
                disabled={hasError || isGenerating}
              >
                {copied ? (
                  <>
                    <Check size={16} className="mr-1" />
                    Copied
                  </>
                ) : (
                  <Copy size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 