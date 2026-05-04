import { AIChat } from '@/components/chat/AIChat'
import { PageContainer } from '@/components/layout/PageContainer'

export default function ChatPage() {
  return (
    <PageContainer className="py-8">
      <h1 className="mb-4 text-[length:var(--fluid-h2)] font-semibold">AI planner</h1>
      <AIChat />
    </PageContainer>
  )
}
