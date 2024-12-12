import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTasks } from '@/lib/tasks';

console.log('Environment check:', {
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 5),
  hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');

    console.log('[fetch-tasks] Request received for profile:', profileId);

    if (!profileId) {
      console.error('[fetch-tasks] Missing profile ID');
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[fetch-tasks] Missing Supabase environment variables');
      return NextResponse.json({ error: 'Database configuration is missing' }, { status: 500 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[fetch-tasks] Missing Anthropic API key');
      return NextResponse.json({ error: 'AI service configuration is missing' }, { status: 500 });
    }

    console.log('[fetch-tasks] Fetching tasks from Supabase');
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[fetch-tasks] Supabase error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch tasks from database' }, { status: 500 });
    }

    if (!tasks || tasks.length === 0) {
      console.log('[fetch-tasks] No existing tasks found, generating new ones');
      try {
        const newTasks = await generateTasks(profileId);
        console.log('[fetch-tasks] Successfully generated new tasks:', newTasks.length);
        return NextResponse.json(newTasks);
      } catch (genError) {
        console.error('[fetch-tasks] Task generation error:', genError);
        return NextResponse.json(
          { error: genError instanceof Error ? genError.message : 'Failed to generate new tasks' },
          { status: 500 }
        );
      }
    }

    console.log('[fetch-tasks] Successfully retrieved tasks:', tasks.length);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('[fetch-tasks] Unexpected error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

