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
  linkedin_data: Record<string, any>; // Explicit type for flexibility
  created_at: string;
  best_practices_source?: string;
};

// Define the QuestionResponse type
export type QuestionResponse = {
  id: string;
  profile_id: string;
  question_id: string;
  answer: string;
  created_at: string;
};

// Define the Task type
export type Task = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed' | 'skipped';
  feedback?: string;
  created_at: string;
  due_date?: string;
  metadata: {
    expected_outcome: string;
    strategic_importance: string;
    time_estimate: string;
    category: 'strategic' | 'operational' | 'relational' | 'growth';
    shareable_text: string;
  };
  notes?: string;
  is_new?: boolean;
};

// Define the Insight type
export type Insight = {
  id: string;
  profile_id: string;
  question_id: string;
  answer: string;
  created_at: string;
};

// Define the Question type
export type Question = {
  id: string;
  text: string;
  subtext: string;
  options: string[];
};

// Define the PreGeneratedQuestion type
export type PreGeneratedQuestion = {
  id: string;
  profile_id: string;
  text: string;
  subtext: string;
  options: string[];
};

// Define the Database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'>;
        Update: Partial<Omit<Task, 'id' | 'created_at'>>;
      };
      question_responses: {
        Row: QuestionResponse;
        Insert: Omit<QuestionResponse, 'id' | 'created_at'>;
        Update: Partial<Omit<QuestionResponse, 'id' | 'created_at'>>;
      };
      insights: {
        Row: Insight;
        Insert: Omit<Insight, 'id' | 'created_at'>;
        Update: Partial<Omit<Insight, 'id' | 'created_at'>>;
      };
      questions: {
        Row: Question;
        Insert: Omit<Question, 'id'>;
        Update: Partial<Question>;
      };
      pre_generated_questions: {
        Row: PreGeneratedQuestion;
        Insert: Omit<PreGeneratedQuestion, 'id'>;
        Update: Partial<Omit<PreGeneratedQuestion, 'id'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_questions_table: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Create Supabase client with explicit types for better type safety and optimized configuration
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true  // Changed from false to true
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' }
    },
    db: {
      schema: 'public'
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
);

