import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, endpoint } = await req.json();
    
    if (!process.env.SCRAPIN_API_KEY) {
      console.error('SCRAPIN_API_KEY is not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const scrapinUrl = `https://api.scrapin.io/enrichment/${endpoint}?linkedInUrl=${encodeURIComponent(url)}&apikey=${process.env.SCRAPIN_API_KEY}`;
    
    console.log(`Making request to Scrapin API:`, {
      endpoint,
      url: scrapinUrl.replace(process.env.SCRAPIN_API_KEY!, '[REDACTED]')
    });
    
    const response = await fetch(scrapinUrl, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Log the raw response details
    console.log(`Scrapin API ${endpoint} response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    const responseText = await response.text();
    console.log(`Scrapin API ${endpoint} response body:`, responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error(`Failed to parse ${endpoint} response as JSON:`, e);
      return NextResponse.json({ 
        error: 'Invalid response format from Scrapin API',
        details: responseText
      }, { status: 500 });
    }

    if (!response.ok) {
      console.error(`Scrapin API ${endpoint} error:`, data);
      return NextResponse.json({ 
        error: 'Failed to fetch LinkedIn data',
        details: data,
        endpoint 
      }, { status: response.status });
    }

    console.log(`Scrapin API ${endpoint} success`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Scrapin API Error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error occurred', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}