import { NextResponse } from 'next/server';
export const maxDuration = 300; // Max duration in seconds (5 minutes)
export const dynamic = 'force-dynamic'; // Add this line to force dynamic rendering

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY environment variable is not set.' },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt. Prompt must be a non-empty string.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4-minute timeout

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: 'claude-3-opus-20240229',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        return NextResponse.json(
          { error: `Claude API error: ${errorText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      
      return NextResponse.json({
        success: true,
        data: {
          content: [{ text: data.content[0].text }],
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out');
        return NextResponse.json(
          { error: 'Request timed out. Please try again.' },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in Claude API route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

