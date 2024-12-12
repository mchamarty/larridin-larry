import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { profileId } = await request.json();

  if (!profileId) {
    return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
  }

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/background-generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId })
    });
  } catch (error) {
    console.error('Failed to trigger background generation:', error);
  }

  return NextResponse.json({ success: true });
}

