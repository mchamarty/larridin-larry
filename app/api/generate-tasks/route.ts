import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Task } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Fetch profile data from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) {
      throw profileError;
    }

    // Call Claude API
    const tasks = await callClaude(profile);

    // Insert tasks into Supabase
    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasks.map((task: any) => ({
        ...task,
        profile_id: profileId
      })))
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(insertedTasks);
  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

async function callClaude(profile: any) {
  const prompt = `Generate tasks based on this profile: ${JSON.stringify(profile)}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
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
    throw new Error(`Claude API error: ${response.statusText}`);
  }

  const data = await response.json();
  const textContent = data.content?.[0]?.text;

  if (!textContent) {
    throw new Error('No valid text content received from Claude');
  }

  return JSON.parse(textContent);
}

