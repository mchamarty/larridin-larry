'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { Task } from '@/lib/AppContext';
import { useToast } from '@/components/ui/use-toast';

interface TaskEmailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getShareableText = (task: Task) => {
  return task.metadata.shareable_text || `Task: ${task.title}

Description: ${task.description}

Importance: ${task.metadata?.importance || 'N/A'}
Estimated Time: ${task.metadata?.estimated_time || 'N/A'}
Category: ${task.metadata?.category || 'N/A'}

This task is crucial for our team's success. By completing it, we can expect to see significant improvements in our ${
    task.metadata?.category || 'relevant areas'
  } efforts. The importance of this task is ${
    task.metadata?.importance || 'unspecified'
  }, which aligns with our overall goals.`;
};

export function TaskEmailDialog({ task, open, onOpenChange }: TaskEmailDialogProps) {
  const [copied, setCopied] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const isCopying = useRef(false);
  const { toast } = useToast();

  if (!open) return null;

  const shareableText = getShareableText(task);

  const copyToClipboard = async () => {
    if (isCopying.current) return;

    isCopying.current = true;

    try {
      await navigator.clipboard.writeText(emailContent || shareableText);
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'You can now paste this content into your email.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      const textarea = document.createElement('textarea');
      textarea.value = emailContent || shareableText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);

      try {
        textarea.select();
        document.execCommand('copy');
        setCopied(true);
        toast({
          title: 'Copied to clipboard',
          description: 'You can now paste this content into your email.',
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy method failed:', fallbackError);
        toast({
          title: 'Error',
          description: 'Failed to copy text. Please try selecting and copying manually.',
          variant: 'destructive',
        });
      } finally {
        document.body.removeChild(textarea);
      }
    } finally {
      isCopying.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Share Task</DialogTitle>
          <DialogDescription>
            Share this task with your team or stakeholders
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Textarea
            value={emailContent || shareableText}
            onChange={(e) => setEmailContent(e.target.value)}
            className="h-[300px] resize-none font-mono text-sm"
          />
          <div className="flex">
            <Button
              onClick={copyToClipboard}
              className="w-full"
              aria-live="polite"
              aria-pressed={copied}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}