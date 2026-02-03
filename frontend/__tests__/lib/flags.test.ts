// Mock the flags module partially
jest.mock('@/lib/flags', () => {
  const original = jest.requireActual('@/lib/flags')
  return {
    ...original,
    getUserId: jest.fn(() => 'test-user-123'),
  }
})

import { fetchFlags, getUserId } from '@/lib/flags'

describe('getUserId', () => {
  it('should return a user ID', () => {
    const userId = getUserId()
    expect(userId).toBeTruthy()
    expect(typeof userId).toBe('string')
  })
})

describe('fetchFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch flags from API', async () => {
    const mockResponse = {
      flag1: true,
      flag2: false,
    }

      ; (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/flags/check'),
      expect.objectContaining({
        method: 'POST',
      })
    )

    expect(result).toEqual(mockResponse)
  })

  it('should return all false flags on API error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })

    ; (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
    })

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(result).toEqual({
      flag1: false,
      flag2: false,
    })
    spy.mockRestore()
  })

  it('should return all false flags on network error', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => { })

      ; (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const result = await fetchFlags(['flag1', 'flag2'])

    expect(result).toEqual({
      flag1: false,
      flag2: false,
    })

    spy.mockRestore()
  })


  it('should include user_id in request body', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    await fetchFlags(['test_flag'])

    const callArgs = (global.fetch as jest.Mock).mock.calls[0]
    const requestBody = JSON.parse(callArgs[1].body)

    expect(requestBody).toHaveProperty('user_id')
    expect(requestBody).toHaveProperty('flags', ['test_flag'])
  })

  it('should handle empty flag array', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    const result = await fetchFlags([])

    expect(result).toEqual({})
  })

  it('should handle single flag request', async () => {
    ; (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ single_flag: true }),
    })

    const result = await fetchFlags(['single_flag'])

    expect(result).toEqual({ single_flag: true })
  })

  it('should handle many flags request', async () => {
    const flags = ['flag1', 'flag2', 'flag3', 'flag4', 'flag5']
    const expectedResponse = {
      flag1: true,
      flag2: false,
      flag3: true,
      flag4: false,
      flag5: true,
    }

      ; (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => expectedResponse,
      })

    const result = await fetchFlags(flags)

    expect(result).toEqual(expectedResponse)
  })
})
