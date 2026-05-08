'use client'

import { localeLabels } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'
import { Card } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'

export function Preferences() {
  const language = useAppStore((state) => state.language)
  const currency = useAppStore((state) => state.currency)
  const setLanguage = useAppStore((state) => state.setLanguage)
  const setCurrency = useAppStore((state) => state.setCurrency)

  return (
    <Card>
      <h2 className="text-lg font-semibold">Preferences</h2>
      <div className="mt-4 grid gap-4">
        <Select
          value={language}
          onChange={(event) => setLanguage(event.target.value as 'en' | 'kh' | 'zh')}
          options={Object.entries(localeLabels).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Select
          value={currency}
          onChange={(event) => setCurrency(event.target.value as 'USD' | 'KHR' | 'CNY')}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'KHR', value: 'KHR' },
            { label: 'CNY', value: 'CNY' },
          ]}
        />
      </div>
    </Card>
  )
}
