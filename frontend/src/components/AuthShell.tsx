import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-berry to-berry-deep text-white p-12">
        <Link to="/" className="font-display text-2xl font-semibold">
          Agamos<span className="text-gold-light">.</span>
        </Link>
        <div>
          <h2 className="font-display italic text-4xl leading-tight mb-4">
            Give what they truly wish for.
          </h2>
          <p className="text-white/70 max-w-sm">
            Create a beautiful page for any celebration and let friends fund the gifts and
            goals that matter — then withdraw straight to your bank.
          </p>
        </div>
        <p className="text-white/50 text-sm">© 2026 Agamos</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="md:hidden font-display text-2xl font-semibold block mb-8">
            Agamos<span className="text-rose">.</span>
          </Link>
          <h1 className="text-3xl font-semibold mb-2">{title}</h1>
          <p className="text-muted mb-7">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-sm text-muted text-center">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
