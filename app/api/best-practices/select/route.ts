import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { callClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { profileId, selectedPractices } = await request.json();

    if (!profileId || !selectedPractices) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Fetch the user's LinkedIn data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linkedin_data')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;

    // Generate tasks based on selected best practices
    const prompt = `Generate tasks based on these best practices: ${selectedPractices.join(', ')} for this LinkedIn profile: ${JSON.stringify(profile.linkedin_data)}`;
    
    const tasks = await callClaude(prompt, 'tasks'); // Added 'tasks' as the second argument

    // Save generated tasks to the database
    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasks.map((task: any) => ({ ...task, profile_id: profileId })))
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({ tasks: insertedTasks });
  } catch (error) {
    console.error('Error in /api/best-practices/select:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

