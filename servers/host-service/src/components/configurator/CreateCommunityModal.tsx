'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building, Check, X } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic: boolean;
  gradientClass: string;
  icon: string;
  logoUrl: string | null;
  requiresApproval: boolean;
  userRole?: string;
  isMember: boolean;
  createdAt: string;
  communityShortId?: string;
  pluginId?: string;
}

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCommunityCreated: (community: Community) => void;
}

export function CreateCommunityModal({ 
  isOpen, 
  onClose, 
  onCommunityCreated 
}: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [shortId, setShortId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('curia_session_token');
      const response = await fetch('/api/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          community_short_id: shortId,
          is_public: isPublic,
          requires_approval: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create community');
      }

      const newCommunity = await response.json();
      onCommunityCreated(newCommunity);
      
      // Reset form
      setName('');
      setShortId('');
      setIsPublic(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setShortId('');
    setIsPublic(true);
    setError('');
    onClose();
  };

  // Auto-generate short ID from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!shortId) {
      const generatedId = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);
      setShortId(generatedId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Create New Community
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Community Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Community Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Awesome Community"
              required
            />
          </div>

          {/* Short ID */}
          <div className="space-y-2">
            <Label htmlFor="shortId">Community Handle</Label>
            <div className="flex items-center">
              <span className="text-sm text-slate-500 mr-1">@</span>
              <Input
                id="shortId"
                value={shortId}
                onChange={(e) => setShortId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="my-awesome-community"
                required
              />
            </div>
            <p className="text-xs text-slate-500">
              This will be your community's unique identifier. Only letters, numbers, hyphens, and underscores allowed.
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <Label>Visibility</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Public</div>
                  <div className="text-xs text-slate-500">Anyone can discover and join</div>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">Private</div>
                  <div className="text-xs text-slate-500">Only visible to members</div>
                </div>
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name || !shortId}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Community
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 