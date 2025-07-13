/**
 * Embed Top Bar - Complete header for embed interface
 * 
 * Integrates progress bar showing authentication flow progress
 * with user widget showing authenticated user info and disconnect option
 * in one cohesive unit.
 */

import React from 'react';
import { EmbedStep, ProfileData } from '@/types/embed';
import { EmbedUserWidget } from './EmbedUserWidget';

interface EmbedTopBarProps {
  currentStep: EmbedStep;
  profileData: ProfileData | null;
  onDisconnect: () => void;
}

// Define user-facing steps only (internal steps like loading, session-check are hidden)
const USER_FACING_STEPS: { step: EmbedStep; label: string; description: string }[] = [
  { step: 'authentication', label: 'Connect', description: 'Choose authentication method...' },
  { step: 'profile-preview', label: 'Profile', description: 'Confirming identity...' },
  { step: 'signature-verification', label: 'Verify', description: 'Signing message...' },
  { step: 'community-selection', label: 'Community', description: 'Selecting community...' },
  { step: 'auth-complete', label: 'Complete', description: 'Authentication complete!' },
];

export function EmbedTopBar({ currentStep, profileData, onDisconnect }: EmbedTopBarProps) {
  // Find current step index in user-facing steps
  const currentStepIndex = USER_FACING_STEPS.findIndex(item => item.step === currentStep);
  const currentStepData = USER_FACING_STEPS[currentStepIndex];
  
  // For internal steps (loading, session-check), show as step 0 (before authentication)
  const isInternalStep = currentStepIndex === -1;
  const displayStepIndex = isInternalStep ? 0 : currentStepIndex + 1;
  const displayStepData = isInternalStep ? 
    { label: 'Loading', description: 'Initializing...' } : 
    currentStepData;
  
  // Calculate progress percentage based on user-facing steps
  const progressPercentage = isInternalStep ? 
    5 : // Show minimal progress for internal steps
    ((currentStepIndex + 1) / USER_FACING_STEPS.length) * 100;

  return (
    <div className="embed-top-bar px-4 py-3">
      {/* Integrated Progress Bar and User Widget */}
      <div className="flex items-center justify-between gap-4">
        {/* Progress Section (takes up most of the space) */}
        <div className="flex-1 min-w-0">
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="h-2 embed-progress-track rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {/* Step Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-sm embed-text-primary">
                {displayStepData?.label || 'Unknown'}
              </div>
              <div className="text-xs embed-text-secondary">
                {displayStepData?.description || ''}
              </div>
            </div>
            
            <div className="text-xs embed-text-secondary">
              Step {displayStepIndex} of {USER_FACING_STEPS.length}
            </div>
          </div>
        </div>
        
        {/* User Widget (shown when authenticated) */}
        {profileData && (
          <div className="flex-shrink-0">
            <EmbedUserWidget 
              profileData={profileData} 
              onDisconnect={onDisconnect} 
            />
          </div>
        )}
      </div>
    </div>
  );
} 