import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateTasks } from '@/lib/tasks';

export const dynamic = 'force-dynamic';

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

    // Fetch answers for the user
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .eq('profile_id', profileId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      throw answersError;
    }

    // Generate tasks based on answers
    const tasks = await generateTasks(profileId, answers);

    // Remove IDs from tasks before insertion
    const tasksWithoutIds = tasks.map(({ id, ...task }) => ({
      ...task,
      profile_id: profileId,
      created_at: new Date().toISOString()
    }));

    // Save generated tasks
    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(tasksWithoutIds)
      .select();

    if (saveError) {
      console.error('Error saving tasks:', saveError);
      
      // If it's a unique constraint error, try one more time
      if (saveError.code === '23505') {
        const { data: retriedSave, error: retryError } = await supabase
          .from('tasks')
          .insert(tasksWithoutIds)
          .select();
          
        if (retryError) {
          console.error('Error on retry:', retryError);
          throw retryError;
        }
        
        return NextResponse.json({ success: true, tasks: retriedSave });
      }
      
      throw saveError;
    }

    return NextResponse.json({ success: true, tasks: savedTasks });
  } catch (error) {
    console.error('Error processing answers and generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to process answers and generate tasks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}