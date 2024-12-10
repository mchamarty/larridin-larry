import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { task } = await req.json();

    const prompt = `Create a professional email sharing this task: ${JSON.stringify(task)}. Write in first person, as if proposing this initiative to colleagues.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch Claude API' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in email generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
