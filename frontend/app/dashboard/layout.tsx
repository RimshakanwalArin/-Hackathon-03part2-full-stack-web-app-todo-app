'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sparkles, LogOut, Menu, X, CheckSquare, Clock, BarChart3 } from 'lucide-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    router.push('/')
  }

  const navItems = [
    {
      href: '/dashboard/tasks',
      label: 'All Tasks',
      icon: BarChart3,
      active: pathname === '/dashboard/tasks',
    },
    {
      href: '/dashboard/tasks/pending',
      label: 'Pending',
      icon: Clock,
      active: pathname === '/dashboard/tasks/pending',
    },
    {
      href: '/dashboard/tasks/completed',
      label: 'Completed',
      icon: CheckSquare,
      active: pathname === '/dashboard/tasks/completed',
    },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-950">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full blur-3xl opacity-10 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-3xl opacity-10 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 backdrop-blur-3xl bg-slate-950/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TaskFlow</h1>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </motion.div>

            {/* Desktop Navigation & Logout */}
            <div className="hidden md:flex items-center gap-8">
              <nav className="flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          item.active
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                            : 'text-gray-400 hover:text-cyan-400 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </motion.button>
                    </Link>
                  )
                })}
              </nav>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-2 border-t border-white/10 pt-4"
            >
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        item.active
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'text-gray-400 hover:text-cyan-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </motion.button>
                  </Link>
                )
              })}
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={handleLogout}
                className="w-full px-4 py-2 rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        {children}
      </main>
    </div>
  )
}
