'use client'
import { useState, useEffect } from 'react'

const CLOUD_PROVIDERS = {
  aws: {
    label: 'AWS IAM',
    icon: '☁️',
    placeholder: 'Paste your AWS IAM policy JSON here...',
    samples: {
      critical: { label: '🔴 Critical – Full Admin Wildcard', policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }, null, 2) },
      high: { label: '🟠 High – Overprivileged S3 + IAM', policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:*', 'iam:CreateUser', 'iam:AttachUserPolicy'], Resource: '*' }, { Effect: 'Allow', Action: 'ec2:Describe*', Resource: '*' }] }, null, 2) },
      medium: { label: '🟡 Medium – Read-Heavy, No MFA', policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket', 'cloudwatch:GetMetricData'], Resource: '*' }] }, null, 2) },
      low: { label: '🟢 Low – Scoped Read-Only + MFA', policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::my-secure-bucket/*', Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } } }] }, null, 2) },
      stale: { label: '🔴 Critical – Cross-Account + KMS', policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['sts:AssumeRole'], Resource: 'arn:aws:iam::*:role/*' }, { Effect: 'Allow', Action: ['secretsmanager:GetSecretValue', 'kms:Decrypt'], Resource: '*' }] }, null, 2) }
    }
  },
  azure: {
    label: 'Azure Entra',
    icon: '🔵',
    placeholder: 'Paste your Azure Entra role definition JSON here...',
    samples: {
      critical: { label: '🔴 Critical – Owner Role (All Permissions)', policy: JSON.stringify({ Name: 'Custom Owner', Description: 'Full access to all resources', Actions: ['*'], NotActions: [], AssignableScopes: ['/'] }, null, 2) },
      high: { label: '🟠 High – Contributor + No NotActions', policy: JSON.stringify({ Name: 'Custom Contributor', Actions: ['Microsoft.Compute/*', 'Microsoft.Storage/*', 'Microsoft.Network/*', 'Microsoft.Authorization/*/read'], NotActions: [], AssignableScopes: ['/subscriptions/sub-id'] }, null, 2) },
      medium: { label: '🟡 Medium – Reader + Some Write', policy: JSON.stringify({ Name: 'Scoped Reader Plus', Actions: ['*/read', 'Microsoft.Support/*'], NotActions: [], AssignableScopes: ['/subscriptions/sub-id/resourceGroups/my-rg'] }, null, 2) },
      low: { label: '🟢 Low – Read-Only Scoped Role', policy: JSON.stringify({ Name: 'Read Only Custom', Actions: ['*/read'], NotActions: ['Microsoft.Authorization/*/write'], AssignableScopes: ['/subscriptions/sub-id/resourceGroups/prod-rg'] }, null, 2) }
    }
  },
  gcp: {
    label: 'GCP IAM',
    icon: '🟢',
    placeholder: 'Paste your GCP IAM policy or role binding JSON here...',
    samples: {
      critical: { label: '🔴 Critical – Project Owner Binding', policy: JSON.stringify({ bindings: [{ role: 'roles/owner', members: ['allUsers'] }], version: 1 }, null, 2) },
      high: { label: '🟠 High – Editor + AllAuthenticatedUsers', policy: JSON.stringify({ bindings: [{ role: 'roles/editor', members: ['allAuthenticatedUsers'] }, { role: 'roles/storage.admin', members: ['user:dev@company.com'] }], version: 1 }, null, 2) },
      medium: { label: '🟡 Medium – Viewer Broad Scope', policy: JSON.stringify({ bindings: [{ role: 'roles/viewer', members: ['domain:company.com'] }, { role: 'roles/logging.viewer', members: ['group:devs@company.com'] }], version: 1 }, null, 2) },
      low: { label: '🟢 Low – Minimal Scoped Binding', policy: JSON.stringify({ bindings: [{ role: 'roles/storage.objectViewer', members: ['serviceAccount:app@project.iam.gserviceaccount.com'] }], version: 1 }, null, 2) }
    }
  }
}

const COMPLIANCE_MODES = [
  { value: 'general', label: 'General Best Practices' },
  { value: 'nist', label: 'NIST SP 800-53' },
  { value: 'cis', label: 'CIS Benchmarks' },
  { value: 'zerotrust', label: 'Zero Trust Architecture' },
  { value: 'soc2', label: 'SOC 2 Type II' },
]

const FRAMEWORK_LINKS = {
  'NIST AC-6': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-6',
  'NIST AC-2': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-2',
  'NIST AC-3': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-3',
  'NIST IA-5': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=IA-5',
  'NIST': 'https://csrc.nist.gov/Projects/access-control-policy-tool',
  'CIS AWS': 'https://www.cisecurity.org/benchmark/amazon_web_services',
  'CIS Azure': 'https://www.cisecurity.org/benchmark/azure',
  'CIS GCP': 'https://www.cisecurity.org/benchmark/google_cloud_computing_platform',
  'Zero Trust': 'https://www.nist.gov/publications/zero-trust-architecture',
  'AWS Well-Architected': 'https://aws.amazon.com/architecture/well-architected/',
  'SOC 2': 'https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services',
  'ISO 27001': 'https://www.iso.org/isoiec-27001-information-security.html',
}

function getFrameworkLink(f) {
  if (FRAMEWORK_LINKS[f]) return FRAMEWORK_LINKS[f]
  for (const key of Object.keys(FRAMEWORK_LINKS)) {
    if (f.startsWith(key)) return FRAMEWORK_LINKS[key]
  }
  return `https://www.google.com/search?q=${encodeURIComponent(f + ' security framework')}`
}

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(getText()); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }
  return (
    <button onClick={handleCopy} className="text-xs text-slate-400 hover:text-cyan-400 transition flex items-center gap-1">
      {copied ? '✓ Copied' : '📋 Copy'}
    </button>
  )
}

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
}

function LoadingSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-5 w-32" />
        <div className="text-right space-y-1"><SkeletonBlock className="h-3 w-20 ml-auto" /><SkeletonBlock className="h-10 w-24 ml-auto" /></div>
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-20" />
        {[1,2,3].map(i => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 flex gap-3">
            <SkeletonBlock className="h-6 w-16 shrink-0" />
            <div className="flex-1 space-y-2"><SkeletonBlock className="h-4 w-3/4" /><SkeletonBlock className="h-3 w-full" /></div>
          </div>
        ))}
      </div>
      <div className="space-y-2"><SkeletonBlock className="h-3 w-40" /><SkeletonBlock className="h-4 w-full" /><SkeletonBlock className="h-4 w-5/6" /></div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-36" />
        <div className="flex gap-2"><SkeletonBlock className="h-6 w-24 rounded-full" /><SkeletonBlock className="h-6 w-20 rounded-full" /></div>
      </div>
    </div>
  )
}

function AuditResult({ result, expandedFindings, toggleFinding, remediationOpen, setRemediationOpen }) {
  const scoreColor = (s) => s >= 80 ? 'text-red-400' : s >= 50 ? 'text-yellow-400' : 'text-green-400'
  const findingsText = () => result.findings.map(f => `[${f.severity}] ${f.title}\n${f.description}\n${f.explanation || ''}${f.example ? `\nExample: ${f.example}` : ''}`).join('\n\n')
  const remediationText = () => `${result.remediation}\n\nSteps:\n${(result.remediationSteps || []).map((s, i) => `${i+1}. ${s}`).join('\n')}`
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Audit Results</h2>
        <div className="text-right">
          <span className="text-xs text-slate-500 uppercase tracking-widest block">Risk Score</span>
          <span className={`text-4xl font-black ${scoreColor(result.riskScore)}`}>{result.riskScore}<span className="text-lg">/100</span></span>
        </div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Findings</h3>
          <CopyButton getText={findingsText} />
        </div>
        <ul className="space-y-3">
          {result.findings.map((f, i) => (
            <li key={i} className="bg-slate-800 rounded-lg overflow-hidden">
              <button onClick={() => toggleFinding(i)} className="w-full flex gap-3 items-start p-4 text-left transition">
                <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                  f.severity === 'CRITICAL' ? 'bg-red-900 text-red-300' :
                  f.severity === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                  f.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'
                }`}>{f.severity}</span>
                <div className="flex-1">
                  <p className="text-slate-200 text-sm font-semibold">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-1">{f.description}</p>
                </div>
                <span className="text-slate-500 text-xs mt-1 shrink-0">{expandedFindings[i] ? '▲ Less' : '▼ Why?'}</span>
              </button>
              {expandedFindings[i] && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                  <p className="text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-1">Why this matters</p>
                  <p className="text-slate-300 text-sm leading-relaxed">{f.explanation}</p>
                  {f.example && (
                    <div className="mt-2 bg-slate-900 rounded p-3">
                      <p className="text-slate-500 text-xs mb-1">Example of risk:</p>
                      <p className="text-slate-400 text-xs font-mono">{f.example}</p>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="flex justify-between items-center">
          <button onClick={() => setRemediationOpen(!remediationOpen)} className="flex-1 flex justify-between items-center text-left">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Remediation Summary</h3>
            <span className="text-xs text-cyan-500">{remediationOpen ? '▲ Hide Steps' : '▼ Show Fix Steps'}</span>
          </button>
          <CopyButton getText={remediationText} />
        </div>
        <p className="text-slate-300 text-sm leading-relaxed mt-2">{result.remediation}</p>
        {remediationOpen && result.remediationSteps && (
          <ol className="mt-3 space-y-2">
            {result.remediationSteps.map((step, i) => (
              <li key={i} className="flex gap-3 bg-slate-800 rounded-lg p-3">
                <span className="text-cyan-400 font-bold text-sm shrink-0">{i + 1}.</span>
                <p className="text-slate-300 text-sm">{step}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Framework Alignment</h3>
        <div className="flex flex-wrap gap-2">
          {result.frameworks.map((f, i) => (
            <a key={i} href={getFrameworkLink(f)} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-700 px-3 py-1 rounded-full hover:bg-cyan-800/60 hover:text-white transition">
              {f} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function GitHubBadges() {
  const [stars, setStars] = useState(null)
  const [lastCommit, setLastCommit] = useState(null)

  useEffect(() => {
    fetch('https://api.github.com/repos/TGKDre/sentryiq')
      .then(r => r.json())
      .then(d => setStars(d.stargazers_count ?? 0))
      .catch(() => {})
    fetch('https://api.github.com/repos/TGKDre/sentryiq/commits?per_page=1')
      .then(r => r.json())
      .then(d => {
        const date = d?.[0]?.commit?.committer?.date
        if (date) {
          const diff = Math.floor((Date.now() - new Date(date)) / 86400000)
          setLastCommit(diff === 0 ? 'today' : diff === 1 ? '1 day ago' : `${diff} days ago`)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      <a href="https://github.com/TGKDre/sentryiq" target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-3 py-1.5 rounded-full transition">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
        ⭐ {stars !== null ? stars : '—'}
      </a>
      <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full">
        🕐 Last commit: {lastCommit ?? '—'}
      </span>
      <span className="flex items-center gap-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-full">
        v0.5
      </span>
    </div>
  )
}

function AboutFooter() {
  return (
    <footer className="mt-16 border-t border-slate-800 pt-10 pb-8">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-slate-200 font-bold text-lg mb-1">About SentryIQ</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">
          SentryIQ is an open-source AI-powered IAM security auditor built as a portfolio project by{' '}
          <a href="https://github.com/TGKDre" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition">Andre Uzoukwu</a>,
          a cloud security and IAM engineer based in Houston, TX.
          It analyzes AWS IAM, Azure Entra, and GCP IAM policies against multiple compliance frameworks using GPT-4o-mini.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 mb-6">
          {[
            { label: 'Next.js 14', href: 'https://nextjs.org' },
            { label: 'Tailwind CSS', href: 'https://tailwindcss.com' },
            { label: 'OpenAI GPT-4o-mini', href: 'https://platform.openai.com' },
            { label: 'Vercel', href: 'https://vercel.com' },
            { label: 'GitHub', href: 'https://github.com/TGKDre/sentryiq' },
          ].map(t => (
            <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer"
              className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full hover:text-slate-300 hover:border-slate-500 transition">
              {t.label}
            </a>
          ))}
        </div>
        <GitHubBadges />
        <p className="text-slate-600 text-xs mt-6">
          Built for portfolio &amp; educational purposes. Not a substitute for a professional security audit.
        </p>
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <a href="https://github.com/TGKDre/sentryiq" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition">View on GitHub ↗</a>
          <a href="https://github.com/TGKDre" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition">@TGKDre ↗</a>
        </div>
      </div>
    </footer>
  )
}

export default function Home() {
  const [mode, setMode] = useState('audit')
  const [provider, setProvider] = useState('aws')
  const [compliance, setCompliance] = useState('general')
  const [policy, setPolicy] = useState('')
  const [policyBefore, setPolicyBefore] = useState('')
  const [policyAfter, setPolicyAfter] = useState('')
  const [result, setResult] = useState(null)
  const [diffResult, setDiffResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedFindings, setExpandedFindings] = useState({})
  const [expandedDiffFindings, setExpandedDiffFindings] = useState({ before: {}, after: {} })
  const [remediationOpen, setRemediationOpen] = useState(false)
  const [sampleOpen, setSampleOpen] = useState(false)

  const providerData = CLOUD_PROVIDERS[provider]
  const complianceLabel = COMPLIANCE_MODES.find(c => c.value === compliance)?.label

  async function handleAudit() {
    setLoading(true); setResult(null); setError(null); setExpandedFindings({}); setRemediationOpen(false)
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policy, provider, compliance }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setResult(data)
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  async function handleDiff() {
    setLoading(true); setDiffResult(null); setError(null); setExpandedDiffFindings({ before: {}, after: {} })
    try {
      const [resBefore, resAfter] = await Promise.all([
        fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policy: policyBefore, provider, compliance }) }),
        fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policy: policyAfter, provider, compliance }) })
      ])
      const [before, after] = await Promise.all([resBefore.json(), resAfter.json()])
      if (!resBefore.ok) throw new Error(before.error || 'Before audit failed')
      if (!resAfter.ok) throw new Error(after.error || 'After audit failed')
      setDiffResult({ before, after })
    } catch (e) { setError(e.message) } finally { setLoading(false) }
  }

  function handleClear() {
    setPolicy(''); setPolicyBefore(''); setPolicyAfter('')
    setResult(null); setDiffResult(null); setError(null)
    setExpandedFindings({}); setExpandedDiffFindings({ before: {}, after: {} })
    setRemediationOpen(false); setSampleOpen(false)
  }

  const toggleFinding = (i) => setExpandedFindings(prev => ({ ...prev, [i]: !prev[i] }))
  const toggleDiffFinding = (side, i) => setExpandedDiffFindings(prev => ({ ...prev, [side]: { ...prev[side], [i]: !prev[side][i] } }))
  const scoreDelta = diffResult ? diffResult.after.riskScore - diffResult.before.riskScore : 0

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">SentryIQ</h1>
        <p className="text-slate-400 mt-2 text-sm">AI-Powered IAM Risk Auditor · AWS · Azure · GCP</p>
        <div className="flex justify-center gap-3 mt-3">
          <a href="https://github.com/TGKDre/sentryiq" target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-cyan-400 transition">GitHub ↗</a>
          <span className="text-slate-700">|</span>
          <span className="text-xs text-slate-600">Built by <a href="https://github.com/TGKDre" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-cyan-400 transition">Andre Uzoukwu</a></span>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-6">
        {['audit', 'diff'].map(m => (
          <button key={m} onClick={() => { setMode(m); handleClear() }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              mode === m ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}>
            {m === 'audit' ? '🔍 Audit Policy' : '📄 Policy Diff'}
          </button>
        ))}
      </div>

      {/* Provider + Compliance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-slate-400 text-xs uppercase tracking-widest block mb-2">Cloud Provider</label>
          <div className="flex gap-2">
            {Object.entries(CLOUD_PROVIDERS).map(([key, val]) => (
              <button key={key} onClick={() => { setProvider(key); setPolicy(''); setResult(null); setDiffResult(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition border ${
                  provider === key ? 'bg-cyan-900/60 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}>
                {val.icon} {val.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs uppercase tracking-widest block mb-2">Compliance Mode</label>
          <select value={compliance} onChange={e => setCompliance(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500">
            {COMPLIANCE_MODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {/* Audit Mode */}
      {mode === 'audit' && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <label className="text-slate-300 font-semibold text-sm uppercase tracking-widest">{providerData.label} Policy JSON</label>
            <div className="flex gap-3">
              <button onClick={() => setSampleOpen(!sampleOpen)} className="text-xs text-cyan-500 hover:text-cyan-300 transition">{sampleOpen ? 'Hide Samples ▲' : 'Load Sample ▼'}</button>
              {(policy || result) && <button onClick={handleClear} className="text-xs text-slate-500 hover:text-red-400 transition">✕ Clear</button>}
            </div>
          </div>
          {sampleOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {Object.entries(providerData.samples).map(([key, val]) => (
                <button key={key} onClick={() => { setPolicy(val.policy); setSampleOpen(false) }}
                  className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 transition">{val.label}</button>
              ))}
            </div>
          )}
          <textarea rows={12} value={policy} onChange={e => setPolicy(e.target.value)} placeholder={providerData.placeholder}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none" />
          <div className="mt-2 text-xs text-slate-600">Compliance: <span className="text-slate-400">{complianceLabel}</span></div>
          <button onClick={handleAudit} disabled={loading || !policy.trim()}
            className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analyzing policy...
              </span>
            ) : 'Run AI Audit'}
          </button>
        </div>
      )}

      {/* Diff Mode */}
      {mode === 'diff' && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-slate-300 font-semibold text-sm uppercase tracking-widest">Policy Diff Tool</h2>
            {(policyBefore || policyAfter || diffResult) && <button onClick={handleClear} className="text-xs text-slate-500 hover:text-red-400 transition">✕ Clear</button>}
          </div>
          <p className="text-slate-500 text-xs">Paste before and after versions to compare risk scores and findings side-by-side.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-widest block mb-2">Before (Old Policy)</label>
              <textarea rows={10} value={policyBefore} onChange={e => setPolicyBefore(e.target.value)} placeholder={`Paste old ${providerData.label} policy...`}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none" />
            </div>
            <div>
              <label className="text-slate-400 text-xs uppercase tracking-widest block mb-2">After (New Policy)</label>
              <textarea rows={10} value={policyAfter} onChange={e => setPolicyAfter(e.target.value)} placeholder={`Paste new ${providerData.label} policy...`}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none" />
            </div>
          </div>
          <div className="text-xs text-slate-600">Compliance: <span className="text-slate-400">{complianceLabel}</span></div>
          <button onClick={handleDiff} disabled={loading || !policyBefore.trim() || !policyAfter.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Comparing policies...
              </span>
            ) : 'Compare Policies'}
          </button>
        </div>
      )}

      {error && <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 text-red-300 text-sm mb-6">{error}</div>}
      {loading && <LoadingSkeleton />}

      {!loading && result && mode === 'audit' && (
        <AuditResult result={result} expandedFindings={expandedFindings} toggleFinding={toggleFinding} remediationOpen={remediationOpen} setRemediationOpen={setRemediationOpen} />
      )}

      {!loading && diffResult && mode === 'diff' && (
        <div className="space-y-4">
          <div className={`rounded-xl p-4 border text-center ${
            scoreDelta > 0 ? 'bg-red-900/30 border-red-600' : scoreDelta < 0 ? 'bg-green-900/30 border-green-600' : 'bg-slate-800 border-slate-600'
          }`}>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Risk Score Change</p>
            <p className={`text-3xl font-black ${scoreDelta > 0 ? 'text-red-400' : scoreDelta < 0 ? 'text-green-400' : 'text-slate-400'}`}>
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} points
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {diffResult.before.riskScore} → {diffResult.after.riskScore}
              {scoreDelta > 0 ? ' — Policy became more risky' : scoreDelta < 0 ? ' — Policy improved' : ' — No change in risk'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Before</p>
              <AuditResult result={diffResult.before} expandedFindings={expandedDiffFindings.before} toggleFinding={(i) => toggleDiffFinding('before', i)} remediationOpen={false} setRemediationOpen={() => {}} />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">After</p>
              <AuditResult result={diffResult.after} expandedFindings={expandedDiffFindings.after} toggleFinding={(i) => toggleDiffFinding('after', i)} remediationOpen={false} setRemediationOpen={() => {}} />
            </div>
          </div>
        </div>
      )}

      <AboutFooter />
    </main>
  )
}
