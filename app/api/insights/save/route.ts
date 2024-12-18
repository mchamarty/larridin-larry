import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { profileId, questionId, answer, currentSetIndex } = await request.json();

    if (!profileId || !questionId || !answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save answer
    const { data: savedAnswer, error: saveError } = await supabase
      .from('answers')
      .upsert({
        profile_id: profileId,
        question_id: questionId,
        answer,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,question_id'
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Get all answers to calculate accurate progress
    const { data: answers, error: answersError, count: answersCount } = await supabase
      .from('answers')
      .select('*', { count: 'exact' })
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: true });

    if (answersError) throw answersError;

    // Get total questions count
    const { count: totalQuestions, error: questionsError } = await supabase
      .from('pre_generated_questions')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    if (questionsError) throw questionsError;

    const completedTasks = answersCount || 0;
    const totalTasks = totalQuestions || 20; // Default to 20 if not found
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);
    const currentSet = Math.floor(completedTasks / 5);
    
    // Create ordered list of answered questions
    const answeredQuestions = answers?.map(a => ({
      questionId: a.question_id,
      answeredAt: a.updated_at
    })).sort((a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime()) || [];

    return NextResponse.json({
      success: true,
      savedAnswer,
      progress: {
        completedTasks,
        totalTasks,
        progressPercentage,
        currentSet,
        isSetComplete: completedTasks % 5 === 0,
        currentQuestionIndex: completedTasks,
        answeredQuestions
      }
    });

  } catch (error) {
    console.error('Save answer error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Save failed',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}