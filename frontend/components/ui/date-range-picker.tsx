import { DatePicker } from '@/components/ui/date-picker'

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: {
  startDate?: string
  endDate?: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DatePicker label="Start date" value={startDate} onChange={onStartDateChange} />
      <DatePicker label="End date" value={endDate} onChange={onEndDateChange} min={startDate} />
    </div>
  )
}
