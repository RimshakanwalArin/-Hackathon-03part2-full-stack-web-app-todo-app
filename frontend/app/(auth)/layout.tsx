import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - TaskFlow',
  description: 'Login or register to TaskFlow',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950 overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-20 animate-float" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '1s' }} />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
