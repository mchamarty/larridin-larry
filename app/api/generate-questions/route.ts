import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');

    if (!profileId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate questions using AI (this is a placeholder, replace with actual AI integration)
    const generatedQuestions = await generateQuestionsWithAI(profileId);

    // Save generated questions to the database
    const { data, error } = await supabase
      .from('pre_generated_questions')
      .insert(generatedQuestions)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

async function generateQuestionsWithAI(profileId: string) {
  // This is a placeholder function. Replace with actual AI integration.
  // For now, we'll return a set of predefined questions
  return [
    {
      profile_id: profileId,
      text: "What's your biggest challenge at work right now?",
      subtext: "Understanding your current challenges helps us tailor recommendations.",
      options: [
        "Time management",
        "Team collaboration",
        "Project deadlines",
        "Work-life balance"
      ]
    },
    {
      profile_id: profileId,
      text: "Which area of your professional skills do you want to improve most?",
      subtext: "This helps us focus on your personal development goals.",
      options: [
        "Leadership",
        "Technical skills",
        "Communication",
        "Strategic thinking"
      ]
    },
    {
      profile_id: profileId,
      text: "How would you describe your current work environment?",
      subtext: "This helps us understand your work context.",
      options: [
        "Fast-paced and dynamic",
        "Structured and process-oriented",
        "Collaborative and team-focused",
        "Autonomous and independent"
      ]
    },
    {
      profile_id: profileId,
      text: "What's your preferred learning style?",
      subtext: "This helps us tailor our task recommendations to your learning preferences.",
      options: [
        "Visual (diagrams, charts)",
        "Auditory (discussions, podcasts)",
        "Reading/Writing",
        "Kinesthetic (hands-on practice)"
      ]
    },
    {
      profile_id: profileId,
      text: "What's your long-term career goal?",
      subtext: "This helps us align our recommendations with your career aspirations.",
      options: [
        "Executive leadership",
        "Technical expertise",
        "Entrepreneurship",
        "Consulting/Advisory roles"
      ]
    }
  ];
}

