import { createClient } from '@supabase/supabase-js';

// Ensure environment variables are properly set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Define the Profile type
export type Profile = {
  id: string;
  linkedin_url: string;
  linkedin_data: Record<string, any>;
  created_at: string;
};

// Define the Task type
export type Task = {
  metadata: any;
  id: string;
  profile_id: string;
  title: string; // Added
  description: string;
  due_date: string; // Added
  notes: string; // Added
  expected_outcome: string;
  strategic_importance: string;
  time_estimate: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

// Define the QuestionResponse type
export type QuestionResponse = {
  question: string;
  answer: string;
};

// Supabase client instance
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fetch tasks for a specific profile
export const fetchTasks = async (profileId: string): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      throw new Error('Failed to fetch tasks');
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

// Insert a new task
export const insertTask = async (task: Partial<Task>): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .single();

    if (error) {
      console.error('Error inserting task:', error);
      throw new Error('Failed to insert task');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

// Update an existing task
export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }

    return data;
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    throw error;
  }
};
