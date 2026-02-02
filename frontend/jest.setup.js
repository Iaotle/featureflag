import '@testing-library/jest-dom'

// Mock uuid module
jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234-5678-9012',
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return ''
  },
  useParams() {
    return {}
  },
}))

// Mock window.localStorage with proper jest functions
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Mock fetch
global.fetch = jest.fn()
