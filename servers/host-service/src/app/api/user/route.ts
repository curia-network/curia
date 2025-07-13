/**
 * User API Route - Handles user-related API requests from plugins
 * 
 * This endpoint processes getUserInfo and getUserFriends requests
 * from plugins using the PluginHost service.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PluginHost } from '../../../lib/PluginHost';
import { DatabaseDataProvider } from '../../../lib/DataProvider';

// Initialize the plugin host with data provider
const dataProvider = new DatabaseDataProvider();
const pluginHost = new PluginHost(dataProvider);

export async function POST(request: NextRequest) {
  try {
    // Get request origin for CORS validation
    const origin = request.headers.get('origin') || '';
    
    // Parse the request body
    const body = await request.json();
    
    // Helper function to create CORS-enabled error response
    const createErrorResponse = (error: string, status: number) => {
      const response = NextResponse.json({
        data: null,
        success: false,
        error
      }, { status });
      
      response.headers.set('Access-Control-Allow-Origin', origin || '*');
      response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return response;
    };

    // Validate required fields
    if (!body.method || !body.communityId) {
      return createErrorResponse('Missing required fields: method, communityId', 400);
    }

    // Only handle user-related methods
    if (!['getUserInfo', 'getUserFriends', 'getContextData'].includes(body.method)) {
      return createErrorResponse(`Invalid method for user endpoint: ${body.method}`, 400);
    }

    // Validate origin (for production, check against allowed origins)
    // For development, we'll allow all origins
    if (!pluginHost.validateOrigin(origin)) {
      return createErrorResponse('Unauthorized origin', 403);
    }

    // Process the API request
    const response = await pluginHost.processApiRequest(body);
    
    // Log the request for development
    console.log('[User API] Request processed:', {
      method: body.method,
      communityId: body.communityId,
      userId: body.userId,
      success: response.success
    });

    // Return response with appropriate status code and CORS headers
    const statusCode = response.success ? 200 : 400;
    const jsonResponse = NextResponse.json(response, { status: statusCode });
    
    // Add CORS headers to allow third-party domains
    jsonResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
    jsonResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    jsonResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return jsonResponse;
    
  } catch (error) {
    console.error('[User API] Error processing request:', error);
    
    const errorResponse = NextResponse.json({
      data: null,
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
    
    // Add CORS headers to error responses too
    const origin = request.headers.get('origin') || '';
    errorResponse.headers.set('Access-Control-Allow-Origin', origin || '*');
    errorResponse.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return errorResponse;
  }
}

export async function GET() {
  return NextResponse.json({
    data: null,
    success: false,
    error: 'Method not allowed. Use POST for API requests.'
  }, { status: 405 });
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 