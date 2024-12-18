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

   const tasks = await generateTasks(profileId);

   const tasksForInsert = tasks.map(({ id, ...task }) => ({
     ...task,
     profile_id: profileId
   }));

   const { data: savedTasks, error: saveError } = await supabase
  .from('tasks')
  .insert(tasksForInsert)
  .select();

   if (saveError) {
     console.error('Error saving tasks:', saveError);
     return NextResponse.json(
       { error: 'Failed to save tasks', details: saveError.message },
       { status: 500 }
     );
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