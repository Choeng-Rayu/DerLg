import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders button text', () => {
    render(<Button>Book now</Button>)
    expect(screen.getByRole('button', { name: /book now/i })).toBeInTheDocument()
  })
})
