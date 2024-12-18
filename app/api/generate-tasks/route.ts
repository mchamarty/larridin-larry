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

    console.log('Generating tasks for profile:', profileId);
    let tasks;
    try {
      tasks = await generateTasks(profileId);
      console.log('Generated tasks:', tasks);
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
    console.log('Tasks prepared for insert:', tasksForInsert);

    let savedTasks;
    try {
      const { data, error: saveError } = await supabase
        .from('tasks')
        .insert(tasksForInsert)
        .select();

      if (saveError) {
        console.error('Initial save error:', saveError);
        if (saveError.code === '23505') {
          console.log('Attempting retry save due to conflict...');
          const { data: retriedData, error: retryError } = await supabase
            .from('tasks')
            .insert(tasksForInsert)
            .select();
            
          if (retryError) {
            console.error('Retry save error:', retryError);
            throw retryError;
          }
          savedTasks = retriedData;
        } else {
          throw saveError;
        }
      } else {
        savedTasks = data;
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to save tasks', 
          details: dbError instanceof Error ? dbError.message : String(dbError),
          attempted: tasksForInsert
        },
        { status: 500 }
      );
    }

    if (!savedTasks?.length) {
      console.error('No tasks saved, tasks attempted:', tasksForInsert);
      return NextResponse.json(
        { 
          error: 'No tasks were saved',
          details: tasksForInsert 
        },
        { status: 500 }
      );
    }

    console.log('Successfully saved tasks:', savedTasks);
    return NextResponse.json({ 
      success: true, 
      tasks: savedTasks,
      count: savedTasks.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Task generation failed', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}