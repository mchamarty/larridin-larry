import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { profileId, sourceId } = await req.json();

    if (!profileId || !sourceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the profile with the selected best practices source
    const { error } = await supabase
      .from('profiles')
      .update({ best_practices_source: sourceId })
      .eq('id', profileId);

    if (error) {
      console.error('Error updating best practices source:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Here you would typically call your LLM (e.g., Claude) to fetch and process
    // the best practices from the selected source. For now, we'll just return a success message.

    return NextResponse.json({ success: true, message: 'Best practices source updated successfully' });
  } catch (error) {
    console.error('Unexpected error in /api/best-practices/select:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

