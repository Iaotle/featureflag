import { render, screen, fireEvent } from '@testing-library/react'
import PhotoUpload from '@/components/PhotoUpload'
import '@testing-library/jest-dom'

describe('PhotoUpload', () => {
  const mockOnChange = jest.fn()
  const mockAlert = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockAlert.mockClear()
    global.prompt = jest.fn()
    global.alert = mockAlert
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render add photo button', () => {
    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    expect(screen.getByText('+ Add Photo')).toBeInTheDocument()
  })

  it('should display uploaded photos', () => {
    const photos = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    expect(screen.getByText('https://example.com/photo1.jpg')).toBeInTheDocument()
    expect(screen.getByText('https://example.com/photo2.jpg')).toBeInTheDocument()
  })

  it('should call onChange with new photo when valid URL added', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('https://example.com/new-photo.jpg')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/new-photo.jpg'])
  })

  it('should accept http URLs', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('http://example.com/photo.jpg')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith(['http://example.com/photo.jpg'])
    expect(mockAlert).not.toHaveBeenCalled()
  })

  it('should accept https URLs', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('https://example.com/photo.jpg')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/photo.jpg'])
    expect(mockAlert).not.toHaveBeenCalled()
  })

  it('should reject invalid URLs and show alert', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('invalid-url')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).not.toHaveBeenCalled()
    expect(mockAlert).toHaveBeenCalledWith('Please enter a valid http/https URL.')
  })

  it('should reject non-http/https URLs', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('ftp://example.com/photo.jpg')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).not.toHaveBeenCalled()
    expect(mockAlert).toHaveBeenCalledWith('Please enter a valid http/https URL.')
  })

  it('should not add photo if prompt is cancelled', () => {
    ;(global.prompt as jest.Mock).mockReturnValue(null)

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).not.toHaveBeenCalled()
    expect(mockAlert).not.toHaveBeenCalled()
  })

  it('should not add photo if prompt returns empty string', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).not.toHaveBeenCalled()
    expect(mockAlert).not.toHaveBeenCalled()
  })

  it('should trim whitespace from URL', () => {
    ;(global.prompt as jest.Mock).mockReturnValue('  https://example.com/photo.jpg  ')

    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/photo.jpg'])
  })

  it('should remove photo when remove button clicked', () => {
    const photos = ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove photo/i })
    fireEvent.click(removeButtons[0])

    expect(mockOnChange).toHaveBeenCalledWith(['https://example.com/photo2.jpg'])
  })

  it('should remove correct photo from middle of list', () => {
    const photos = [
      'https://example.com/photo1.jpg',
      'https://example.com/photo2.jpg',
      'https://example.com/photo3.jpg',
    ]
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove photo/i })
    fireEvent.click(removeButtons[1]) // Remove middle photo

    expect(mockOnChange).toHaveBeenCalledWith([
      'https://example.com/photo1.jpg',
      'https://example.com/photo3.jpg',
    ])
  })

  it('should display feature flag description', () => {
    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    expect(screen.getByText(/feature-flagged/i)).toBeInTheDocument()
  })

  it('should render images for uploaded photos', () => {
    const photos = ['https://example.com/photo.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    const img = screen.getByRole('img', { name: /damage photo 1/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('should add new photo to existing list', () => {
    const existingPhotos = ['https://example.com/existing.jpg']
    ;(global.prompt as jest.Mock).mockReturnValue('https://example.com/new.jpg')

    render(<PhotoUpload photos={existingPhotos} onChange={mockOnChange} />)

    fireEvent.click(screen.getByText('+ Add Photo'))

    expect(mockOnChange).toHaveBeenCalledWith([
      'https://example.com/existing.jpg',
      'https://example.com/new.jpg',
    ])
  })

  it('should handle removing last photo', () => {
    const photos = ['https://example.com/only-photo.jpg']
    render(<PhotoUpload photos={photos} onChange={mockOnChange} />)

    const removeButton = screen.getByRole('button', { name: /remove photo/i })
    fireEvent.click(removeButton)

    expect(mockOnChange).toHaveBeenCalledWith([])
  })

  it('should display photos label', () => {
    render(<PhotoUpload photos={[]} onChange={mockOnChange} />)

    expect(screen.getByText('Photos')).toBeInTheDocument()
  })
})
