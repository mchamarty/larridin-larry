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
      .select('*')
      .eq('profile_id', profileId);

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist, return an empty array
        console.warn('Insights table does not exist yet');
        return NextResponse.json({ insights: [] });
      }
      console.error('Error fetching insights:', error);
      return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
    }

    return NextResponse.json({ insights: data });
  } catch (error) {
    console.error('Unexpected error in /api/insights:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

