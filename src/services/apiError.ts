export class ApiError extends Error {
  readonly status: number
  readonly retryAfter?: number

  constructor(message: string, status: number, retryAfter?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    if (retryAfter !== undefined) {
      this.retryAfter = retryAfter
    }
  }
}

function readRetryAfterSeconds(response: Response): number | undefined {
  const raw = response.headers.get('Retry-After')
  if (raw === null) return undefined
  const seconds = Number.parseInt(raw, 10)
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined
}

export async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status, readRetryAfterSeconds(response))
  }
  return (await response.json()) as T
}
