import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('insights')
      .select('question_id')
      .eq('profile_id', profileId);

    if (error) {
      console.error('Error fetching insights:', error);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }

    const answeredQuestionIds = data.map(insight => insight.question_id);

    return NextResponse.json({ answeredQuestionIds });
  } catch (error) {
    console.error('Unexpected error in /api/insights/progress:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

