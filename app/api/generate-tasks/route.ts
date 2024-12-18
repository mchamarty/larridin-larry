import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateTasks } from '@/lib/tasks';

interface Task {
  id?: string;
  title: string;
  profile_id: string;
  [key: string]: any;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    let tasks;
    try {
      tasks = await generateTasks(profileId);
    } catch (error) {
      console.error('Task generation error:', error);
      return NextResponse.json(
        { error: 'Failed to generate tasks', details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }

    const tasksForInsert = tasks.map(({ id, ...task }) => ({
      ...task,
      profile_id: profileId
    }));

    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(tasksForInsert)
      .select();

    if (saveError) {
      if (saveError.code === '23505') {
        const { data: retriedSave, error: retryError } = await supabase
          .from('tasks')
          .insert(tasksForInsert)
          .select();
          
        if (retryError) {
          console.error('Retry save error:', retryError);
          throw retryError;
        }
        return NextResponse.json({ success: true, tasks: retriedSave });
      }
      console.error('Save error:', saveError);
      throw saveError;
    }

    if (!savedTasks?.length) {
      return NextResponse.json(
        { error: 'No tasks were saved' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, tasks: savedTasks });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Task generation failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}