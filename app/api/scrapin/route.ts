import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { url, endpoint } = await req.json();

  console.log('Scrapin API request:', { url, endpoint }); // Debugging log

  const response = await fetch(
    `https://api.scrapin.io/enrichment/${endpoint}?linkedInUrl=${encodeURIComponent(url)}&apikey=${process.env.SCRAPIN_API_KEY}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('Scrapin API error:', response.statusText); // Debugging log
    return NextResponse.json({ error: 'Failed to fetch LinkedIn data' }, { status: 500 });
  }

  const data = await response.json();
  console.log('Scrapin API response:', data); // Debugging log
  return NextResponse.json(data);
}
