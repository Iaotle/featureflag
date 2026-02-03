import { render, screen } from '@testing-library/react'
import PriorityBadge from '@/components/PriorityBadge'
import '@testing-library/jest-dom'

describe('PriorityBadge', () => {
  it('should render low priority badge with correct styles', () => {
    const { container } = render(<PriorityBadge priority="low" />)

    const badge = screen.getByText('low')
    expect(badge).toBeInTheDocument()

    // The parent span has the color classes
    const parentBadge = container.querySelector('.bg-green-100')
    expect(parentBadge).toBeInTheDocument()
    expect(parentBadge).toHaveClass('text-green-800')
  })

  it('should render medium priority badge with correct styles', () => {
    const { container } = render(<PriorityBadge priority="medium" />)

    const badge = screen.getByText('medium')
    expect(badge).toBeInTheDocument()

    const parentBadge = container.querySelector('.bg-yellow-100')
    expect(parentBadge).toBeInTheDocument()
    expect(parentBadge).toHaveClass('text-yellow-800')
  })

  it('should render high priority badge with correct styles', () => {
    const { container } = render(<PriorityBadge priority="high" />)

    const badge = screen.getByText('high')
    expect(badge).toBeInTheDocument()

    const parentBadge = container.querySelector('.bg-red-100')
    expect(parentBadge).toBeInTheDocument()
    expect(parentBadge).toHaveClass('text-red-800')
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

  it('should render N/A for undefined priority', () => {
    render(<PriorityBadge priority={undefined} />)
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })
})
