import './globals.css'

export const metadata = {
  title: 'SentryIQ – AI-Powered IAM Risk Auditor',
  description: 'Paste an IAM policy and get an instant AI-powered risk analysis.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
