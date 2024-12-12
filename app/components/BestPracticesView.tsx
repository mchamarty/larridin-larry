'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
import { useToast } from "@/components/ui/use-toast";
import { applyBestPractices } from '@/lib/tasks';

const bestPracticesSources = [
  { 
    id: 'hbr', 
    label: 'Harvard Business Review',
    summary: 'Incorporate research-backed management practices and leadership strategies from leading business scholars and practitioners.'
  },
  { 
    id: 'mckinsey', 
    label: 'McKinsey & Company',
    summary: 'Apply proven consulting frameworks and organizational transformation approaches from top management consultants.'
  },
  { 
    id: 'forbes', 
    label: 'Forbes',
    summary: 'Learn from real-world business leaders and entrepreneurs sharing their experiences and success strategies.'
  },
  { 
    id: 'mit', 
    label: 'MIT Sloan Management Review',
    summary: 'Leverage cutting-edge management research and innovative business practices from leading academics.'
  },
  {
    id: 'deloitte',
    label: 'Deloitte Insights',
    summary: 'Access industry-specific insights and strategic recommendations from one of the world\'s leading professional services firms.'
  },
];

export function BestPracticesView() {
  const {
    profileId,
    selectedBestPractices,
    setSelectedBestPractices,
    setTasks,
    loading,
    setLoading,
    error,
    setError,
  } = useAppContext();
  const { toast } = useToast();

  const [progress, setProgress] = useState(0);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isRegenerating, setIsRegenerating] = useState(false); // Added state variable

  useEffect(() => {
    const fetchSelectedSources = async () => {
      if (!profileId) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('best_practices_source')
          .eq('id', profileId)
          .single();

        if (error) throw error;

        if (data?.best_practices_source) {
          const sources = data.best_practices_source.split(',');
          setSelectedBestPractices(sources);
          setShowApplyButton(sources.length > 0);
        }
      } catch (err) {
        console.error('Error fetching selected sources:', err);
        toast({
          title: "Error",
          description: "Failed to fetch selected best practices. Please try again.",
          variant: "destructive"
        });
      }
    };

    fetchSelectedSources();
  }, [profileId, setSelectedBestPractices, toast]);

  const handleSourceToggle = useCallback((sourceId: string) => {
    setSelectedBestPractices(prev => {
      const newSources = prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId];
      setShowApplyButton(newSources.length > 0);
      return newSources;
    });
  }, [setSelectedBestPractices]);

  const toggleSummary = useCallback((sourceId: string) => {
    setExpandedSummaries(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  }, []);

  const handleRegenerateTasks = useCallback(async () => {
    if (!profileId) return;
    
    setProgress(0);
    setCurrentStep('Preparing to generate new tasks');
    try {
      setProgress(20);
      setCurrentStep('Analyzing selected best practices');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(40);
      
      setCurrentStep('Generating new tasks');
      const response = await fetch('/api/tasks/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, bestPractices: selectedBestPractices }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate new tasks');
      }

      const newTasks = await response.json();
      if (Array.isArray(newTasks)) {
        setTasks(prevTasks => [...prevTasks, ...newTasks]);

        setProgress(60);
        setCurrentStep('Applying best practices to tasks');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(80);
        setCurrentStep('Finalizing task recommendations');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProgress(100);
        setCurrentStep('New tasks generated successfully');
        
        toast({
          title: "New Tasks Generated",
          description: `${newTasks.length} new tasks have been added based on the selected best practices.`,
        });
      } else {
        console.error('Received non-array response:', newTasks);
        throw new Error('Invalid response format for new tasks');
      }
    } catch (err) {
      console.error('Error generating new tasks:', err);
      setError('Failed to generate new tasks. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate new tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
      setProgress(0);
      setCurrentStep(null);
    }
  }, [profileId, selectedBestPractices, setError, setTasks, toast]);


  const handleApply = useCallback(async () => {
    if (!profileId) {
      toast({
        title: "Error",
        description: "Profile ID is missing. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Initializing');
    setIsComplete(false);
    setIsRegenerating(true);

    try {
      setProgress(25);
      setCurrentStep('Updating profile with selected sources');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ best_practices_source: selectedBestPractices.join(',') })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setProgress(50);
      setCurrentStep('Applying best practices and generating new tasks');
      const newTasks = await applyBestPractices(profileId, selectedBestPractices);
      setTasks(prevTasks => [...newTasks, ...prevTasks]);

      setProgress(100);
      setCurrentStep('Best practices applied successfully');
      setIsComplete(true);
      setCountdown(3);
      toast({
        title: "Best Practices Applied",
        description: `${newTasks.length} new tasks have been created based on the selected best practices.`,
      });
    } catch (err) {
      console.error('Error applying best practices:', err);
      setError('Failed to apply best practices. Please try again.');
      toast({
        title: "Error",
        description: "Failed to apply best practices. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setIsRegenerating(false);
      setProgress(0);
      setCurrentStep(null);
    }
  }, [profileId, selectedBestPractices, setTasks, toast]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (isComplete) {
      timer = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            if (timer) clearInterval(timer);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isComplete]);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Harness Best Practices</h2>
      <p className="mb-6">Select one or more sources of best practices to incorporate into your task recommendations:</p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

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
              <Label
                htmlFor={source.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {source.label}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSummary(source.id)}
              >
                {expandedSummaries.includes(source.id) ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            {expandedSummaries.includes(source.id) && (
              <div className="ml-6 text-sm text-gray-600">
                {source.summary}
              </div>
            )}
          </div>
        ))}
      </div>

      {(loading || progress > 0) && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{currentStep || 'Updating best practices...'}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentStep && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{currentStep}</span>
            </div>
          )}
        </div>
      )}

      {showApplyButton && !loading && (
        <Button
          onClick={() => setShowConfirmDialog(true)}
          className="mt-6"
          disabled={loading || selectedBestPractices.length === 0}
        >
          Apply Best Practices
        </Button>
      )}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply Best Practices</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to apply the selected best practices? This will regenerate your tasks based on the chosen sources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply}>Apply</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

