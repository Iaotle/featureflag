import { getUserId, fetchFlags } from '@/lib/flags'

describe('getUserId', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should create and store a new user ID if none exists', () => {
    const userId = getUserId()

    expect(userId).toBeTruthy()
    expect(localStorage.setItem).toHaveBeenCalledWith('feature_flag_user_id', userId)
  })

  it('should return existing user ID from localStorage', () => {
    const existingId = 'existing-user-123'
    const mockGetItem = localStorage.getItem as jest.Mock
    mockGetItem.mockReturnValue(existingId)

    const userId = getUserId()

    expect(userId).toBe(existingId)
    expect(localStorage.getItem).toHaveBeenCalledWith('feature_flag_user_id')
  })

  it('should return server-side-render for SSR', () => {
    const originalWindow = global.window
    delete (global as any).window

    const userId = getUserId()
    expect(userId).toBe('server-side-render')

    global.window = originalWindow
  })
})

describe('fetchFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const mockGetItem = localStorage.getItem as jest.Mock
    mockGetItem.mockReturnValue('test-user-123')
  })

  it('should fetch flags from API', async () => {
    const mockResponse = {
      flag1: true,
      flag2: false,
    }

    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/flags/check',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    expect(result).toEqual(mockResponse)
  })

  it('should return all false flags on API error', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    })

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(result).toEqual({
      flag1: false,
      flag2: false,
    })
  })

  it('should return all false flags on network error', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockRejectedValue(new Error('Network error'))

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(result).toEqual({
      flag1: false,
      flag2: false,
    })
  })

  it('should include user_id in request body', async () => {
    const mockFetch = global.fetch as jest.Mock
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    await fetchFlags(['test_flag'])

    const callArgs = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = JSON.parse(callArgs[1].body)

    expect(requestBody).toHaveProperty('user_id')
    expect(requestBody).toHaveProperty('flags', ['test_flag'])
  })
})
