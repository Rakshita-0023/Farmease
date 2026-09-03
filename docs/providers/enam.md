# eNAM provider research

**Status: researched, not implemented.**

The official [eNAM portal](https://www.enam.gov.in/) describes eNAM as the
national electronic trading portal connecting APMC mandis. Its public commodity
[listing](https://www.enam.gov.in/web/commodity/commodity-list) is useful for
future controlled vocabulary research. The public eNAM integration material is
an [empanelment/RFQ notice](https://enam.gov.in/web/assest/download/sul/Application%20Notice-RFQ-Empanelment_of_Service_Providers_for_integration_with_National_Agriculture_Market_eNAM.pdf),
which discusses onboarding and API development with eNAM rather than publishing a
general-purpose, unauthenticated market-data API contract.

Accordingly, FarmEase does not scrape the portal, call undocumented endpoints, or
claim an eNAM provider. A future implementation needs written access approval,
the authorised API specification, authentication/onboarding rules, rate limits,
redistribution permissions, and a mapping between eNAM data semantics and the
FarmEase commodity/location/price schemas. AGMARKNET/data.gov.in remains the only
implemented live market-price source in Core v1.
