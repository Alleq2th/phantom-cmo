const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: (origin, cb) => cb(null, true) }));
app.use(express.json());

const GEMINI_MODEL = 'gemini-2.0-flash';

app.get('/', (req, res) => res.json({ status: '💀 PHANTOM CMO ONLINE', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'online', key_configured: !!process.env.GEMINI_API_KEY }));

app.post('/analyze', async (req, res) => {
  const { companyUrl, competitorUrl, goal, industry } = req.body;

  if (!companyUrl || !competitorUrl || !goal) {
    return res.status(400).json({ error: 'Missing fields: companyUrl, competitorUrl, goal are required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const sector = industry || 'General Business';
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const systemPrompt = `You are PHANTOM CMO — an elite marketing intelligence oracle with mastery across every industry and business vertical. You engineer winning campaigns for startups, SMBs, and enterprise brands worldwide.

Your mission: Use Google Search to research both companies provided, then deliver a precise, actionable marketing intelligence report tailored for the ${sector} sector.

Every section — ICP, competitor gaps, 30-day blueprint, content hooks — must be specifically adapted for ${sector}. Not generic advice. A weapon built for this exact industry.

CRITICAL: Return ONLY valid JSON. No markdown. No code fences. No explanation. No extra text before or after. Your entire response must start with { and end with }.

{
  "company_name": "string",
  "competitor_name": "string",
  "icp": {
    "demographics": "2-sentence industry-specific audience summary for ${sector}",
    "pain_points": ["pain_point_1","pain_point_2","pain_point_3"],
    "desires": ["desire_1","desire_2","desire_3"]
  },
  "gap": {
    "weaknesses": ["competitor_weakness_1","competitor_weakness_2","competitor_weakness_3"],
    "opportunities": ["your_opportunity_1","your_opportunity_2","your_opportunity_3"],
    "positioning": "One razor-sharp positioning statement for ${sector}"
  },
  "blueprint": [
    {"week":1,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":2,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":3,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":4,"focus":"string","actions":["action_1","action_2","action_3"]}
  ],
  "hooks": ["hook_1","hook_2","hook_3","hook_4"],
  "verdict": "2-sentence brutal, specific marketing verdict"
}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Company URL: ${companyUrl}\nCompetitor URL: ${competitorUrl}\nPrimary Goal: ${goal}\nIndustry: ${sector}\n\nSearch both companies using Google Search, analyze their positioning, and return ONLY the JSON strategy report.`
          }]
        }],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        tools: [{ googleSearch: {} }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Gemini API error:', data.error);
      return res.status(502).json({ error: data.error.message });
    }

    // Extract text from all parts
    const rawText = (data.candidates?.[0]?.content?.parts || [])
      .filter(p => p.text)
      .map(p => p.text)
      .join('');

    if (!rawText) {
      return res.status(502).json({ error: 'The oracle returned no data. Please try again.' });
    }

    // Extract JSON object cleanly
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');

    if (start === -1 || end === -1) {
      console.error('No JSON in response:', rawText.substring(0, 300));
      return res.status(502).json({ error: 'Oracle returned no structured data. Please try again.' });
    }

    const result = JSON.parse(rawText.substring(start, end + 1));
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('Phantom CMO Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`💀 PHANTOM CMO running on port ${PORT}`);
  console.log(`   Gemini Key: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ MISSING — set GEMINI_API_KEY'}`);
});
