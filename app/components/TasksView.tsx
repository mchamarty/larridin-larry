'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, CheckCircle, Loader2, Sparkles, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskEmailDialog } from './TaskEmailDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/lib/supabase';
import { useAppContext } from '@/lib/AppContext';
import { useToast } from "@/components/ui/use-toast"

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

export function TasksView() {
  const {
    tasks,
    setTasks,
    loading,
    error,
    setError,
    profileId,
  } = useAppContext();
  const { toast } = useToast()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showSuccessMessage]);

  const handleComplete = async (taskId: string): Promise<void> => {
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: 'completed', is_new: false }),
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
          task.id === taskId ? { ...task, status: 'completed', is_new: false } : task
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

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      toast({
        title: "Task Updated",
        description: "The task has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleRegenerateTasks = async () => {
    if (!profileId) return;
    
    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate tasks');
      }

      const regeneratedTasks = await response.json();
      setTasks(regeneratedTasks);
      setShowSuccessMessage(true);
    } catch (err) {
      console.error('Error regenerating tasks:', err);
      setError('Failed to regenerate tasks. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <div className="absolute inset-0 animate-pulse opacity-50" />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium text-gray-700">
            Analyzing your profile and preparing personalized recommendations...
          </p>
          <p className="text-sm text-gray-500">
            This may take a few moments as we process your LinkedIn data
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500" />
          <p className="text-lg text-gray-600">
            Analyzing your profile and preparing personalized recommendations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recommended Tasks</h2>
        <Button onClick={handleRegenerateTasks} disabled={loading || isRegenerating}>
          {isRegenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            'Regenerate Tasks'
          )}
        </Button>
        {showSuccessMessage && (
          <div className="text-green-600 text-sm mt-2">
            Tasks successfully regenerated!
          </div>
        )}
      </div>
      <div className="space-y-6">
        {currentTasks.map((task) => (
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Expected Outcome:</span>
                  <p className="text-gray-600">{task.metadata.expected_outcome}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Strategic Importance:</span>
                  <p className="text-gray-600">{task.metadata.strategic_importance}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time Estimate:</span>
                  <p className="text-gray-600">{task.metadata.time_estimate}</p>
                </div>
              </div>

              {task.notes && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-gray-600">{task.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(task)}
                  className="flex items-center space-x-1"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
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
      <div className="mt-6 flex justify-center">
        {Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }, (_, i) => (
          <Button
            key={i}
            onClick={() => paginate(i + 1)}
            variant={currentPage === i + 1 ? 'default' : 'outline'}
            className="mx-1"
          >
            {i + 1}
          </Button>
        ))}
      </div>
      {selectedTask && (
        <TaskEmailDialog
          task={selectedTask}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveTask}
        />
      )}
    </>
  );
}

