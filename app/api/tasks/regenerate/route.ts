import { NextResponse } from 'next/server';
import { generateTasks } from '@/lib/tasks';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { profileId, bestPractices } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Delete existing tasks for the profile
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('profile_id', profileId);

    if (deleteError) {
      console.error('Error deleting existing tasks:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete existing tasks' },
        { status: 500 }
      );
    }

    // Generate new tasks
    const tasks = await generateTasks(profileId, bestPractices);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error regenerating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate tasks' },
      { status: 500 }
    );
  }
}

