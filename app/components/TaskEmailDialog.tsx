'use client';

import { useState } from 'react';
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
import { Task } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface TaskEmailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEmailDialog({ task, open, onOpenChange }: TaskEmailDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!task) return null;

  const shareableText = task.email_content || `Task: ${task.title}

Description: ${task.description}

Importance: ${task.metadata.importance}
Estimated Time: ${task.metadata.estimated_time}
Category: ${task.metadata.category}

This task is crucial for our team's success. By completing it, we can expect to see significant improvements in our ${task.metadata.category} efforts. The importance of this task is ${task.metadata.importance}, which aligns with our overall goals.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableText);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'You can now paste this content into your email.',
    });
    setTimeout(() => setCopied(false), 2000);
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
            value={shareableText}
            readOnly
            className="h-[300px] resize-none font-mono text-sm"
          />
          <Button onClick={copyToClipboard} className="w-full">
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
      </DialogContent>
    </Dialog>
  );
}