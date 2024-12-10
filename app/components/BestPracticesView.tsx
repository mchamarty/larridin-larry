'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAppContext } from '@/lib/AppContext';
import { useToast } from '@/components/ui/use-toast';

const bestPracticesSources = [
  {
    id: 'hbr',
    label: 'Harvard Business Review',
    summary:
      'Incorporate research-backed management practices and leadership strategies from leading business scholars and practitioners.',
  },
  {
    id: 'mckinsey',
    label: 'McKinsey & Company',
    summary:
      'Apply proven consulting frameworks and organizational transformation approaches from top management consultants.',
  },
  {
    id: 'forbes',
    label: 'Forbes',
    summary:
      'Learn from real-world business leaders and entrepreneurs sharing their experiences and success strategies.',
  },
  {
    id: 'mit',
    label: 'MIT Sloan Management Review',
    summary:
      'Leverage cutting-edge management research and innovative business practices from leading academics.',
  },
];

export const BestPracticesView: React.FC = () => {
  const {
    profileId,
    selectedBestPractices,
    setSelectedBestPractices,
    setTasks,
    loading,
    setLoading,
    setError,
  } = useAppContext();
  const { toast } = useToast();

  const [progress, setProgress] = useState(0);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);

  useEffect(() => {
    setShowApplyButton(selectedBestPractices.length > 0);
  }, [selectedBestPractices]);

  const handleSourceToggle = useCallback(
    (sourceId: string) => {
      setSelectedBestPractices((prev) =>
        prev.includes(sourceId)
          ? prev.filter((id) => id !== sourceId)
          : [...prev, sourceId]
      );
    },
    [setSelectedBestPractices]
  );

  const toggleSummary = useCallback((sourceId: string) => {
    setExpandedSummaries((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    );
  }, []);

  const regenerateTasks = useCallback(async () => {
    if (!profileId) return;

    setProgress(20);
    setCurrentStep('Analyzing selected best practices');
    try {
      const response = await fetch('/api/tasks/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, bestPractices: selectedBestPractices }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate tasks');
      }

      const regeneratedTasks = await response.json();
      setTasks((prev) => [...prev, ...regeneratedTasks]);

      setProgress(100);
      setCurrentStep('Best practices applied successfully!');
      toast({
        title: 'Best Practices Applied',
        description: 'Your tasks have been successfully updated.',
      });
    } catch (err) {
      console.error('Error regenerating tasks:', err);
      setError('Failed to regenerate tasks. Please try again.');
    } finally {
      setCurrentStep(null);
    }
  }, [profileId, selectedBestPractices, setTasks, setError, toast]);

  const handleApply = useCallback(async () => {
    if (!profileId) return;

    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Updating Profile');

    try {
      const response = await fetch('/api/update-best-practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, selectedBestPractices }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile with best practices');
      }

      await regenerateTasks();
    } catch (err) {
      console.error('Error applying best practices:', err);
      setError('Failed to apply best practices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profileId, selectedBestPractices, regenerateTasks, setLoading, setError]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Harness Best Practices</h2>
      <p className="mb-6">
        Select one or more sources of best practices to incorporate into your task recommendations:
      </p>

      <div className="space-y-6">
        {bestPracticesSources.map((source) => (
          <div key={source.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={source.id}
                checked={selectedBestPractices.includes(source.id)}
                onCheckedChange={() => handleSourceToggle(source.id)}
                disabled={loading}
              />
              <Label htmlFor={source.id}>{source.label}</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSummary(source.id)}
              >
                {expandedSummaries.includes(source.id) ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            {expandedSummaries.includes(source.id) && (
              <p className="ml-6 text-sm">{source.summary}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        {showApplyButton && (
          <Button onClick={() => setShowConfirmDialog(true)} disabled={loading}>
            Apply Best Practices
          </Button>
        )}

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apply Best Practices</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to regenerate tasks based on these selections?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleApply}>Apply</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {progress > 0 && (
        <div className="mt-4">
          <Progress value={progress} />
          <p>{currentStep}</p>
        </div>
      )}
    </Card>
  );
};
