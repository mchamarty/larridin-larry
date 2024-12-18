import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface Question {
  id: string;
  text: string;
  subtext: string;
  options: string[];
  profile_id: string;
  created_at: string;
}

interface Answer {
  id: string;
  answer: string;
  updated_at: string;
  question_id: string;
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileId = searchParams.get('profileId');

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { data: lockData } = await supabase
      .from('generation_locks')
      .select('locked')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (lockData?.locked) {
      return NextResponse.json({ error: 'Questions are being generated' }, { status: 409 });
    }

    const { data: existingQuestions } = await supabase
      .from('pre_generated_questions')
      .select('*')
      .eq('profile_id', profileId);

    const questions = existingQuestions || [];

    if (questions.length < 20) {
      await supabase
        .from('generation_locks')
        .upsert({ profile_id: profileId, locked: true });

      try {
        console.log('Insufficient questions, generating new ones...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }
      } finally {
        await supabase
          .from('generation_locks')
          .upsert({ profile_id: profileId, locked: false });
      }
    }

    const { data: finalQuestions } = await supabase
      .from('pre_generated_questions')
      .select('*')
      .eq('profile_id', profileId)
      .limit(20);

    if (!finalQuestions || finalQuestions.length === 0) {
      throw new Error('No questions available');
    }

    const { data: userAnswers } = await supabase
      .from('answers')
      .select('id, answer, updated_at, question_id')
      .eq('profile_id', profileId)
      .order('updated_at', { ascending: false });

    const answers = userAnswers || [];
    const currentSet = Math.floor(answers.length / 5);

    const insights = finalQuestions.map((question: Question) => ({
      ...question,
      answer: answers.find(a => a.question_id === question.id)?.answer || null,
      answered_at: answers.find(a => a.question_id === question.id)?.updated_at || null
    }));

    return NextResponse.json({
      insights,
      progress: {
        answeredQuestions: answers.length,
        totalQuestions: 20,
        progressPercentage: Math.round((answers.length / 20) * 100),
        currentSet,
        isSetComplete: answers.length % 5 === 0,
        remainingSets: Math.ceil((20 - answers.length) / 5)
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch insights',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}