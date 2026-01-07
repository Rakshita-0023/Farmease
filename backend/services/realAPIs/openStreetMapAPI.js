const axios = require('axios');

// LAYER 2: REAL OPENSTREETMAP API INTEGRATION
// For finding actual nearby agricultural markets and mandis

class OpenStreetMapAPI {
  constructor() {
    // Multiple Overpass API endpoints for redundancy
    this.overpassURLs = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.openstreetmap.ru/api/interpreter'
    ];
    this.currentOverpassIndex = 0;
    this.nominatimURL = 'https://nominatim.openstreetmap.org';
    this.timeout = 25000; // 25 seconds for complex queries
  }

  /**
   * Find real nearby agricultural markets using Overpass API
   * OPTIMIZED: Simplified query with fallback servers and simpler fallback query
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude  
   * @param {number} radius - Search radius in meters
   * @returns {Promise<Array>} Array of real market locations
   */
  async findNearbyMarkets(lat, lng, radius = 50000) { // Default 50km
    try {
      console.log(`🗺️ OPTIMIZED SEARCH: Finding agricultural markets within ${radius/1000}km of ${lat}, ${lng}`);

      // Try the optimized query first
      let markets = await this.tryOverpassQuery(lat, lng, radius, 'optimized');
      
      // If no results, try a simpler fallback query
      if (markets.length === 0) {
        console.log('🗺️ No results from optimized query, trying simple fallback...');
        markets = await this.tryOverpassQuery(lat, lng, radius, 'simple');
      }
      
      return markets;

    } catch (error) {
      console.error('❌ All OpenStreetMap queries failed:', error.message);
      return [];
    }
  }

  /**
   * Try different Overpass queries with fallback servers
   */
  async tryOverpassQuery(lat, lng, radius, queryType = 'optimized') {
    try {
      let overpassQuery;
      
      if (queryType === 'simple') {
        // Ultra-simple query - just look for nodes with "mandi" in the name
        overpassQuery = `
          [out:json][timeout:20];
          (
            node["name"~"[Mm]andi"](around:${radius},${lat},${lng});
          );
          out center meta;
        `;
        console.log('🗺️ Using SIMPLE query (mandi names only)');
      } else {
        // Optimized query - focus on most common agricultural market types
        overpassQuery = `
          [out:json][timeout:30];
          (
            node["amenity"="marketplace"](around:${radius},${lat},${lng});
            node["name"~"[Mm]andi"](around:${radius},${lat},${lng});
            node["name"~"APMC|apmc"](around:${radius},${lat},${lng});
            node["landuse"="marketplace"](around:${radius},${lat},${lng});
          );
          out center meta;
        `;
        console.log('🗺️ Using OPTIMIZED query (multiple market types)');
      }

      // Try multiple Overpass servers for redundancy
      let response = null;
      let lastError = null;
      
      for (let i = 0; i < this.overpassURLs.length; i++) {
        const overpassURL = this.overpassURLs[(this.currentOverpassIndex + i) % this.overpassURLs.length];
        console.log(`🗺️ Trying Overpass server ${i + 1}/${this.overpassURLs.length}: ${overpassURL}`);
        
        try {
          response = await axios.post(overpassURL, overpassQuery, {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'text/plain',
              'User-Agent': 'FarmEase-Agricultural-Platform/1.0'
            }
          });
          
          console.log(`✅ Overpass server ${i + 1} responded with status:`, response.status);
          this.currentOverpassIndex = (this.currentOverpassIndex + i) % this.overpassURLs.length; // Remember working server
          break;
          
        } catch (error) {
          console.warn(`⚠️ Overpass server ${i + 1} failed:`, error.message);
          lastError = error;
          continue;
        }
      }
      
      if (!response) {
        throw lastError || new Error('All Overpass servers failed');
      }

      if (!response.data || !response.data.elements) {
        console.warn('⚠️ No marketplace data returned from Overpass API');
        return [];
      }

      const elements = response.data.elements;
      console.log(`🗺️ ${queryType.toUpperCase()} SEARCH RESULTS: Found ${elements.length} marketplace elements`);

      if (elements.length === 0) {
        console.warn(`⚠️ Zero marketplaces found with ${queryType} query`);
        return [];
      }

      // STEP 2: Transform and filter for agricultural markets
      const allMarkets = elements.map((element, index) => {
        // Get coordinates (handle both nodes and ways)
        const coordinates = this.getElementCoordinates(element);
        if (!coordinates) return null;

        // Calculate distance from user location
        const distance = this.calculateDistance(lat, lng, coordinates.lat, coordinates.lng);

        // Extract market information
        const tags = element.tags || {};
        let name = tags.name || 
                   tags['name:en'] || 
                   null; // Don't create fake names

        // Skip markets without proper names unless they have strong agricultural indicators
        if (!name) {
          const hasStrongIndicators = tags.amenity === 'marketplace' || 
                                    tags.landuse === 'marketplace' ||
                                    /mandi|apmc/i.test(tags.shop || '');
          
          if (!hasStrongIndicators) {
            return null; // Skip unnamed markets without strong indicators
          }
          
          // Only for strong indicators, create a descriptive name
          name = tags.amenity === 'marketplace' ? 'Local Marketplace' :
                 tags.landuse === 'marketplace' ? 'Market Area' :
                 'Agricultural Market';
        }

        return {
          id: `osm-${element.type}-${element.id}`,
          name: name,
          lat: coordinates.lat,
          lng: coordinates.lng,
          distance: Math.round(distance * 100) / 100,
          
          // Market details from OSM tags
          address: this.buildAddress(tags),
          city: tags['addr:city'] || tags.place || 'Unknown',
          state: tags['addr:state'] || 'Unknown',
          country: tags['addr:country'] || 'India',
          
          // Raw OSM data for filtering
          amenity: tags.amenity,
          landuse: tags.landuse,
          shop: tags.shop,
          raw_tags: tags,
          
          // Market type and features
          marketType: this.determineMarketType(tags),
          openingHours: tags.opening_hours || 'Unknown',
          phone: tags.phone || tags['contact:phone'] || null,
          website: tags.website || tags['contact:website'] || null,
          
          // OSM metadata
          osm_type: element.type,
          osm_id: element.id,
          source: 'OpenStreetMap',
          
          // Additional features
          facilities: this.extractFacilities(tags),
          lastUpdated: element.timestamp || new Date().toISOString()
        };
      }).filter(market => market !== null);

      console.log(`🗺️ TRANSFORMED: ${allMarkets.length} valid marketplace entries`);

      // STEP 3: Filter for agricultural markets using backend logic
      const agriculturalMarkets = this.filterAgriculturalMarkets(allMarkets);
      console.log(`🗺️ AGRICULTURAL FILTER: ${agriculturalMarkets.length}/${allMarkets.length} are agricultural markets`);

      // STEP 4: Sort by distance and add verification
      const verifiedMarkets = agriculturalMarkets.map(market => ({
        ...market,
        verification_status: 'osm_verified',
        is_agricultural: true,
        commodities: [], // Will be filled by price API
        commodityCount: 0,
        avgPrice: 0,
        rating: null // OSM doesn't have ratings
      })).sort((a, b) => a.distance - b.distance);

      console.log(`✅ ${queryType.toUpperCase()} RESULTS: ${verifiedMarkets.length} verified agricultural markets`);
      
      // Debug logging
      if (verifiedMarkets.length > 0) {
        console.log('🗺️ Sample markets found:');
        verifiedMarkets.slice(0, 3).forEach(market => {
          console.log(`  - ${market.name} (${market.distance}km) - ${market.marketType}`);
        });
      }

      return verifiedMarkets;

    } catch (error) {
      console.error(`❌ ${queryType.toUpperCase()} OpenStreetMap query failed:`, error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.error('❌ OSM Query timed out - server may be overloaded');
      }
      
      if (error.response) {
        console.error('❌ OSM Response Status:', error.response.status);
        if (error.response.status === 504) {
          console.error('❌ Gateway timeout - Overpass server is overloaded');
        }
      }
      
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  async reverseGeocode(lat, lng) {
    try {
      console.log(`📍 Reverse geocoding ${lat}, ${lng}`);

      const response = await axios.get(`${this.nominatimURL}/reverse`, {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 10
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'FarmEase-Agricultural-Platform/1.0'
        }
      });

      if (!response.data) {
        throw new Error('No geocoding data returned');
      }

      const data = response.data;
      const address = data.address || {};

      return {
        city: address.city || address.town || address.village || address.hamlet || 'Unknown',
        district: address.state_district || address.county || address.city || 'Unknown',
        state: address.state || 'Unknown',
        country: address.country || 'India',
        postcode: address.postcode || null,
        formatted_address: data.display_name || 'Unknown Location'
      };

    } catch (error) {
      console.error('❌ Reverse geocoding failed:', error.message);
      return {
        city: 'Unknown',
        district: 'Unknown', 
        state: 'Unknown',
        country: 'India',
        postcode: null,
        formatted_address: 'Unknown Location'
      };
    }
  }

  /**
   * Filter marketplaces to identify agricultural markets
   * CRITICAL: This is where we separate agricultural markets from general markets
   */
  filterAgriculturalMarkets(allMarkets) {
    const agriculturalMarkets = [];
    
    for (const market of allMarkets) {
      let isAgricultural = false;
      let confidence = 0;
      const reasons = [];
      
      const name = (market.name || '').toLowerCase();
      const tags = market.raw_tags || {};
      
      // HIGH CONFIDENCE: Name contains agricultural keywords
      const agriculturalKeywords = [
        'mandi', 'apmc', 'agricultural', 'produce', 'grain', 'crop',
        'vegetable', 'fruit', 'wholesale', 'commodity', 'krishi'
      ];
      
      for (const keyword of agriculturalKeywords) {
        // CRITICAL FIX: Use word boundary matching to avoid "mandir" matching "mandi"
        const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (wordBoundaryRegex.test(name)) {
          confidence += 3;
          reasons.push(`Name contains "${keyword}"`);
          isAgricultural = true;
        }
      }
      
      // MEDIUM CONFIDENCE: Market type indicators
      if (tags.amenity === 'marketplace') {
        confidence += 2;
        reasons.push('Tagged as marketplace');
      }
      
      if (tags.landuse === 'marketplace') {
        confidence += 2;
        reasons.push('Landuse is marketplace');
      }
      
      // MEDIUM CONFIDENCE: Location context
      if (/\bmarket\b/i.test(name) && !/\bsuper\b/i.test(name) && !/\bshopping\b/i.test(name)) {
        confidence += 1;
        reasons.push('Generic market (likely agricultural)');
        isAgricultural = true;
      }
      
      // LOW CONFIDENCE: Commercial areas that might be markets
      if (tags.landuse === 'commercial' && /\bmarket\b/i.test(name)) {
        confidence += 1;
        reasons.push('Commercial area with market name');
        isAgricultural = true;
      }
      
      // EXCLUDE: Clearly non-agricultural markets
      const excludeKeywords = [
        'super', 'shopping', 'mall', 'retail', 'store', 'shop',
        'restaurant', 'food court', 'cinema', 'hotel', 'mandir', 'temple'
      ];
      
      let isExcluded = false;
      for (const exclude of excludeKeywords) {
        // Use word boundary matching for better exclusion
        const excludeRegex = new RegExp(`\\b${exclude}\\b`, 'i');
        if (excludeRegex.test(name)) {
          isExcluded = true;
          reasons.push(`Excluded: contains "${exclude}"`);
          break;
        }
      }
      
      // DECISION: Include if agricultural and not excluded and meets minimum confidence
      if (isAgricultural && !isExcluded && confidence >= 2) { // Raised threshold from 1 to 2
        agriculturalMarkets.push({
          ...market,
          agricultural_confidence: confidence,
          classification_reasons: reasons,
          is_agricultural: true
        });
        
        console.log(`✅ AGRICULTURAL: ${market.name} (confidence: ${confidence}, reasons: ${reasons.join(', ')})`);
      } else {
        console.log(`❌ FILTERED OUT: ${market.name} (excluded: ${isExcluded}, confidence: ${confidence}, reasons: ${reasons.join(', ')})`);
      }
    }
    
    return agriculturalMarkets;
  }

  /**
   * Get coordinates from OSM element (node or way)
   * CRITICAL: This function was accidentally removed - restoring it
   */
  getElementCoordinates(element) {
    if (element.type === 'node') {
      return { lat: element.lat, lng: element.lon };
    } else if (element.type === 'way' && element.center) {
      return { lat: element.center.lat, lng: element.center.lon };
    }
    return null;
  }

  /**
   * Build address string from OSM tags
   */
  buildAddress(tags) {
    const parts = [];
    
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
    if (tags['addr:street']) parts.push(tags['addr:street']);
    if (tags['addr:city']) parts.push(tags['addr:city']);
    if (tags['addr:state']) parts.push(tags['addr:state']);
    if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  }

  /**
   * Determine market type from OSM tags
   */
  determineMarketType(tags) {
    if (tags.shop === 'marketplace') return 'Marketplace';
    if (tags.amenity === 'marketplace') return 'Public Market';
    if (tags.shop === 'wholesale') return 'Wholesale Market';
    if (tags.amenity === 'wholesale_market') return 'Wholesale Market';
    if (tags.landuse === 'commercial') return 'Commercial Market';
    if (tags.name && tags.name.toLowerCase().includes('mandi')) return 'Agricultural Mandi';
    return 'Market';
  }

  /**
   * Extract facilities from OSM tags
   */
  extractFacilities(tags) {
    const facilities = [];
    
    if (tags.parking) facilities.push('Parking');
    if (tags.toilets) facilities.push('Toilets');
    if (tags.wheelchair === 'yes') facilities.push('Wheelchair Access');
    if (tags.internet_access) facilities.push('Internet');
    if (tags.atm === 'yes') facilities.push('ATM');
    if (tags.restaurant || tags.food) facilities.push('Food Court');
    
    return facilities;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      // Test with a simple query
      const response = await axios.get(`${this.nominatimURL}/search`, {
        params: {
          q: 'India',
          format: 'json',
          limit: 1
        },
        timeout: 5000
      });

      return {
        success: true,
        status: response.status,
        message: 'OpenStreetMap API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'OpenStreetMap API connection failed'
      };
    }
  }
}

module.exports = OpenStreetMapAPI;