'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { Task } from '@/lib/supabase';

interface TaskEmailDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEmailDialog({ task, open, onOpenChange }: TaskEmailDialogProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const shareableText = task.metadata.shareable_text || 
    `Task: ${task.title}

Description: ${task.description}

Strategic Importance: ${task.metadata.strategic_importance}

Expected Outcome: ${task.metadata.expected_outcome}

Estimated Time: ${task.metadata.time_estimate}

Category: ${task.metadata.category}

This task is crucial for our team's success. By completing it, we can expect to see significant improvements in our ${task.metadata.category} efforts. The strategic importance of this task lies in ${task.metadata.strategic_importance}, which aligns with our overall goals.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Task</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <Textarea
            value={shareableText}
            readOnly
            className="h-[200px] resize-none"
          />
          <div className="flex justify-end">
            <Button onClick={copyToClipboard} className="w-full sm:w-auto">
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

