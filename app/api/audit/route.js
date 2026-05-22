import OpenAI from 'openai'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const COMPLIANCE_CONTEXT = {
  general: 'Apply general cloud security best practices including least privilege, MFA enforcement, and scoped resource access.',
  nist: 'Evaluate strictly against NIST SP 800-53 controls, especially AC-2 (Account Management), AC-3 (Access Enforcement), AC-6 (Least Privilege), IA-5 (Authenticator Management), and AU-2 (Audit Events). Reference specific control IDs in your findings.',
  cis: 'Evaluate strictly against CIS Benchmark controls for the relevant cloud provider (CIS AWS Foundations, CIS Azure Foundations, or CIS GCP Foundations). Reference specific CIS control numbers in your findings.',
  zerotrust: 'Evaluate through a Zero Trust Architecture lens: never trust, always verify. Flag any implicit trust, overly broad resource access, missing MFA conditions, service accounts with excessive permissions, and any policy that violates the principle of verify explicitly.',
  soc2: 'Evaluate against SOC 2 Type II Trust Service Criteria, specifically CC6 (Logical and Physical Access), CC7 (System Operations), and CC9 (Risk Mitigation). Flag any access that would fail a SOC 2 audit.',
}

const PROVIDER_CONTEXT = {
  aws: 'AWS IAM policy (JSON format with Version, Statement, Effect, Action, Resource, Condition fields)',
  azure: 'Azure Entra (Azure AD) role definition (JSON format with Name, Actions, NotActions, DataActions, AssignableScopes fields)',
  gcp: 'GCP IAM policy or role binding (JSON format with bindings array containing role and members fields, or a custom role with includedPermissions)',
}

export async function POST(req) {
  try {
    const { policy, provider = 'aws', compliance = 'general' } = await req.json()

    if (!policy || !policy.trim()) {
      return Response.json({ error: 'No policy provided' }, { status: 400 })
    }

    const providerCtx = PROVIDER_CONTEXT[provider] || PROVIDER_CONTEXT.aws
    const complianceCtx = COMPLIANCE_CONTEXT[compliance] || COMPLIANCE_CONTEXT.general

    const prompt = `You are a senior cloud security engineer and IAM specialist. You are analyzing a ${providerCtx}.

Compliance Mode: ${complianceCtx}

Analyze the following policy and return a JSON object with this exact structure:

{
  "riskScore": <integer 0-100, where 100 is most dangerous>,
  "findings": [
    {
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "title": "<short finding title>",
      "description": "<1-2 sentence explanation of what the finding is>",
      "explanation": "<2-3 sentences explaining WHY this is dangerous, what an attacker could do with it, and the real-world impact>",
      "example": "<a one-line concrete example of how this could be exploited>"
    }
  ],
  "remediation": "<2-4 sentence plain-English remediation summary>",
  "remediationSteps": [
    "<step 1: specific actionable instruction for ${providerCtx}>",
    "<step 2>",
    "<step 3>"
  ],
  "frameworks": ["<relevant framework violations specific to the compliance mode and provider, e.g. NIST AC-6, CIS AWS 1.16, Zero Trust, SOC 2 CC6.3>"]
}

Policy to analyze:
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
