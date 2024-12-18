import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateQuestionsWithClaude } from '@/lib/claude';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    const { profileId, count = 20 } = await request.json();

    if (!profileId) {
      console.error('Missing profile ID in request');
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    console.log(`Generating ${count} questions for profile ID: ${profileId}`);

    // Check for existing questions
    const { data: existingQuestions } = await supabase
      .from('pre_generated_questions')
      .select('*')
      .eq('profile_id', profileId);

    if (existingQuestions && existingQuestions.length >= count) {
      return NextResponse.json({
        success: true,
        questions: existingQuestions,
        questionCount: existingQuestions.length
      });
    }

    // Fetch LinkedIn data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('linkedin_data')
      .eq('id', profileId)
      .single();

    if (profileError || !profile?.linkedin_data) {
      console.error('LinkedIn data error:', profileError);
      return NextResponse.json({ error: 'LinkedIn data not found' }, { status: 404 });
    }

    // Generate questions using Claude
    console.log('Generating questions with Claude');
    const generatedQuestions = await generateQuestionsWithClaude(profile.linkedin_data);

    if (!generatedQuestions || generatedQuestions.length === 0) {
      console.error('No questions generated');
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    // Save questions
    const { data: insertedQuestions, error: insertError } = await supabase
      .from('pre_generated_questions')
      .insert(generatedQuestions.map(question => ({ 
        profile_id: profileId,
        text: question.text,
        subtext: question.subtext,
        options: question.options,
        created_at: new Date().toISOString()
      })))
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      questions: insertedQuestions,
      questionCount: insertedQuestions?.length || 0
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Generation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}