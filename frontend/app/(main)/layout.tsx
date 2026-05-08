import { BottomNav } from '@/components/layout/BottomNav'
import { TopBar } from '@/components/layout/TopBar'
import { AIChat } from '@/components/chat/AIChat'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-base">
      <TopBar />
      <main id="content" className="pb-24 lg:pb-10">
        {children}
      </main>
      <AIChat />
      <BottomNav />
    </div>
  )
}
