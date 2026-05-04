export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#d9f2f8,transparent_40%),var(--color-surface-base)] p-4">
      {children}
    </main>
  )
}
