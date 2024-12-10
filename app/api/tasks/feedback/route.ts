import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { taskId, feedback } = await request.json();

    if (!taskId || !feedback) {
      return NextResponse.json(
        { error: 'Task ID and feedback are required' },
        { status: 400 }
      );
    }

    // Store the feedback
    const { error: feedbackError } = await supabase
      .from('tasks')
      .update({ feedback })
      .eq('id', taskId);

    if (feedbackError) {
      throw feedbackError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving task feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

