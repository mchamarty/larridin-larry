import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTasks } from '@/lib/tasks';

console.log('Environment check:', {
  hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
  keyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 5)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('id');

    console.log('Fetching tasks for profile:', profileId);

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID required' }, { status: 400 });
    }

    // Check Supabase first
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // If no tasks exist, try to generate new ones
    if (!tasks || tasks.length === 0) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
      }

      try {
        console.log('Generating new tasks...');
        const newTasks = await generateTasks(profileId);
        return NextResponse.json(newTasks);
      } catch (genError) {
        console.error('Task generation error:', genError);
        return NextResponse.json({ 
          error: genError instanceof Error ? genError.message : 'Task generation failed' 
        }, { status: 500 });
      }
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Server error' 
    }, { status: 500 });
  }
}

