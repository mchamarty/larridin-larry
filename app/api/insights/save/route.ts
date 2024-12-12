import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, questionId, answer } = body;

    if (!profileId || !questionId || !answer) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        received: { profileId, questionId, answer }
      }, { status: 400 });
    }

    console.log(`Saving insight for profile ${profileId}, question ${questionId}`);

    const { data, error } = await supabase
      .from('insights')
      .insert({
        profile_id: profileId,
        question_id: questionId,
        answer: answer
      })
      .select();

    if (error) {
      console.error('Error saving insight:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Insight saved successfully:', data);

    // Regenerate tasks if this completes a set of questions
    try {
      if (!process.env.NEXT_PUBLIC_APP_URL) {
        console.warn('NEXT_PUBLIC_APP_URL is not defined. Skipping task regeneration.');
      } else {
        const { data: insights } = await supabase
          .from('insights')
          .select('*')
          .eq('profile_id', profileId);
        
        // Only regenerate tasks after every 5 questions or when explicitly requested
        if (insights && insights.length % 5 === 0) {
          const regenerateResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/regenerate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ profileId }),
          });

          if (!regenerateResponse.ok) {
            throw new Error(`HTTP error! status: ${regenerateResponse.status}`);
          }

          console.log('Tasks regenerated successfully');
        }
      }
    } catch (error) {
      console.error('Failed to regenerate tasks:', error);
      // Don't return error since insight was saved successfully
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in /api/insights/save:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

