import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const [answersResult, questionsResult] = await Promise.all([
      supabase
        .from('answers')
        .select('*', { count: 'exact' })
        .eq('profile_id', profileId),
      supabase
        .from('pre_generated_questions')
        .select('id', { count: 'exact' })
        .eq('profile_id', profileId)
    ]);

    if (answersResult.error || questionsResult.error) {
      throw answersResult.error || questionsResult.error;
    }

    const totalTasks = questionsResult.data?.length || 20;
    const completedTasks = answersResult.count || 0;
    const progressPercentage = (completedTasks / totalTasks) * 100;
    const currentSet = Math.floor(completedTasks / 5);

    return NextResponse.json({
      completedTasks,
      totalTasks,
      progressPercentage: Math.round(progressPercentage),
      currentSet,
      isSetComplete: completedTasks % 5 === 0,
      remainingSets: Math.ceil((totalTasks - completedTasks) / 5)
    });
  } catch (error) {
    console.error('Progress fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}