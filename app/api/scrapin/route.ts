import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { url, endpoint } = await req.json();

  try {
    const response = await fetch(
      `https://api.scrapin.io/enrichment/${endpoint}?linkedInUrl=${encodeURIComponent(url)}&apikey=${process.env.SCRAPIN_API_KEY}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch LinkedIn data' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Scrapin API Error:', error);
    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });
  }
}
