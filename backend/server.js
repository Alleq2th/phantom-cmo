const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins
app.use(cors());
app.use(express.json());

const GEMINI_MODEL = 'gemini-2.0-flash';

app.get('/', (req, res) => res.json({ status: '💀 PHANTOM CMO ONLINE', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'online', key_configured: !!process.env.GEMINI_API_KEY }));

app.post('/analyze', async (req, res) => {
  console.log('📥 /analyze called');

  const { companyUrl, competitorUrl, goal, industry } = req.body;

  if (!companyUrl || !competitorUrl || !goal) {
    return res.status(400).json({ error: 'Missing fields: companyUrl, competitorUrl, goal are required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not set');
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const sector = industry || 'General Business';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const prompt = `You are PHANTOM CMO — an elite marketing intelligence oracle. Analyze both companies and deliver a marketing intelligence report tailored for the ${sector} sector.

Company URL: ${companyUrl}
Competitor URL: ${competitorUrl}
Primary Goal: ${goal}
Industry: ${sector}

Research both companies and return ONLY valid JSON. No markdown. No explanation. Start with { and end with }:

{
  "company_name": "string",
  "competitor_name": "string",
  "icp": {
    "demographics": "2-sentence audience summary for ${sector}",
    "pain_points": ["pain_1","pain_2","pain_3"],
    "desires": ["desire_1","desire_2","desire_3"]
  },
  "gap": {
    "weaknesses": ["weakness_1","weakness_2","weakness_3"],
    "opportunities": ["opp_1","opp_2","opp_3"],
    "positioning": "One sharp positioning statement"
  },
  "blueprint": [
    {"week":1,"focus":"string","actions":["a1","a2","a3"]},
    {"week":2,"focus":"string","actions":["a1","a2","a3"]},
    {"week":3,"focus":"string","actions":["a1","a2","a3"]},
    {"week":4,"focus":"string","actions":["a1","a2","a3"]}
  ],
  "hooks": ["hook_1","hook_2","hook_3","hook_4"],
  "verdict": "2-sentence brutal marketing verdict"
}`;

  try {
    console.log('🔍 Calling Gemini API...');

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    console.log('📡 Gemini status:', response.status);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Gemini error:', JSON.stringify(data.error));
      return res.status(502).json({ error: data.error.message });
    }

    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .filter(p => p.text)
      .map(p => p.text)
      .join('');

    console.log('📝 Raw response length:', rawText.length);

    if (!rawText) {
      console.error('❌ Empty response from Gemini');
      return res.status(502).json({ error: 'The oracle returned no data. Please try again.' });
    }

    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start === -1 || end === -1) {
      console.error('❌ No JSON found:', rawText.substring(0, 300));
      return res.status(502).json({ error: 'Oracle returned no structured data. Please try again.' });
    }

    const result = JSON.parse(rawText.substring(start, end + 1));
    console.log('✅ Success — company:', result.company_name);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('💥 Server error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`💀 PHANTOM CMO running on port ${PORT}`);
  console.log(`   Gemini Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ MISSING'}`);
});
