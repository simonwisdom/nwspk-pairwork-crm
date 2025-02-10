import { ReactNode } from 'react'
import Header from '@/components/dashboard/header'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="py-6 px-8">
        {children}
      </main>
    </div>
  )
} 