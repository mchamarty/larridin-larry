'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2, CheckCircle, Loader2, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskEmailDialog } from './TaskEmailDialog';
import { EditTaskDialog } from './EditTaskDialog';
import { Badge } from '@/components/ui/badge';
import { Task } from '@/lib/supabase';
import { useAppContext } from '@/lib/AppContext';
import { useToast } from "@/components/ui/use-toast";

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
    profileId,
    callClaudeAPI,
    setError,
  } = useAppContext();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleComplete = async (taskId: string): Promise<void> => {
    try {
      const response = await callClaudeAPI('complete-task', { taskId });
      if (!response.success) throw new Error('Failed to complete task');

      confetti({ particleCount: 100, spread: 70, origin: { x: 0.5, y: 0.6 } });
      setTasks((prev) =>
        prev.map((task) =>
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

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const handleRegenerateTasks = async () => {
    if (!profileId) {
      setError('Profile ID is missing. Please reload the page.');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await callClaudeAPI('regenerate-tasks', { profileId });
      if (!response.success) throw new Error('Failed to regenerate tasks');
      setTasks(response.tasks);
      toast({
        title: "Tasks Regenerated",
        description: "Your tasks have been successfully updated.",
      });
    } catch (error) {
      console.error('Error regenerating tasks:', error);
      setError('Failed to regenerate tasks. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recommended Tasks</h2>
        <Button onClick={handleRegenerateTasks} disabled={isRegenerating}>
          {isRegenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Regenerating...
            </>
          ) : (
            'Regenerate Tasks'
          )}
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center text-gray-600">
          No tasks found. Try regenerating tasks or check back later.
        </div>
      ) : (
        <div className="space-y-6">
          {currentTasks.map((task) => (
            <Card key={task.id} className={`${categoryStyles[task.metadata.category]} p-6`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{task.title}</h3>
                  <p className="text-gray-600">{task.description}</p>
                </div>
                <Badge variant="secondary">
                  {categoryLabels[task.metadata.category]}
                </Badge>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
                  <Share2 className="w-4 h-4 mr-1" /> Share
                </Button>
                {task.status !== 'completed' && (
                  <Button size="sm" variant="default" onClick={() => handleComplete(task.id)}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Complete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center mt-6">
        {Array.from({ length: Math.ceil(tasks.length / tasksPerPage) }).map((_, i) => (
          <Button
            key={i}
            onClick={() => paginate(i + 1)}
            variant={currentPage === i + 1 ? 'default' : 'outline'}
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
          onSave={(updatedTask: Task) => {
            setTasks((prev) =>
              prev.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              )
            );
            toast({
              title: "Task Updated",
              description: "The task has been successfully updated.",
            });
          }}
        />
      )}
    </div>
  );
}
