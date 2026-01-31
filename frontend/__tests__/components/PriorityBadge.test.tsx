import { render, screen } from '@testing-library/react'
import PriorityBadge from '@/components/PriorityBadge'

describe('PriorityBadge', () => {
  it('should render low priority badge with correct styles', () => {
    render(<PriorityBadge priority="low" />)

    const badge = screen.getByText('low')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should render medium priority badge with correct styles', () => {
    render(<PriorityBadge priority="medium" />)

    const badge = screen.getByText('medium')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('should render high priority badge with correct styles', () => {
    render(<PriorityBadge priority="high" />)

    const badge = screen.getByText('high')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('should display priority icon for low', () => {
    render(<PriorityBadge priority="low" />)
    expect(screen.getByText('●')).toBeInTheDocument()
  })

  it('should display priority icon for medium', () => {
    render(<PriorityBadge priority="medium" />)
    expect(screen.getByText('▲')).toBeInTheDocument()
  })

  it('should display priority icon for high', () => {
    render(<PriorityBadge priority="high" />)
    expect(screen.getByText('⬆')).toBeInTheDocument()
  })
})
