/**
 * Community - Our Forum Experience
 * 
 * This page shows our own community forum using NEXT_PUBLIC_CURIA_COMMUNITY_ID.
 * Users skip community selection and land directly in our forum.
 */

'use client';

import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CommunityPage() {
  const communityId = process.env.NEXT_PUBLIC_CURIA_COMMUNITY_ID;

  useEffect(() => {
    // Load the embed script for our community experience
    const script = document.createElement('script');
    script.src = '/embed.js';
    script.async = true;
    script.setAttribute('data-container', 'curia-community-forum');
    script.setAttribute('data-theme', 'light');
    script.setAttribute('data-width', '100%');
    script.setAttribute('data-height', '100%');
    
    // Use environment variable for community ID
    if (communityId) {
      script.setAttribute('data-community', communityId);
    }
    
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      
      // Clean up global reference
      if (window.curiaEmbed) {
        if (window.curiaEmbed.destroy) {
          window.curiaEmbed.destroy();
        }
        delete window.curiaEmbed;
      }
    };
  }, [communityId]);

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Subtle Top Bar - Hidden on mobile, visible on desktop */}
      <div className="hidden md:flex bg-white border-b border-gray-200 px-4 py-3 items-center shadow-sm flex-shrink-0">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        
        <div className="ml-auto text-sm text-gray-500">
          Our Community
        </div>
      </div>

      {/* Full Screen Embed Container */}
      <div className="flex-1 bg-white min-h-0">
        <div id="curia-community-forum" className="w-full h-full"></div>
      </div>
    </div>
  );
} 