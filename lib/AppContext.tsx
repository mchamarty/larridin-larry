import React, { createContext, useContext, useState, useCallback } from 'react';
import { Task } from './supabase'; // Ensure Task type is correctly imported

// Define AppContextType to include all required properties
interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  profileId: string | null;
  setProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchTasks: (id: string) => Promise<void>;
  callClaudeAPI: (endpoint: string, payload: any) => Promise<any>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  selectedBestPractices: string[];
  setSelectedBestPractices: React.Dispatch<React.SetStateAction<string[]>>;
  showSwitchProfileDialog: boolean;
  setShowSwitchProfileDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedBestPractices, setSelectedBestPractices] = useState<string[]>([]);
  const [showSwitchProfileDialog, setShowSwitchProfileDialog] = useState(false);

  const fetchTasks = useCallback(async (id: string) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/fetch-tasks?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const data = await response.json();
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const callClaudeAPI = async (endpoint: string, payload: any) => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('API call failed');
      return await response.json();
    } catch (error) {
      console.error('Claude API Error:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        setTasks,
        loading,
        setLoading,
        error,
        setError,
        profileId,
        setProfileId,
        fetchTasks,
        callClaudeAPI,
        activeTab,
        setActiveTab,
        selectedBestPractices,
        setSelectedBestPractices,
        showSwitchProfileDialog,
        setShowSwitchProfileDialog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
