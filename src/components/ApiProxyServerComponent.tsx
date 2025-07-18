'use client';

import React, { useEffect } from 'react';
import { ApiProxyServer } from '@curia_/iframe-api-proxy';

/**
 * API Proxy Server Component
 * 
 * Initializes the API proxy server to handle PostMessage requests from the parent window
 * and make actual API calls to the host service to bypass CSP restrictions.
 * 
 * CRITICAL: This component must be initialized BEFORE any cglib authentication or
 * community context requests are made.
 */
export const ApiProxyServerComponent: React.FC = () => {
  useEffect(() => {
    // Initialize API proxy server when forum loads
    const proxyServer = new ApiProxyServer({
      baseUrl: process.env.NEXT_PUBLIC_HOST_SERVICE_URL || 'https://curia.network',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Security Configuration:
      // Empty array = allow all origins (current setting for maximum compatibility)
      // 
      // To restrict origins for production security, replace with specific domains:
      // allowedOrigins: [
      //   'https://customer1.com',
      //   'https://customer2.com', 
      //   'https://app.commonground.xyz'
      // ]
      allowedOrigins: [],
    });

    // Cleanup on unmount
    return () => {
      proxyServer.destroy();
    };
  }, []);

  // This is a background component that doesn't render anything
  return null;
};

export default ApiProxyServerComponent; 