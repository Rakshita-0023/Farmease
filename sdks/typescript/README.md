# @farmease/sdk

```ts
import { FarmEase } from '@farmease/sdk';
const client = new FarmEase({ baseUrl: 'http://localhost:5000/api/v1' });
const weather = await client.weather.current(28.6, 77.2);
const prices = await client.markets.prices({ commodity: 'wheat' });
```

The package is typed, timeout-bound, supports bearer authentication, and normalizes Core errors as `FarmEaseError`.
