const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: '💀 PHANTOM CMO ONLINE', version: '1.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'online', key_configured: !!process.env.GROQ_API_KEY }));

app.post('/analyze', async (req, res) => {
  console.log('📥 /analyze called');

  const { companyUrl, competitorUrl, goal, industry } = req.body;

  if (!companyUrl || !competitorUrl || !goal) {
    return res.status(400).json({ error: 'Missing fields: companyUrl, competitorUrl, goal are required.' });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('❌ GROQ_API_KEY not set');
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
  }

  const sector = industry || 'General Business';

  const systemPrompt = `You are PHANTOM CMO — an elite marketing intelligence oracle with mastery across every industry. You engineer winning campaigns for startups, SMBs, and enterprise brands worldwide.

Your mission: Analyze both companies and deliver a precise, actionable marketing intelligence report tailored specifically for the ${sector} sector.

Every section — ICP, competitor gaps, 30-day blueprint, content hooks — must be specifically adapted for ${sector}.

CRITICAL RULE: Return ONLY valid JSON. No markdown. No code fences. No explanation. No text before or after. Your entire response must start with { and end with }.`;

  const userPrompt = `Company URL: ${companyUrl}
Competitor URL: ${competitorUrl}
Primary Goal: ${goal}
Industry: ${sector}

Analyze both companies based on what you know about them and return ONLY this JSON structure:

{
  "company_name": "string",
  "competitor_name": "string",
  "icp": {
    "demographics": "2-sentence audience summary specific to ${sector}",
    "pain_points": ["pain_1","pain_2","pain_3"],
    "desires": ["desire_1","desire_2","desire_3"]
  },
  "gap": {
    "weaknesses": ["competitor_weakness_1","competitor_weakness_2","competitor_weakness_3"],
    "opportunities": ["your_opportunity_1","your_opportunity_2","your_opportunity_3"],
    "positioning": "One razor-sharp positioning statement"
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
    console.log('🔍 Calling Groq API...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    console.log('📡 Groq status:', response.status);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Groq error:', JSON.stringify(data.error));
      return res.status(502).json({ error: data.error.message });
    }

    const rawText = data.choices?.[0]?.message?.content || '';
    console.log('📝 Raw response length:', rawText.length);

    if (!rawText) {
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
  console.log(`   Groq Key: ${process.env.GROQ_API_KEY ? '✓ Configured' : '✗ MISSING — set GROQ_API_KEY'}`);
});
