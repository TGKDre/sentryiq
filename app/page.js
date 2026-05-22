'use client'
import { useState } from 'react'

const SAMPLE_POLICY = JSON.stringify({
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Action: "*",
      Resource: "*"
    },
    {
      Effect: "Allow",
      Action: ["s3:GetObject", "s3:PutObject"],
      Resource: "arn:aws:s3:::my-bucket/*"
    }
  ]
}, null, 2)

export default function Home() {
  const [policy, setPolicy] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleAudit() {
    setLoading(true)
    setResult(null)
    setError(null)
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

  const scoreColor = (score) => {
    if (score >= 80) return 'text-red-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 tracking-tight">SentryIQ</h1>
        <p className="text-slate-400 mt-2 text-sm">AI-Powered IAM Risk Auditor · Built by Andre Uzoukwu</p>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-slate-300 font-semibold text-sm uppercase tracking-widest">IAM Policy JSON</label>
          <button
            onClick={() => setPolicy(SAMPLE_POLICY)}
            className="text-xs text-cyan-500 hover:text-cyan-300 transition"
          >
            Load Sample Policy
          </button>
        </div>
        <textarea
          rows={12}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
          placeholder='Paste your AWS IAM policy JSON here...'
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none"
        />
        <button
          onClick={handleAudit}
          disabled={loading || !policy.trim()}
          className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? 'Analyzing...' : 'Run AI Audit'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-500 rounded-xl p-4 text-red-300 text-sm mb-6">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Audit Results</h2>
            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase tracking-widest block">Risk Score</span>
              <span className={`text-4xl font-black ${scoreColor(result.riskScore)}`}>{result.riskScore}<span className="text-lg">/100</span></span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Findings</h3>
            <ul className="space-y-3">
              {result.findings.map((f, i) => (
                <li key={i} className="flex gap-3 bg-slate-800 rounded-lg p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded h-fit ${
                    f.severity === 'CRITICAL' ? 'bg-red-900 text-red-300' :
                    f.severity === 'HIGH' ? 'bg-orange-900 text-orange-300' :
                    f.severity === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-blue-900 text-blue-300'
                  }`}>{f.severity}</span>
                  <div>
                    <p className="text-slate-200 text-sm font-semibold">{f.title}</p>
                    <p className="text-slate-400 text-xs mt-1">{f.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Remediation Summary</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{result.remediation}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Framework Alignment</h3>
            <div className="flex flex-wrap gap-2">
              {result.frameworks.map((f, i) => (
                <span key={i} className="text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-700 px-3 py-1 rounded-full">{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-slate-600 text-xs mt-10">SentryIQ v0.1 · Phase 1 MVP · andreobiuzo · 2026</p>
    </main>
  )
}
