import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { contents } = await req.json();

    if (!contents || !Array.isArray(contents)) {
      return NextResponse.json({ error: 'contents array is required' }, { status: 400 });
    }

    // Read the API Key securely from server environment variables
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyB6U0-va5QOltKFH9CDuCgeksYbGC9JaKI";

    // Use v1beta for generateContent which supports systemInstruction
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: "You are a helpful, encouraging, and highly competent AI pair-programming assistant in a collaborative student code notebook room named LoveStudy. Keep your answers brief, clean, and write clear markdown code blocks whenever you show code. Encourage Jitu and Ananya to learn and collaborate!" }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Server-Side Fetch Error:', errorText);
      
      // Parse the error message if possible to return a clear, user-friendly error
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        parsedError = null;
      }
      
      const friendlyMessage = parsedError?.error?.message || 'Gemini API call failed';
      return NextResponse.json({ error: friendlyMessage }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('API route error in /api/gemini:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
