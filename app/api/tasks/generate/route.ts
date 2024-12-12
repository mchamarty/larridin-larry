import { NextResponse } from 'next/server';
import { generateTasks } from '@/lib/tasks';

export async function POST(request: Request) {
  try {
    let profileId: string | null;

    // Check if profileId is in the URL params
    const { searchParams } = new URL(request.url);
    profileId = searchParams.get('profileId');

    // If not in URL params, check the request body
    if (!profileId) {
      const body = await request.json();
      profileId = body.profileId;
    }

    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const tasks = await generateTasks(profileId);
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      { status: 500 }
    );
  }
}

