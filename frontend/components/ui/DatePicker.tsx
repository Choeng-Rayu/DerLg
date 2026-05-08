import { Input } from '@/components/ui/Input'

export function DatePicker({
  label,
  value,
  onChange,
  min,
}: {
  label: string
  value?: string
  onChange: (value: string) => void
  min?: string
}) {
  return (
    <Input
      label={label}
      type="date"
      value={value}
      min={min}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
