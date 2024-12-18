'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, CheckCircle, Loader2, Sparkles, Clock, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskEmailDialog } from './TaskEmailDialog';
import { Badge } from '@/components/ui/badge';
import { useAppContext, Task } from '@/lib/AppContext';
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase';

// interface TasksResponse { //Removed this line
//   tasks: Task[];
//   count: number;
// }

interface TasksResponse {
  tasks: Task[];
  count: number;
}

const categoryStyles: Record<string, string> = {
  strategic: 'border-l-purple-400 bg-purple-50/30',
  operational: 'border-l-blue-400 bg-blue-50/30',
  relational: 'border-l-green-400 bg-green-50/30',
  growth: 'border-l-orange-400 bg-orange-50/30',
};

const categoryLabels: Record<string, string> = {
  strategic: 'Strategic',
  operational: 'Operational',
  relational: 'Relational',
  growth: 'Growth',
};

const timeEstimates: Record<string, string> = {
  short: '1-2 hours',
  medium: '3-5 hours',
  long: '5+ hours'
};

export function TasksView() {
  const { 
    profileId, 
    setError, 
    tasks,
    setTasks,
    tasksLoading,
    fetchTasks,
    generateTasks
  } = useAppContext();
  const { toast } = useToast()

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [taskGenerationProgress, setTaskGenerationProgress] = useState(0);

  const pageSize = 10;

  useEffect(() => {
    if (profileId) {
      setLoading(true);
      fetchTasks(profileId).then((response: TasksResponse | undefined) => {
        if (response && response.tasks) {
          setTasks(response.tasks);
          setHasMore(response.count > response.tasks.length);
        }
        setLoading(false);
      });
    }
  }, [profileId, fetchTasks, setTasks]);

  const handleComplete = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'completed' as const }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x: 0.5, y: 0.6 },
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: 'completed' } : task
        )
      );
      toast({
        title: "Task Completed",
        description: "Great job! The task has been marked as complete.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      setError('Failed to complete task. Please try again.');
    }
  };

  const handleShare = (task: Task) => {
    setSelectedTask(task);
    setEmailOpen(true);
  };

  const loadMoreTasks = useCallback(async () => {
    if (!profileId) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const response = await fetchTasks(profileId);
    if (response && response.tasks) {
      setTasks(prevTasks => [...prevTasks, ...response.tasks]);
      setPage(nextPage);
      setHasMore(response.count > (tasks.length + response.tasks.length));
    }
    setLoadingMore(false);
  }, [page, fetchTasks, profileId, setTasks, tasks.length]);

  const handleGenerateMoreTasks = async () => {
    if (!profileId || generatingTasks) return;

    setGeneratingTasks(true);
    setTaskGenerationProgress(0);
    try {
      // Fetch answers from the insights table
      const { data: answers, error } = await supabase
        .from('insights')
        .select('question_id, answer')
        .eq('profile_id', profileId);

      if (error) throw error;

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setTaskGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/process-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, answers }),
      });

      clearInterval(progressInterval);
      setTaskGenerationProgress(100);

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const { tasks: newTasks } = await response.json();

      setTasks(prevTasks => {
        const updatedTasks = [...newTasks, ...prevTasks];
        return updatedTasks.map(task => ({
          ...task,
          is_new: newTasks.some((newTask: Task) => newTask.id === task.id)
        }));
      });

      toast({
        title: "Tasks Generated",
        description: `${newTasks.length} new tasks have been generated successfully.`,
      });
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        title: "Error",
        description: "Failed to generate new tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTasks(false);
      setTaskGenerationProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
        <p className="text-lg font-medium text-gray-700">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-xl font-medium text-gray-700">No tasks available.</p>
        <p className="text-gray-500 mt-2">Generate some personalized tasks to get started.</p>
        <Button onClick={handleGenerateMoreTasks} disabled={generatingTasks} className="mt-4">
          {generatingTasks ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            'Generate Tasks'
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      {generatingTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Generating Tasks</h3>
            <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${taskGenerationProgress}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Please wait...</p>
          </div>
        </div>
      )}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommended Tasks ({tasks.length})</h2>
        <Button onClick={handleGenerateMoreTasks} disabled={generatingTasks} className="flex items-center gap-2">
          {generatingTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate More Tasks
        </Button>
      </div>
      <div className="space-y-6">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`
              p-6 transition-all duration-200 border-l-4
              ${task.status === 'completed' ? 'bg-green-50 border-green-100' : 'hover:shadow-lg hover:border-blue-100'}
              ${categoryStyles[task.metadata.category]}
              ${task.is_new ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            `}
          >
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold">{task.title}</h3>
                  {task.is_new && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Sparkles className="w-3 h-3 mr-1" />
                      New
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="capitalize">
                  {categoryLabels[task.metadata.category]}
                </Badge>
              </div>

              <p className="text-gray-600">{task.description}</p>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="font-medium text-gray-700 mb-2">Why this task?</h4>
                <p className="text-gray-600 text-sm">{task.metadata.strategic_importance}</p>
              </div>

              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{timeEstimates[task.metadata.estimated_time] || task.metadata.estimated_time}</span>
                </div>
                <div>
                  <span className="font-medium">Expected outcome:</span>
                  <span className="ml-2">{task.metadata.expected_outcome}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(task)}
                  className="flex items-center space-x-1"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
                {task.status !== 'completed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleComplete(task.id)}
                    className="flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Complete</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button 
            onClick={loadMoreTasks} 
            variant="outline" 
            className="w-full max-w-sm"
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Tasks'
            )}
          </Button>
        </div>
      )}
      {selectedTask && (
        <TaskEmailDialog
          task={selectedTask}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
    </>
  );
}

