import { Link } from 'react-router-dom'
import { Scale } from 'lucide-react'

export function Brand({ compact = false }) {
  return <Link to="/" className="brand" aria-label="Lexora home"><span className="brand__mark"><Scale size={22} strokeWidth={1.9} /></span>{!compact && <span><strong>Lexora</strong><small>Legal Academy</small></span>}</Link>
}
