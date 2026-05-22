import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req) {
  try {
    const { policy } = await req.json()

    if (!policy || !policy.trim()) {
      return Response.json({ error: 'No policy provided' }, { status: 400 })
    }

    const prompt = `You are an expert cloud security engineer specializing in IAM policy analysis. Analyze the following IAM policy and return a JSON object with this exact structure:

{
  "riskScore": <integer 0-100, where 100 is most dangerous>,
  "findings": [
    {
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "title": "<short finding title>",
      "description": "<1-2 sentence explanation of what the finding is>",
      "explanation": "<2-3 sentences explaining WHY this is dangerous, what an attacker could do with it, and the real-world impact>",
      "example": "<a one-line concrete example of how this could be exploited or what it looks like in practice>"
    }
  ],
  "remediation": "<2-4 sentence plain-English remediation summary>",
  "remediationSteps": [
    "<step 1: specific actionable instruction>",
    "<step 2>",
    "<step 3>",
    "<add as many steps as needed>"
  ],
  "frameworks": ["<relevant framework violations e.g. NIST AC-6, CIS AWS 1.16, Zero Trust, SOC 2, ISO 27001>"]
}

IAM Policy to analyze:
${policy}

Return ONLY valid JSON. No markdown, no code blocks, no explanation outside the JSON.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    })

    const raw = response.choices[0].message.content.trim()
    const parsed = JSON.parse(raw)

    return Response.json(parsed)
  } catch (e) {
    console.error('Audit error:', e)
    return Response.json({ error: 'Analysis failed. Check your API key or policy format.' }, { status: 500 })
  }
}
