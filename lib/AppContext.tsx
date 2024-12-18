'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  is_new: boolean;
  profile_id: string;
  metadata: {
    category: 'strategic' | 'operational' | 'relational' | 'growth';
    importance: 'high' | 'medium' | 'low';
    estimated_time: 'short' | 'medium' | 'long';
    expected_outcome: string;
    strategic_importance: string;
    action_steps: string;
    key_metrics: string;
    resources_needed: string;
    shareable_text: string;
    best_practice_source?: string;
  };
}

export interface TasksResponse {
  tasks: Task[];
  count: number;
}

interface AppContextType {
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  tasksLoading: boolean;
  setTasksLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  profileId: string | null;
  setProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  showSwitchProfileDialog: boolean;
  setShowSwitchProfileDialog: React.Dispatch<React.SetStateAction<boolean>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  fetchTasks: (profileId: string, page?: number, pageSize?: number) => Promise<TasksResponse | undefined>;
  generateTasks: (profileId: string) => Promise<TasksResponse>;
  linkedInUrl: string;
  setLinkedInUrl: React.Dispatch<React.SetStateAction<string>>;
  fetchInsights: (profileId: string) => Promise<void>;
  appendTasks: (newTasks: Task[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showSwitchProfileDialog, setShowSwitchProfileDialog] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [linkedInUrl, setLinkedInUrl] = useState<string>('');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchTasks = useCallback(
    async (profileId: string, page = 1, pageSize = 10): Promise<TasksResponse | undefined> => {
      if (!profileId) {
        console.warn('fetchTasks called with no profileId');
        return undefined;
      }

      setTasksLoading(true);
      setError(null);

      try {
        const url = `${baseUrl}/api/fetch-tasks?profileId=${profileId}&page=${page}&pageSize=${pageSize}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch tasks');
        }

        const data: TasksResponse = await response.json();
        setTasks((prevTasks) => 
          page === 1 ? data.tasks : [...prevTasks, ...data.tasks]
        );
        return data;
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setError('Failed to load tasks. Please try again.');
        return undefined;
      } finally {
        setTasksLoading(false);
      }
    },
    [baseUrl]
  );

  const generateTasks = useCallback(
    async (profileId: string): Promise<TasksResponse> => {
      if (!profileId) {
        console.warn('generateTasks called with no profileId');
        return { tasks: [], count: 0 };
      }
  
      setTasksLoading(true);
      setError(null);
  
      try {
        const response = await fetch(`${baseUrl}/api/generate-tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Failed to generate tasks');
        }
  
        const data: TasksResponse = await response.json();
        
        // Ensure we have valid tasks before updating state
        if (data.tasks && Array.isArray(data.tasks)) {
          setTasks(prevTasks => [
            ...data.tasks.map(task => ({
              ...task,
              is_new: true
            })),
            ...prevTasks
          ]);
        }
  
        return data;
      } catch (error) {
        console.error('Error generating tasks:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate tasks');
        return { tasks: [], count: 0 };
      } finally {
        setTasksLoading(false);
      }
    },
    [baseUrl]
  );

  const fetchInsights = useCallback(
    async (profileId: string) => {
      if (!profileId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/api/insights?profileId=${profileId}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch insights');
        }
        const data = await response.json();
        console.log('Fetched insights:', data);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setError('Failed to load insights. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [baseUrl]
  );

  const appendTasks = useCallback((newTasks: Task[]) => {
    setTasks(prevTasks => [...prevTasks, ...newTasks]);
  }, []);

  const value: AppContextType = {
    loading,
    setLoading,
    tasksLoading,
    setTasksLoading,
    error,
    setError,
    profileId,
    setProfileId,
    activeTab,
    setActiveTab,
    showSwitchProfileDialog,
    setShowSwitchProfileDialog,
    tasks,
    setTasks,
    fetchTasks,
    generateTasks,
    linkedInUrl,
    setLinkedInUrl,
    fetchInsights,
    appendTasks,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;

};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

