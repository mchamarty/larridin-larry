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

    console.log(`Generating additional tasks for profile ${profileId}`);

    // Generate new tasks without IDs
    const newTasks = await generateTasks(profileId, bestPractices);
    
    // Remove any existing IDs to let Supabase generate new ones
    const tasksForInsertion = newTasks.map(({ id, ...task }) => task);

    // Insert tasks and let Supabase generate new IDs
    const { data: savedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksForInsertion)
      .select();

    if (insertError) {
      console.error('Error inserting new tasks:', insertError);
      return NextResponse.json(
        { error: 'Failed to save new tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: savedTasks
    });
  } catch (error) {
    console.error('Error regenerating tasks:', error);
    return NextResponse.json(
      {
        error: 'Failed to regenerate tasks',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}