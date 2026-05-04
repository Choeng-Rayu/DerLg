import Link from 'next/link'
import { CalendarPlus2, Download, LifeBuoy } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ConfirmationActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline">
        <Download className="size-4" />
        Receipt PDF
      </Button>
      <Button type="button" variant="outline">
        <CalendarPlus2 className="size-4" />
        Add to calendar
      </Button>
      <Button variant="outline" asChild={false}>
        <Link href="/contact" className="inline-flex items-center gap-2">
          <LifeBuoy className="size-4" />
          Contact support
        </Link>
      </Button>
    </div>
  )
}
