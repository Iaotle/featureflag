import { render, screen, fireEvent } from '@testing-library/react'
import PhotoUpload from '@/components/PhotoUpload'

describe('PhotoUpload', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    // Mock window.prompt
    global.prompt = jest.fn()
  })

  it('should render add photo button', () => {
    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    expect(screen.getByText('+ Add Photo')).toBeInTheDocument()
  })

  it('should display uploaded photos', () => {
    const photos = ['photo1.jpg', 'photo2.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    expect(screen.getByText('photo1.jpg')).toBeInTheDocument()
    expect(screen.getByText('photo2.jpg')).toBeInTheDocument()
  })

  it('should call onChange with new photo when added', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('new-photo.jpg')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith(['new-photo.jpg'])
  })

  it('should not add photo if prompt is cancelled', () => {
    ;(global.prompt as jest.Mock).mockReturnValue(null)

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('should remove photo when remove button clicked', () => {
    const photos = ['photo1.jpg', 'photo2.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    const removeButtons = screen.getAllByText('×')
    fireEvent.click(removeButtons[0])

    expect(mockOnChange).toHaveBeenCalledWith(['photo2.jpg'])
  })

  it('should display feature flag description', () => {
    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    expect(screen.getByText(/feature-flagged/i)).toBeInTheDocument()
  })
})
