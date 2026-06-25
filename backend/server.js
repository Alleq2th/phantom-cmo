const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: '💀 PHANTOM CMO ONLINE', version: '2.0.0' }));
app.get('/health', (req, res) => res.json({ status: 'online', key_configured: !!process.env.GROQ_API_KEY }));

app.post('/analyze', async (req, res) => {
  console.log('📥 /analyze called');
  const { companyUrl, competitorUrl, goal, industry, platforms, budget, bizType } = req.body;

  if (!companyUrl || !competitorUrl || !goal) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured.' });
  }

  const sector = industry || 'General Business';
  const activePlatforms = (platforms && platforms.length) ? platforms.join(', ') : 'TikTok, Instagram, Email';
  const monthlyBudget = budget || 'Under $500';
  const businessType = bizType || 'B2C';

  const systemPrompt = `You are PHANTOM CMO — a battle-tested Chief Marketing Officer who has personally scaled brands in ${sector}. You do NOT sound like an AI. You sound like a real expert who has been in the trenches.

FRAMEWORKS YOU MUST APPLY:
- Hormozi ($100M Offers): Value = Dream Outcome × Likelihood of Achievement / Time Delay × Effort. Stack benefits, eliminate risk, make the offer impossible to say no to. Position the competitor as the villain.
- StoryBrand (Donald Miller): Customer = Hero. Brand = Guide. Name the villain (their core pain) explicitly. Every piece of content must show the customer winning.
- PAS Framework: Problem (name it in their words) → Agitate (make it feel real and urgent) → Solution (your product as the obvious answer).
- Hook-Story-Offer: Grab attention in 2 seconds → tell a relatable story → clear call-to-action with urgency.
- Gary Vee Jab-Jab-Right Hook: Give pure value 3 times before you ask for anything. 80% education, 20% promotion.
- TikTok Algorithm (2026): Completion rate is the #1 signal — if people finish the video, it spreads. Hook MUST land in 1-2 seconds or they scroll. Saves outweigh shares which outweigh comments which outweigh likes. Post 3-5x/week minimum. Target ONE micro-community at a time. Use trending sounds. Avoid AI-looking content.
- Email Sequences: Welcome (3-5 emails: deliver value first, introduce brand story, share social proof, soft sell, hard sell by email 4-5). Abandoned Cart (3 emails: friendly reminder → social proof → last-chance urgency). Nurture (education → case study → direct offer).

IRON RULES — NEVER BREAK THESE:
1. NEVER write "create engaging content" — write the EXACT content type, angle, format, and sample hook
2. NEVER write "post consistently" — write EXACTLY how many times per week, which days, what times
3. Write ACTUAL hooks — not descriptions of hooks. Full sentences the person can copy and use.
4. Name the competitor's weaknesses with SPECIFICS — not vague statements like "lacks personality"
5. Every single action must be executable by ONE person working from their phone
6. Write copy angles as ACTUAL WRITTEN COPY — 3-4 real sentences using the framework
7. Sound direct, confident, and human. Never hedge. Never say "it's important to consider."

Context for this analysis:
- Active Platforms: ${activePlatforms}
- Monthly Budget: ${monthlyBudget}
- Business Type: ${businessType}
- Industry: ${sector}

Return ONLY valid JSON. No markdown. No code fences. No preamble. Start with { and end with }.`;

  const userPrompt = `Company: ${companyUrl}
Competitor: ${competitorUrl}
Goal: ${goal}
Industry: ${sector}
Platforms: ${activePlatforms}
Budget: ${monthlyBudget}
Type: ${businessType}

Analyze both companies and return this exact JSON structure (fill every field with SPECIFIC, ACTIONABLE details — never vague):

{
  "company_name": "name from the URL",
  "competitor_name": "name from competitor URL",
  "icp": {
    "portrait": "3-sentence specific customer portrait: who they are, their daily reality, their mindset when they find this company",
    "top_pain": "The #1 pain — phrase it in their own words, the way they would say it out loud",
    "buying_trigger": "The exact situation or moment that makes them pull out their wallet",
    "pain_points": ["very specific pain 1","very specific pain 2","very specific pain 3"],
    "desires": ["specific desire 1 — not generic","specific desire 2","specific desire 3"]
  },
  "competitor_teardown": {
    "messaging_gap": "What their messaging completely misses that their customers actually care about — be specific",
    "content_weakness": "A specific weakness in how they show up on social media or in their content",
    "audience_ignored": "A specific customer segment they are completely ignoring",
    "attack_angle": "The exact positioning angle to use to pull their customers away"
  },
  "platform_playbook": [
    {
      "platform": "platform name from active platforms",
      "why_it_wins": "Why this specific platform works for this industry and goal",
      "frequency": "X posts per week — specific number",
      "best_times": "Best days and times to post for this audience",
      "content_types": [
        "content type 1: specific format with specific angle for this brand",
        "content type 2: specific format",
        "content type 3: specific format"
      ],
      "sample_hook": "Write a real, ready-to-use opening hook for a video or post on this platform"
    }
  ],
  "email_sequence": [
    {
      "number": 1,
      "send_time": "immediately on signup",
      "subject_line": "exact subject line, under 7 words",
      "what_it_does": "specific purpose and key message of this email"
    },
    {
      "number": 2,
      "send_time": "Day 2",
      "subject_line": "exact subject line",
      "what_it_does": "specific purpose and key message"
    },
    {
      "number": 3,
      "send_time": "Day 4",
      "subject_line": "exact subject line",
      "what_it_does": "specific purpose and key message"
    },
    {
      "number": 4,
      "send_time": "Day 7",
      "subject_line": "exact subject line",
      "what_it_does": "specific purpose — this is the sell email"
    }
  ],
  "blueprint": [
    {
      "week": 1,
      "theme": "short theme name",
      "monday": "specific executable action — what exactly to do",
      "wednesday": "specific executable action",
      "friday": "specific executable action",
      "kpi": "exact metric to track this week with a target number"
    },
    {
      "week": 2,
      "theme": "short theme name",
      "monday": "specific action",
      "wednesday": "specific action",
      "friday": "specific action",
      "kpi": "exact metric with target number"
    },
    {
      "week": 3,
      "theme": "short theme name",
      "monday": "specific action",
      "wednesday": "specific action",
      "friday": "specific action",
      "kpi": "exact metric with target number"
    },
    {
      "week": 4,
      "theme": "short theme name",
      "monday": "specific action",
      "wednesday": "specific action",
      "friday": "specific action",
      "kpi": "exact metric with target number"
    }
  ],
  "copy_angles": [
    {
      "framework": "PAS",
      "copy": "Write 3-4 real sentences of actual copy using Problem-Agitate-Solution for this specific brand. This must be ready to post or use."
    },
    {
      "framework": "Hook-Story-Offer",
      "copy": "Write 3-4 real sentences using Hook-Story-Offer structure for this brand. Must be specific to their product."
    }
  ],
  "hooks": [
    "Ready-to-use hook 1 — write the full sentence, specific to this brand and platform",
    "Ready-to-use hook 2",
    "Ready-to-use hook 3",
    "Ready-to-use hook 4"
  ],
  "verdict": "2-3 sentences. Direct, confident, expert. The single most important move this company must make right now to beat the competitor."
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
        temperature: 0.75,
        max_tokens: 2000
      })
    });

    console.log('📡 Groq status:', response.status);
    const data = await response.json();

    if (data.error) {
      console.error('❌ Groq error:', JSON.stringify(data.error));
      return res.status(502).json({ error: data.error.message });
    }

    const rawText = data.choices?.[0]?.message?.content || '';
    console.log('📝 Response length:', rawText.length);

    if (!rawText) return res.status(502).json({ error: 'Empty response from AI. Try again.' });

    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start === -1 || end === -1) {
      console.error('No JSON:', rawText.substring(0, 200));
      return res.status(502).json({ error: 'No structured data returned. Try again.' });
    }

    const result = JSON.parse(rawText.substring(start, end + 1));
    console.log('✅ Success:', result.company_name);
    res.json({ success: true, data: result });

  } catch (err) {
    console.error('💥 Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`💀 PHANTOM CMO v2 running on port ${PORT}`);
  console.log(`   Groq Key: ${process.env.GROQ_API_KEY ? '✓ Configured' : '✗ MISSING'}`);
});
