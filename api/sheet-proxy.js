export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbyPkz4jNjYHbRheU24YT9zV5BIqNw6B1jQ2PuQBaZ1kYYrkXBe6eNJht20e3GVRIC97xA/exec';

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    const response = await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: body,
      redirect: 'follow'
    });
    
    const text = await response.text();
    res.status(200).json({ ok: true, response: text.substring(0, 200) });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
