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

// Define the Task type to match your database schema
// Update the Task type metadata
export type Task = {
    is_new: any;
    id: string;
    profile_id: string;
    title: string;
    description: string;
    status: 'pending' | 'completed' | 'skipped';
    metadata: {
      category: 'strategic' | 'operational' | 'relational' | 'growth';
      importance: 'high' | 'medium' | 'low';
      estimated_time: 'short' | 'medium' | 'long';
      expected_outcome: string;
      shareable_text: string;
      strategic_importance: string;
      best_practice_source?: string;
    };
    email_content?: string;
};
  

// Supabase client instance
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Database operations
export const fetchTasks = async (profileId: string): Promise<Task[]> => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
};

export const insertTask = async (task: Partial<Task>): Promise<Task> => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error inserting task:', error);
        throw error;
    }
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating task:', error);
        throw error;
    }
};

export type Question = {
    id: string;
    profile_id: string;
    data: {
        question: string;
        context: string;
        focus_area: string;
        options: string[];
        multiple_answers: boolean;
        correct_answers: number[];
    };
    created_at: string;
};

export const deleteTask = async (taskId: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;
    } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};