'use client'
import { useState } from 'react'

const SAMPLE_POLICIES = {
  critical: {
    label: '🔴 Critical – Full Admin Wildcard',
    policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: '*', Resource: '*' }] }, null, 2)
  },
  high: {
    label: '🟠 High – Overprivileged S3 + IAM',
    policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:*', 'iam:CreateUser', 'iam:AttachUserPolicy'], Resource: '*' }, { Effect: 'Allow', Action: 'ec2:Describe*', Resource: '*' }] }, null, 2)
  },
  medium: {
    label: '🟡 Medium – Read-Heavy, No MFA Condition',
    policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject', 's3:ListBucket', 'cloudwatch:GetMetricData', 'logs:DescribeLogGroups'], Resource: '*' }] }, null, 2)
  },
  low: {
    label: '🟢 Low – Scoped Read-Only',
    policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['s3:GetObject'], Resource: 'arn:aws:s3:::my-secure-bucket/*', Condition: { Bool: { 'aws:MultiFactorAuthPresent': 'true' } } }] }, null, 2)
  },
  stale: {
    label: '🔴 Critical – Stale Keys + Cross-Account',
    policy: JSON.stringify({ Version: '2012-10-17', Statement: [{ Effect: 'Allow', Action: ['sts:AssumeRole'], Resource: 'arn:aws:iam::*:role/*' }, { Effect: 'Allow', Action: ['secretsmanager:GetSecretValue', 'ssm:GetParameters'], Resource: '*' }, { Effect: 'Allow', Action: ['kms:Decrypt', 'kms:GenerateDataKey'], Resource: '*' }] }, null, 2)
  }
}

const FRAMEWORK_LINKS = {
  'NIST': 'https://csrc.nist.gov/Projects/access-control-policy-tool',
  'NIST AC-6': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-6',
  'NIST AC-2': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-2',
  'NIST AC-3': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=AC-3',
  'NIST IA-5': 'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#!/control?version=5.1&number=IA-5',
  'CIS AWS 1.16': 'https://www.cisecurity.org/benchmark/amazon_web_services',
  'CIS AWS': 'https://www.cisecurity.org/benchmark/amazon_web_services',
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
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
    >
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
        <div className="text-right space-y-1">
          <SkeletonBlock className="h-3 w-20 ml-auto" />
          <SkeletonBlock className="h-10 w-24 ml-auto" />
        </div>
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-20" />
        {[1,2,3].map(i => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 flex gap-3">
            <SkeletonBlock className="h-6 w-16 shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-3/4" />
              <SkeletonBlock className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-40" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-5/6" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-36" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-6 w-24 rounded-full" />
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="h-6 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [policy, setPolicy] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedFindings, setExpandedFindings] = useState({})
  const [remediationOpen, setRemediationOpen] = useState(false)
  const [sampleOpen, setSampleOpen] = useState(false)

  async function handleAudit() {
    setLoading(true)
    setResult(null)
    setError(null)
    setExpandedFindings({})
    setRemediationOpen(false)
    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Audit failed')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setPolicy('')
    setResult(null)
    setError(null)
    setExpandedFindings({})
    setRemediationOpen(false)
    setSampleOpen(false)
  }

  const scoreColor = (score) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const toggleFinding = (i) => setExpandedFindings(prev => ({ ...prev, [i]: !prev[i] }))

  const findingsText = (findings) =>
    findings.map((f, i) => `[${f.severity}] ${f.title}\n${f.description}\n${f.explanation || ''}${f.example ? `\nExample: ${f.example}` : ''}`).join('\n\n')

  const remediationText = (result) =>
    `${result.remediation}\n\nSteps:\n${(result.remediationSteps || []).map((s, i) => `${i+1}. ${s}`).join('\n')}`

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">SentryIQ</h1>
        <p className="text-slate-400 mt-2 text-sm">AI-Powered IAM Risk Auditor · Built by Andre Uzoukwu</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-300 font-semibold text-sm uppercase tracking-widest">IAM Policy JSON</label>
          <div className="flex gap-3">
            <button onClick={() => setSampleOpen(!sampleOpen)} className="text-xs text-cyan-500 hover:text-cyan-300 transition">
              {sampleOpen ? 'Hide Samples ▲' : 'Load Sample ▼'}
            </button>
            {(policy || result) && (
              <button onClick={handleClear} className="text-xs text-slate-500 hover:text-red-400 transition">
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {sampleOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {Object.entries(SAMPLE_POLICIES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => { setPolicy(val.policy); setSampleOpen(false) }}
                className="text-left text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 transition"
              >
                {val.label}
              </button>
            ))}
          </div>
        )}

        <textarea
          rows={12}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder="Paste your AWS IAM policy JSON here..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none"
        />
        <button
          onClick={handleAudit}
          disabled={loading || !policy.trim()}
          className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition relative overflow-hidden"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analyzing policy...
            </span>
          ) : 'Run AI Audit'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && <LoadingSkeleton />}

      {!loading && result && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Audit Results</h2>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-widest block">Risk Score</span>
              <span className={`text-4xl font-black ${scoreColor(result.riskScore)}`}>
                {result.riskScore}<span className="text-lg">/100</span>
              </span>
            </div>
          </div>

          {/* Findings */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Findings</h3>
              <CopyButton getText={() => findingsText(result.findings)} />
            </div>
            <ul className="space-y-3">
              {result.findings.map((f, i) => (
                <li key={i} className="bg-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleFinding(i)}
                    className="w-full flex gap-3 items-start p-4 text-left hover:bg-slate-750 transition"
                  >
                    <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      f.severity === 'CRITICAL' ? 'bg-red-900 text-red-300' :
                      f.severity === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                      f.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-blue-900 text-blue-300'
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

          {/* Remediation */}
          <div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setRemediationOpen(!remediationOpen)}
                className="flex-1 flex justify-between items-center text-left"
              >
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Remediation Summary</h3>
                <span className="text-xs text-cyan-500">{remediationOpen ? '▲ Hide Steps' : '▼ Show Fix Steps'}</span>
              </button>
              <CopyButton getText={() => remediationText(result)} />
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

          {/* Framework Alignment */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Framework Alignment</h3>
            <p className="text-slate-500 text-xs mb-2">Click any badge to view the referenced standard.</p>
            <div className="flex flex-wrap gap-2">
              {result.frameworks.map((f, i) => (
                <a
                  key={i}
                  href={getFrameworkLink(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-700 px-3 py-1 rounded-full hover:bg-cyan-800/60 hover:text-white transition"
                >
                  {f} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-10">SentryIQ v0.3 · andreobiuzo · 2026</p>
    </main>
  )
}
