'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ExpandedNewPostForm } from '@/components/voting/ExpandedNewPostForm';
import { LockCreationModal } from '@/components/locks/LockCreationModal';
import { ApiPost } from '@/app/api/posts/route';
import { cn } from '@/lib/utils';

interface ModalContainerProps {
  // Post Modal Props
  isPostModalOpen: boolean;
  onPostModalClose: () => void;
  onPostCreated?: (newPost: ApiPost) => void;
  boardId?: string | null;
  initialTitle?: string;
  inline?: boolean; // When true, renders inline instead of as fixed modal
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  isPostModalOpen,
  onPostModalClose,
  onPostCreated,
  boardId,
  initialTitle,
  inline = false
}) => {
  const queryClient = useQueryClient();
  
  // Lock creation modal state
  const [isLockCreationOpen, setIsLockCreationOpen] = useState(false);
  const [selectedLockId, setSelectedLockId] = useState<number | null>(null);

  // Lock body scroll when modal is open (only in full modal mode)
  useEffect(() => {
    if (!inline && isPostModalOpen) {
      // Store original overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow;
      
      // Lock scroll
      document.body.style.overflow = 'hidden';
      
      // Cleanup function to restore scroll
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [inline, isPostModalOpen]);

  // Handle lock creation request from post modal
  const handleCreateLockRequested = useCallback(() => {
    setIsLockCreationOpen(true);
  }, []);

  // Handle successful lock creation
  const handleLockCreated = useCallback((lockId: number) => {
    console.log(`[ModalContainer] Lock created with ID: ${lockId}`);
    
    // Invalidate locks query to refresh the browser
    queryClient.invalidateQueries({ queryKey: ['locks'] });
    
    // Pre-select the newly created lock
    setSelectedLockId(lockId);
    
    // Close lock creation modal (post modal will auto-restore)
    setIsLockCreationOpen(false);
    
    // Optional: Show success feedback
    console.log('[ModalContainer] New lock created and will be pre-selected in post');
  }, [queryClient]);

  // Handle lock creation modal close
  const handleLockModalClose = useCallback(() => {
    setIsLockCreationOpen(false);
  }, []);

  // Don't render anything if post modal isn't open
  if (!isPostModalOpen) {
    return null;
  }

  // Inline mode - render directly without modal wrapper
  if (inline) {
    return (
      <>
        {/* Post Creation Form - inline version */}
        <div
          className={cn(
            'transition-all duration-300 ease-in-out',
            isLockCreationOpen && 'transform scale-95 translate-y-2 opacity-70 blur-sm'
          )}
        >
          <ExpandedNewPostForm
            onPostCreated={onPostCreated}
            onCancel={onPostModalClose}
            boardId={boardId}
            initialTitle={initialTitle}
            onCreateLockRequested={handleCreateLockRequested}
            preSelectedLockId={selectedLockId}
          />
        </div>

        {/* Lock Creation Modal - appears on top */}
        <LockCreationModal
          isOpen={isLockCreationOpen}
          onClose={handleLockModalClose}
          onSave={handleLockCreated}
        />
      </>
    );
  }

  return (
    <>
      {/* Post Creation Modal - with minimization effect */}
      <div
        className={cn(
          'fixed inset-0 z-40 transition-all duration-300 ease-in-out',
          isLockCreationOpen && 'transform scale-95 translate-y-2 opacity-70 blur-sm'
        )}
      >
        {/* Modal Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onPostModalClose}
        />
        
        {/* Modal Content Container */}
        <div 
          className="fixed inset-0 overflow-y-auto overscroll-contain"
          onTouchMove={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ExpandedNewPostForm
                onPostCreated={onPostCreated}
                onCancel={onPostModalClose}
                boardId={boardId}
                initialTitle={initialTitle}
                onCreateLockRequested={handleCreateLockRequested}
                preSelectedLockId={selectedLockId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lock Creation Modal - appears on top */}
      <LockCreationModal
        isOpen={isLockCreationOpen}
        onClose={handleLockModalClose}
        onSave={handleLockCreated}
      />
    </>
  );
}; 