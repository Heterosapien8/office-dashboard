import { Construction } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
//  StubPage — placeholder for pages not yet built
//  Shows the page name and a "coming soon" message
//  Replace with real implementation during the hackathon
// ─────────────────────────────────────────────────────────────
export default function StubPage({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-5">
        <Construction size={32} className="text-primary-500" />
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
      <p className="text-sm text-gray-400 max-w-sm">
        {description ?? 'This module is under active development and will be available soon.'}
      </p>
    </div>
  )
}
