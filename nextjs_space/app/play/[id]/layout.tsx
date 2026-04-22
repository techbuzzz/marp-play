import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marp Player - Presentation',
  description: 'View Marp presentation',
}

export default function PlayLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
