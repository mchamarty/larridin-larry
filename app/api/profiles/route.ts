// app/api/profiles/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateTasks } from '@/lib/tasks';

export async function POST(req: Request) {
  try {
    const { linkedin_url, linkedin_data } = await req.json();
    
    // Insert profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({ linkedin_url, linkedin_data })
      .select()
      .single();

    if (error) {
      console.error('Error inserting profile:', error);
      throw error;
    }

    // Generate initial tasks
    try {
      await generateTasks(profile.id);
    } catch (taskError) {
      console.error('Error generating initial tasks:', taskError);
      // Continue even if task generation fails
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}