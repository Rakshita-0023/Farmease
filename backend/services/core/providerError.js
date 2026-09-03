class ProviderError extends Error {
  constructor(code, message, { status = 502, cause, retryable = false } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'ProviderError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

const isTimeout = (cause) => ['ECONNABORTED', 'ETIMEDOUT', 'ESOCKETTIMEDOUT'].includes(cause?.code);

const normalizeProviderError = (cause, providerId) => {
  if (cause instanceof ProviderError) return cause;
  if (isTimeout(cause)) {
    return new ProviderError('PROVIDER_TIMEOUT', `${providerId} did not respond before the request timeout`, {
      status: 504, cause, retryable: true
    });
  }
  if (cause?.response?.status >= 500 || cause?.code === 'ENOTFOUND' || cause?.code === 'ECONNREFUSED') {
    return new ProviderError('PROVIDER_UNAVAILABLE', `${providerId} is currently unavailable`, {
      status: 503, cause, retryable: true
    });
  }
  return new ProviderError('PROVIDER_BAD_RESPONSE', `${providerId} returned an invalid response`, { status: 502, cause });
};

module.exports = { ProviderError, normalizeProviderError };
