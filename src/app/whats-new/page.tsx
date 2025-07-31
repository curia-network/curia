'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, ArrowLeft, Info } from 'lucide-react';
import { buildHomeUrl } from '@/utils/urlBuilder';

/**
 * What's New Page - Redirect Notice
 * 
 * This page now redirects users to the new modal-based notification system.
 * The What's New functionality is now exclusively available via the host service
 * notifications button, providing a better integrated experience.
 */
export default function WhatsNewRedirectPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Auto-redirect to home after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(buildHomeUrl());
    }, 5000); // 5 second delay to let users read the message

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(buildHomeUrl())}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </div>

        {/* Notice Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl">What&apos;s New Has Moved!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="flex items-start gap-3 text-left bg-white/50 dark:bg-slate-900/30 p-4 rounded-lg border">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  The What&apos;s New feature is now available as a notification panel!
                </p>
                <p className="text-sm text-muted-foreground">
                  Look for the <strong>notifications button</strong> in your host service interface. 
                  It provides a streamlined, modal-based experience for viewing your activity updates.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This page will automatically redirect to your home feed in a few seconds.
              </p>
              
              <Button 
                onClick={() => router.push(buildHomeUrl())}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Go to Home Now
              </Button>
            </div>

            {user && (
              <div className="text-xs text-muted-foreground mt-6 pt-4 border-t">
                Welcome back, <span className="font-medium">{user.name}</span>! 
                Use the host service notifications to stay updated.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Help */}
        <Card className="border-muted">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">Need Help Finding Notifications?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Look for a bell icon or &quot;notifications&quot; button in your host service</li>
              <li>• The notifications panel shows all your activity in a clean, organized view</li>
              <li>• You can filter by community and toggle between new and all activities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}