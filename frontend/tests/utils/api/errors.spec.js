import { extractApiErrorMessage } from '../../../src/utils/api/errors'

describe('extractApiErrorMessage', () => {
  it('returns backend message when present', () => {
    const message = extractApiErrorMessage(
      { response: { data: { message: 'Project title is required.' } } },
      'Fallback'
    )

    expect(message).toBe('Project title is required.')
  })

  it('joins validation messages when backend returns errors object', () => {
    const message = extractApiErrorMessage(
      {
        response: {
          data: {
            errors: {
              title: ['Title is required.'],
              description: ['Description is too long.'],
            },
          },
        },
      },
      'Fallback'
    )

    expect(message).toBe('Title is required. Description is too long.')
  })

  it('returns a friendly message for network failures', () => {
    const message = extractApiErrorMessage({ code: 'ERR_NETWORK' }, 'Fallback')
    expect(message).toContain('Cannot connect to API')
  })

  it('falls back when no response details are available', () => {
    const message = extractApiErrorMessage({}, 'Something went wrong.')
    expect(message).toBe('Something went wrong.')
  })
})
