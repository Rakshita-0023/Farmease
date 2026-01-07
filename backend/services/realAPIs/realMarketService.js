const AgmarknetAPI = require('./agmarknetAPI');
const OpenStreetMapAPI = require('./openStreetMapAPI');

// INTEGRATED REAL API SERVICE
// Combines all 3 layers: Agmarknet + OpenStreetMap + Geocoding

class RealMarketService {
  constructor() {
    this.agmarknet = new AgmarknetAPI();
    this.osm = new OpenStreetMapAPI();
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * LAYER 3: Complete integration - Get real nearby markets with live prices
   * This is the main method that combines all APIs
   */
  async getNearbyMarketsWithPrices(lat, lng, radiusKm = 50) {
    try {
      console.log(`🔄 REAL API INTEGRATION: Finding markets with live prices near ${lat}, ${lng}`);
      
      const cacheKey = `markets-${lat}-${lng}-${radiusKm}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 Returning cached market data');
        return cached;
      }

      // STEP 1: Reverse geocode user location
      console.log('📍 Step 1: Reverse geocoding user location...');
      const userLocation = await this.osm.reverseGeocode(lat, lng);
      console.log('📍 User location:', userLocation);

      // STEP 2: Find real nearby markets from OpenStreetMap
      console.log('🗺️ Step 2: Finding real nearby markets...');
      const radiusMeters = radiusKm * 1000;
      const nearbyMarkets = await this.osm.findNearbyMarkets(lat, lng, radiusMeters);
      console.log(`🗺️ Found ${nearbyMarkets.length} real markets`);

      if (nearbyMarkets.length === 0) {
        console.warn('⚠️ No real markets found in the area');
        return {
          success: true,
          userLocation: { lat, lng, ...userLocation },
          markets: [],
          dataSource: 'OpenStreetMap + Agmarknet',
          message: `No agricultural markets found within ${radiusKm}km`,
          timestamp: new Date().toISOString()
        };
      }

      // STEP 3: Get live prices from Agmarknet for the user's location
      console.log('📡 Step 3: Fetching live prices from Agmarknet...');
      const livePrices = await this.agmarknet.fetchMarketPrices({
        state: userLocation.state,
        district: userLocation.district || userLocation.city
      });
      console.log(`📡 Found ${livePrices.length} live price records`);

      // STEP 4: Combine markets with price data
      console.log('🔗 Step 4: Combining markets with price data...');
      const marketsWithPrices = await this.combineMarketsWithPrices(nearbyMarkets, livePrices, userLocation);

      // STEP 5: Sort by distance and relevance
      marketsWithPrices.sort((a, b) => {
        // Prioritize markets with more commodities, then by distance
        if (a.commodityCount !== b.commodityCount) {
          return b.commodityCount - a.commodityCount;
        }
        return a.distance - b.distance;
      });

      const result = {
        success: true,
        userLocation: { lat, lng, ...userLocation },
        markets: marketsWithPrices,
        dataSource: 'OpenStreetMap + Agmarknet (Real APIs)',
        searchRadius: radiusKm,
        totalMarkets: marketsWithPrices.length,
        totalCommodities: livePrices.length,
        timestamp: new Date().toISOString(),
        verification: {
          osm_markets: nearbyMarkets.length,
          agmarknet_prices: livePrices.length,
          combined_results: marketsWithPrices.length
        }
      };

      // Cache the result
      this.setCache(cacheKey, result);
      
      console.log(`✅ REAL API INTEGRATION COMPLETE: ${marketsWithPrices.length} markets with ${livePrices.length} live prices`);
      return result;

    } catch (error) {
      console.error('❌ Real Market Service Error:', error);
      return {
        success: false,
        error: error.message,
        userLocation: { lat, lng },
        markets: [],
        dataSource: 'Error - Real APIs unavailable',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get live market prices for a specific location
   */
  async getLiveMarketPrices(state, district, city) {
    try {
      console.log(`📡 Fetching live prices for ${district || city}, ${state}`);
      
      const cacheKey = `prices-${state}-${district}-${city}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 Returning cached price data');
        return cached;
      }

      // Fetch from Agmarknet
      const prices = await this.agmarknet.fetchMarketPrices({
        state: state,
        district: district || city
      });

      const result = {
        success: true,
        prices: prices,
        location: { state, district: district || city },
        dataSource: 'AGMARKNET - Government of India',
        totalRecords: prices.length,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.setCache(cacheKey, result);
      
      console.log(`✅ Retrieved ${prices.length} live price records`);
      return result;

    } catch (error) {
      console.error('❌ Live prices fetch error:', error);
      return {
        success: false,
        error: error.message,
        prices: [],
        dataSource: 'Error - Agmarknet API unavailable',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Combine OSM markets with Agmarknet price data
   */
  async combineMarketsWithPrices(markets, prices, userLocation) {
    const marketsWithPrices = [];

    for (const market of markets) {
      // Find relevant prices for this market's location
      const relevantPrices = this.findRelevantPrices(market, prices, userLocation);
      
      // Calculate average price
      const avgPrice = relevantPrices.length > 0 
        ? relevantPrices.reduce((sum, p) => sum + p.modal_price, 0) / relevantPrices.length
        : 0;

      // Enhanced market data
      const enhancedMarket = {
        ...market,
        commodities: relevantPrices.map(price => ({
          commodity: price.commodity,
          variety: price.variety,
          price: price.modal_price,
          unit: price.unit,
          trend: price.trend,
          last_updated: price.last_updated,
          source: price.source
        })),
        commodityCount: relevantPrices.length,
        avgPrice: Math.round(avgPrice),
        
        // Real data verification
        hasLivePrices: relevantPrices.length > 0,
        priceDataSource: relevantPrices.length > 0 ? 'AGMARKNET' : 'No price data',
        lastPriceUpdate: relevantPrices.length > 0 
          ? relevantPrices[0].last_updated 
          : null
      };

      marketsWithPrices.push(enhancedMarket);
    }

    return marketsWithPrices;
  }

  /**
   * Find prices relevant to a specific market
   */
  findRelevantPrices(market, allPrices, userLocation) {
    // Strategy: Match by location hierarchy (state > district > city)
    const relevantPrices = allPrices.filter(price => {
      // Exact market name match (best)
      if (price.market && market.name.toLowerCase().includes(price.market.toLowerCase())) {
        return true;
      }
      
      // City/district match (good)
      if (price.district && market.city.toLowerCase().includes(price.district.toLowerCase())) {
        return true;
      }
      
      // State match (acceptable for regional prices)
      if (price.state && market.state.toLowerCase().includes(price.state.toLowerCase())) {
        return true;
      }
      
      return false;
    });

    // If no specific matches, use regional prices from user location
    if (relevantPrices.length === 0) {
      return allPrices.filter(price => 
        price.state === userLocation.state ||
        price.district === userLocation.district
      ).slice(0, 10); // Limit to 10 regional prices
    }

    return relevantPrices;
  }

  /**
   * Test all API connections
   */
  async testAllAPIs() {
    console.log('🧪 Testing all real API connections...');
    
    const results = {
      agmarknet: await this.agmarknet.testConnection(),
      openstreetmap: await this.osm.testConnection(),
      timestamp: new Date().toISOString()
    };

    console.log('🧪 API Test Results:', results);
    return results;
  }

  /**
   * Simple cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

module.exports = RealMarketService;