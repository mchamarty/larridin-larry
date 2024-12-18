import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateTasks } from '@/lib/tasks';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    let profileId: string | null;

    // Check if profileId is in the URL params
    const { searchParams } = new URL(request.url);
    profileId = searchParams.get('profileId');

    // If not in URL params, check the request body
    if (!profileId) {
      const body = await request.json();
      profileId = body.profileId;
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Generate tasks using the existing function
    const tasks = await generateTasks(profileId);

    // Save generated tasks
    const { data: savedTasks, error: saveError } = await supabase
      .from('tasks')
      .insert(tasks.map(task => ({ ...task, profile_id: profileId })))
      .select();

    if (saveError) {
      throw saveError;
    }

    return NextResponse.json({ success: true, tasks: savedTasks });
  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

