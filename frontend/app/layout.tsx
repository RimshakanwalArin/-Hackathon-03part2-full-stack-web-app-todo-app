import type { Metadata, Viewport } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'Task management with authentication',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
