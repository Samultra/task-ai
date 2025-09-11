import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple serverless proxy to OpenAI Chat Completions with CORS
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://samultra.github.io',
    'https://samultra.github.io/task-ai',
  ];

  const origin = req.headers.origin || '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: 'OPENAI_API_KEY is not set' } });
  }

  try {
    const { model, messages, temperature } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: { message: 'messages is required' } });
    }

    const selectedModel = typeof model === 'string' && model.length > 0 ? model : 'gpt-4o-mini';

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: typeof temperature === 'number' ? temperature : 0.6,
      }),
    });

    const text = await openaiRes.text();
    if (!openaiRes.ok) {
      return res.status(openaiRes.status).send(text);
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(text);
  } catch (err: any) {
    return res.status(500).json({ error: { message: err?.message || 'Unknown error' } });
  }
}


