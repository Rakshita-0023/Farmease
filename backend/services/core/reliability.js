const { normalizeProviderError } = require('./providerError');

const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

const requestWithReliability = async ({ providerId, operation, request, retries = 2, backoffMs = 100, sleep = wait, logger }) => {
  let attempt = 0;
  while (true) {
    const startedAt = Date.now();
    try {
      const value = await request();
      logger?.info('provider.request', { provider: providerId, operation, attempt: attempt + 1, latencyMs: Date.now() - startedAt, outcome: 'success' });
      return value;
    } catch (cause) {
      const error = normalizeProviderError(cause, providerId);
      logger?.warn('provider.request', { provider: providerId, operation, attempt: attempt + 1, latencyMs: Date.now() - startedAt, outcome: 'error', code: error.code });
      if (!error.retryable || attempt >= retries) throw error;
      await sleep(backoffMs * (2 ** attempt));
      attempt += 1;
    }
  }
};

class TtlCache {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry || entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    return value;
  }
}

const stableKey = (value) => JSON.stringify(value, Object.keys(value).sort());

class ProviderExecutor {
  constructor({ cache = new TtlCache(), logger = console } = {}) {
    this.cache = cache;
    this.logger = logger;
  }

  async execute({ provider, operation, input, requestId, ttlMs }) {
    const key = `${provider.id}:${operation}:${stableKey(input)}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      this.logger?.info('provider.cache', { provider: provider.id, operation, requestId, cache: 'hit' });
      return { value: cached, cache: 'hit' };
    }
    this.logger?.info('provider.cache', { provider: provider.id, operation, requestId, cache: 'miss' });
    const startedAt = Date.now();
    const value = await provider[operation](input);
    if (ttlMs > 0) this.cache.set(key, value, ttlMs);
    this.logger?.info('provider.latency', { provider: provider.id, operation, requestId, latencyMs: Date.now() - startedAt, cache: 'miss' });
    return { value, cache: 'miss' };
  }
}

const structuredLogger = (base = console) => ({
  info: (event, fields) => base.log(JSON.stringify({ level: 'info', event, ...fields })),
  warn: (event, fields) => base.warn(JSON.stringify({ level: 'warn', event, ...fields }))
});

module.exports = { requestWithReliability, TtlCache, ProviderExecutor, structuredLogger, wait };
