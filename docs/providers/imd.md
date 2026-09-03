# IMD provider research

**Status: researched, not implemented.**

IMD’s official [API landing page](https://mausam.imd.gov.in/responsive/apis.php)
links to its API documentation and an IP-whitelisting process. The official
[API document](https://mausam.imd.gov.in/imd_latest/contents/api.pdf) lists city
forecast, current weather, district nowcast/rainfall/warning, and station
nowcast endpoints. A more recent IMD notice also directs organizations to the
public API reference and says they should contact the IMD nodal officer when
using the APIs under IMD terms.

FarmEase will not enable an IMD adapter by default in this release. The published
material does not give this project a durable, self-service credential/usage
agreement, the examples are largely city/station-ID oriented rather than the
Core’s coordinate contract, and the landing page explicitly mentions
whitelisting. Implementing one responsibly requires confirmation of production
access, attribution, permitted caching/redistribution, quotas, and a stable
location lookup. Until then users can select the implemented keyless
`open-meteo` provider.

Before implementation, record the approved terms, configure IMD credentials or
network identity only through ignored environment variables, mock all upstream
responses in tests, and map IMD values to the `WeatherProvider` contract without
inventing missing metrics.
