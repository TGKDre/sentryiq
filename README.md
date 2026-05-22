# SentryIQ — AI-Powered IAM Risk Auditor

![SentryIQ](https://img.shields.io/badge/SentryIQ-v0.5-cyan?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**Live Demo → [sentryiq-five.vercel.app](https://sentryiq-five.vercel.app)**

SentryIQ is an open-source, AI-powered IAM security auditing tool that analyzes AWS IAM, Azure Entra, and GCP IAM policies and surfaces real security risks with severity ratings, exploit explanations, and actionable remediation steps — all mapped to your chosen compliance framework.

---

## Features

- **Multi-Cloud Support** — Analyze AWS IAM, Azure Entra role definitions, and GCP IAM bindings
- **Compliance Mode Selector** — Tailor findings to NIST SP 800-53, CIS Benchmarks, Zero Trust Architecture, or SOC 2 Type II
- **AI Risk Scoring** — GPT-4o-mini assigns a 0–100 risk score with severity-rated findings (CRITICAL / HIGH / MEDIUM / LOW)
- **Expandable Findings** — Each finding includes a "Why this matters" explanation and a concrete exploit example
- **Policy Diff Tool** — Paste before/after versions of a policy and compare risk scores side-by-side
- **Remediation Steps** — Step-by-step fix instructions tailored to the cloud provider
- **Framework Badge Links** — Clickable compliance badges link directly to NIST, CIS, and other standard references
- **Sample Policies** — Pre-loaded samples across the full risk spectrum for quick demos
- **Loading Skeleton + Spinner** — Polished UX with animated skeletons during AI analysis
- **Copy to Clipboard** — Export findings and remediation with one click

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| AI Engine | OpenAI GPT-4o-mini |
| Deployment | Vercel |
| Language | JavaScript (React) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An OpenAI API key

### Local Setup

```bash
git clone https://github.com/TGKDre/sentryiq.git
cd sentryiq
npm install
```

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

1. Select your **cloud provider** (AWS / Azure / GCP)
2. Choose a **compliance mode** (General, NIST, CIS, Zero Trust, SOC 2)
3. Paste a policy JSON or load a sample
4. Click **Run AI Audit** to get a full risk report
5. Use the **Policy Diff** tab to compare two versions of a policy

---

## Project Structure

```
sentryiq/
├── app/
│   ├── page.js          # Main UI
│   ├── layout.js        # Root layout
│   ├── globals.css      # Tailwind base styles
│   └── api/
│       └── audit/
│           └── route.js # OpenAI audit API route
├── public/
├── .env.local           # API key (not committed)
└── README.md
```

---

## Compliance Modes

| Mode | Frameworks Referenced |
|---|---|
| General Best Practices | Cloud provider best practices |
| NIST SP 800-53 | AC-2, AC-3, AC-6, IA-5, AU-2 |
| CIS Benchmarks | CIS AWS / Azure / GCP Foundations |
| Zero Trust Architecture | NIST SP 800-207 |
| SOC 2 Type II | CC6, CC7, CC9 |

---

## About

Built by **Andre Uzoukwu** — cloud security and IAM engineer based in Houston, TX.

This project is part of an active IAM/cloud security portfolio demonstrating practical skills in:
- Identity and Access Management (IAM)
- Multi-cloud security architecture
- AI-assisted security tooling
- Compliance framework mapping (NIST, CIS, SOC 2, Zero Trust)

**GitHub:** [@TGKDre](https://github.com/TGKDre)

---

## License

MIT — free to use, fork, and build on.

> Built for portfolio and educational purposes. Not a substitute for a professional security audit.
