# @farmease/sdk

```ts
import { FarmEase } from '@farmease/sdk';
const client = new FarmEase({ baseUrl: 'http://localhost:5000/api/v1' });
const weather = await client.weather.current(28.6, 77.2);
const prices = await client.markets.prices({ commodity: 'wheat' });
const diagnosis = await client.plantDiagnosis(imageBlob, { filename: 'leaf.jpg' });
```

The package is typed, timeout-bound, supports bearer authentication, and normalizes Core errors as `FarmEaseError`.

`plantDiagnosis` accepts a browser `Blob` or `File` and sends it as the `file` part of a multipart request. The SDK leaves the multipart boundary to `fetch` so uploads work in browser and Node 18+ environments.
