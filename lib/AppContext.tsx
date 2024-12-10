import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from './supabase';
import type { Task } from './supabase';

interface AppContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  profileId: string | null;
  setProfileId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedBestPractices: string[];
  setSelectedBestPractices: React.Dispatch<React.SetStateAction<string[]>>;
  fetchTasks: (id: string) => Promise<void>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  showSwitchProfileDialog: boolean;
  setShowSwitchProfileDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [selectedBestPractices, setSelectedBestPractices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showSwitchProfileDialog, setShowSwitchProfileDialog] = useState(false);

  const fetchTasks = useCallback(async (id: string) => {
    if (!id) {
      console.error('Profile ID is null or invalid.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching tasks for profile:', id);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('profile_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched tasks:', data);
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
        selectedBestPractices,
        setSelectedBestPractices,
        fetchTasks,
        activeTab,
        setActiveTab,
        showSwitchProfileDialog,
        setShowSwitchProfileDialog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
