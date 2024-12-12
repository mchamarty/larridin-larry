import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: Request) {
 try {
   const { profileId } = await request.json();

   if (!profileId) {
     return NextResponse.json(
       { success: false, error: 'Profile ID is required' },
       { status: 400 }
     );
   }

   // Fetch the user's LinkedIn data
   const { data: profile, error: profileError } = await supabase
     .from('profiles')
     .select('linkedin_data')
     .eq('id', profileId)
     .single();

   if (profileError) {
     console.error('Error fetching profile:', profileError);
     return NextResponse.json(
       { success: false, error: 'Failed to fetch profile data' },
       { status: 500 }
     );
   }

   if (!profile || !profile.linkedin_data) {
     return NextResponse.json(
       { success: false, error: 'LinkedIn data not found for this profile' },
       { status: 404 }
     );
   }

   // Generate questions using Claude
   const questions = await generateQuestionsWithClaude(profile.linkedin_data);

   // Save generated questions to the database
   const { error: insertError } = await supabase
     .from('pre_generated_questions')
     .insert(questions.map(q => ({ ...q, profile_id: profileId })));

   if (insertError) {
     console.error('Error inserting questions:', insertError);
     return NextResponse.json(
       { success: false, error: 'Failed to save generated questions' },
       { status: 500 }
     );
   }

   return NextResponse.json({
     success: true,
     message: 'Questions generated and saved successfully'
   });

 } catch (error) {
   console.error('Unexpected error:', error);
   return NextResponse.json(
     { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' },
     { status: 500 }
   );
 }
}

async function generateQuestionsWithClaude(linkedInData: any): Promise<any[]> {
 if (!ANTHROPIC_API_KEY) {
   throw new Error('ANTHROPIC_API_KEY is not configured');
 }

 const prompt = `Based on the following LinkedIn profile data, generate 20 highly relevant and personalized multiple-choice questions for professional self-reflection. Each question should have 4 options. The questions should be tailored to the individual's career, skills, and experiences. Return ONLY a JSON array in this exact format:
[{
"text": "question text",
"subtext": "explanation of relevance to the user's profile",
"options": ["option1", "option2", "option3", "option4"]
}]

LinkedIn Profile Data:
${JSON.stringify(linkedInData, null, 2)}`;

 try {
   const response = await fetch('https://api.anthropic.com/v1/messages', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'anthropic-version': '2023-06-01',
       'x-api-key': ANTHROPIC_API_KEY,
     },
     body: JSON.stringify({
       model: 'claude-3-opus-20240229',
       max_tokens: 2048,
       messages: [
         {
           role: 'user',
           content: prompt,
         },
       ],
     }),
   });

   if (!response.ok) {
     throw new Error(`Failed to generate questions: ${response.statusText}`);
   }

   const data = await response.json();
   const textContent = data.content?.[0]?.text;
   if (!textContent) {
     throw new Error('No valid text content received from Claude');
   }

   // Extract JSON array from the response
   const jsonMatch = textContent.match(/\[[\s\S]*\]/);
   if (!jsonMatch) {
     throw new Error('No JSON array found in Claude response');
   }

   const questions = JSON.parse(jsonMatch[0]);

   if (!Array.isArray(questions) || questions.length === 0) {
     throw new Error('Invalid response format or empty questions array');
   }

   return questions;
 } catch (error) {
   console.error('Error generating questions with Claude:', error);
   throw error;
 }
}