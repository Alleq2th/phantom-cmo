const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ──────────────────────────────────────────────────
// After deploying to GitHub Pages, add your exact URL below
const ALLOWED = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  // 'https://YOURUSERNAME.github.io'  ← uncomment & fill after deploy
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    // Allow all github.io origins
    if (origin.includes('github.io')) return cb(null, true);
    if (ALLOWED.includes(origin)) return cb(null, true);
    cb(null, true); // Open during dev — tighten before selling
  }
}));

app.use(express.json());

// ─── HEALTH CHECK ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: '💀 PHANTOM CMO ONLINE', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    key_configured: !!process.env.ANTHROPIC_API_KEY
  });
});

// ─── MAIN ANALYSIS ENDPOINT ────────────────────────────────
app.post('/analyze', async (req, res) => {
  const { companyUrl, competitorUrl, goal, industry } = req.body;

  // Validate
  if (!companyUrl || !competitorUrl || !goal) {
    return res.status(400).json({
      error: 'Missing fields: companyUrl, competitorUrl, goal are required.'
    });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY is not configured on the server.'
    });
  }

  const sector = industry || 'General Business';

  const systemPrompt = `You are PHANTOM CMO — an elite marketing intelligence oracle with mastery across every industry and business vertical. You engineer winning campaigns for startups, SMBs, and enterprise brands worldwide.

Your mission: Use web search to research both companies provided, then deliver a precise, actionable marketing intelligence report specifically tailored for the ${sector} sector.

Every section of your report — ICP, competitor gaps, 30-day blueprint, content hooks — must be adapted specifically for ${sector}. This is not generic advice. This is a weapon built for this exact industry.

Return ONLY valid JSON. No markdown. No code fences. No preamble. No extra text. Start your response with { and end with }.

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
    "positioning": "One razor-sharp positioning statement that exploits the gap in ${sector}"
  },
  "blueprint": [
    {"week":1,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":2,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":3,"focus":"string","actions":["action_1","action_2","action_3"]},
    {"week":4,"focus":"string","actions":["action_1","action_2","action_3"]}
  ],
  "hooks": ["hook_1","hook_2","hook_3","hook_4"],
  "verdict": "2-sentence brutal, specific marketing verdict for ${sector}"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Company URL: ${companyUrl}
Competitor URL: ${competitorUrl}
Primary Goal: ${goal}
Industry: ${sector}

Search both companies using web search, analyze their positioning, and return the full marketing strategy JSON.`
        }]
      })
    });

    const anthropicData = await response.json();

    // Handle Anthropic-level errors
    if (anthropicData.error) {
      console.error('Anthropic error:', anthropicData.error);
      return res.status(502).json({ error: anthropicData.error.message });
    }

    // Extract all text blocks (web search responses may have multiple)
    const rawText = (anthropicData.content || [])
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Extract the JSON object
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('No JSON found in response:', rawText.substring(0, 200));
      return res.status(502).json({ error: 'The oracle returned no structured data. Please try again.' });
    }

    const parsed = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
    res.json({ success: true, data: parsed });

  } catch (err) {
    console.error('Phantom CMO server error:', err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── START ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`💀 PHANTOM CMO running on port ${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? '✓ Configured' : '✗ MISSING — set ANTHROPIC_API_KEY'}`);
});
