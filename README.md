# SentryIQ – AI-Powered IAM Risk Auditor

A portfolio-grade web app that analyzes AWS IAM policies using GPT-4o-mini and returns risk scores, severity-ranked findings, and remediation guidance aligned to NIST, CIS, and Zero Trust frameworks.

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- OpenAI API (gpt-4o-mini)
- Deployed on Vercel

## Setup
1. Clone this repo
2. Run `npm install`
3. Copy `.env.local.example` to `.env.local` and add your OpenAI API key
4. Run `npm run dev`

## Deploy
Push to GitHub and import into Vercel. Add `OPENAI_API_KEY` as an environment variable in the Vercel dashboard.
