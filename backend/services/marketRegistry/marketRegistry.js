// MARKET REGISTRY - Bridge between Agmarknet and OpenStreetMap
// This is the single source of truth for market mapping

class MarketRegistry {
  constructor() {
    // In-memory registry (in production, this would be a database table)
    this.registry = new Map();
    this.initializeRegistry();
  }

  /**
   * Initialize registry with known market mappings
   * In production, this would be loaded from database
   */
  initializeRegistry() {
    // Sample registry entries - in production, this would be populated from database
    const knownMappings = [
      {
        market_id: 'mandi_hyd_001',
        canonical_name: 'Hyderabad Agricultural Market',
        agmarknet_names: ['Hyderabad Mandi', 'Hyderabad', 'Hyderabad Market'],
        osm_names: ['Agricultural Market Hyderabad', 'Hyderabad Mandi', 'Market Yard Hyderabad'],
        district: 'Hyderabad',
        state: 'Telangana',
        lat: 17.385,
        lng: 78.4867,
        verified: true
      },
      {
        market_id: 'mandi_war_001',
        canonical_name: 'Warangal Agricultural Market',
        agmarknet_names: ['Warangal Mandi', 'Warangal', 'Warangal Market'],
        osm_names: ['Agricultural Market Warangal', 'Warangal Mandi'],
        district: 'Warangal',
        state: 'Telangana',
        lat: 17.9689,
        lng: 79.5941,
        verified: true
      },
      {
        market_id: 'mandi_gun_001',
        canonical_name: 'Guntur Agricultural Market',
        agmarknet_names: ['Guntur Mandi', 'Guntur', 'Guntur Market'],
        osm_names: ['Agricultural Market Guntur', 'Guntur Mandi'],
        district: 'Guntur',
        state: 'Andhra Pradesh',
        lat: 16.3067,
        lng: 80.4365,
        verified: true
      }
    ];

    knownMappings.forEach(mapping => {
      this.registry.set(mapping.market_id, mapping);
    });

    console.log(`📦 Market Registry initialized with ${this.registry.size} verified mappings`);
  }

  /**
   * Normalize market name for matching
   */
  normalizeMarketName(name) {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .replace(/\b(mandi|market|agricultural|produce|committee|yard|apmc)\b/g, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Find market registry entry by Agmarknet market name
   */
  findByAgmarknetName(agmarknetName, district, state) {
    const normalizedInput = this.normalizeMarketName(agmarknetName);
    
    for (const [marketId, entry] of this.registry) {
      // Check district and state match first
      if (entry.district.toLowerCase() !== district.toLowerCase() ||
          entry.state.toLowerCase() !== state.toLowerCase()) {
        continue;
      }
      
      // Check exact normalized match
      for (const agmarknetVariant of entry.agmarknet_names) {
        const normalizedVariant = this.normalizeMarketName(agmarknetVariant);
        if (normalizedInput === normalizedVariant) {
          return entry;
        }
      }
      
      // Check fuzzy match (threshold: 2 character differences)
      for (const agmarknetVariant of entry.agmarknet_names) {
        const normalizedVariant = this.normalizeMarketName(agmarknetVariant);
        const distance = this.levenshteinDistance(normalizedInput, normalizedVariant);
        if (distance <= 2 && normalizedVariant.length > 3) {
          console.log(`🔗 Fuzzy match: "${agmarknetName}" → "${entry.canonical_name}" (distance: ${distance})`);
          return entry;
        }
      }
    }
    
    return null;
  }

  /**
   * Find market registry entry by OSM market data
   */
  findByOSMData(osmMarket, district, state) {
    const normalizedInput = this.normalizeMarketName(osmMarket.name);
    
    for (const [marketId, entry] of this.registry) {
      // Check district and state match first (if available)
      if (district && state) {
        if (entry.district.toLowerCase() !== district.toLowerCase() ||
            entry.state.toLowerCase() !== state.toLowerCase()) {
          continue;
        }
      }
      
      // Check coordinate proximity (within 5km)
      const distance = this.calculateDistance(
        osmMarket.lat, osmMarket.lng,
        entry.lat, entry.lng
      );
      
      if (distance > 5) continue; // Too far to be the same market
      
      // Check exact normalized match
      for (const osmVariant of entry.osm_names) {
        const normalizedVariant = this.normalizeMarketName(osmVariant);
        if (normalizedInput === normalizedVariant) {
          return entry;
        }
      }
      
      // Check fuzzy match with coordinate proximity
      for (const osmVariant of entry.osm_names) {
        const normalizedVariant = this.normalizeMarketName(osmVariant);
        const nameDistance = this.levenshteinDistance(normalizedInput, normalizedVariant);
        if (nameDistance <= 2 && normalizedVariant.length > 3 && distance <= 2) {
          console.log(`🗺️ OSM fuzzy match: "${osmMarket.name}" → "${entry.canonical_name}" (name distance: ${nameDistance}, geo distance: ${distance}km)`);
          return entry;
        }
      }
    }
    
    return null;
  }

  /**
   * Create new registry entry for unmatched markets
   */
  createRegistryEntry(agmarknetData, osmData) {
    const marketId = `mandi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entry = {
      market_id: marketId,
      canonical_name: osmData ? osmData.name : agmarknetData.market,
      agmarknet_names: agmarknetData ? [agmarknetData.market] : [],
      osm_names: osmData ? [osmData.name] : [],
      district: agmarknetData ? agmarknetData.district : (osmData ? osmData.city : 'Unknown'),
      state: agmarknetData ? agmarknetData.state : (osmData ? osmData.state : 'Unknown'),
      lat: osmData ? osmData.lat : null,
      lng: osmData ? osmData.lng : null,
      verified: false, // New entries need manual verification
      created_at: new Date().toISOString()
    };
    
    this.registry.set(marketId, entry);
    console.log(`📝 Created new registry entry: ${entry.canonical_name} (${marketId})`);
    
    return entry;
  }

  /**
   * Get all verified markets within radius
   */
  getVerifiedMarketsInRadius(userLat, userLng, radiusKm) {
    const verifiedMarkets = [];
    
    for (const [marketId, entry] of this.registry) {
      if (!entry.verified || !entry.lat || !entry.lng) continue;
      
      const distance = this.calculateDistance(userLat, userLng, entry.lat, entry.lng);
      if (distance <= radiusKm) {
        verifiedMarkets.push({
          ...entry,
          distance: Math.round(distance * 100) / 100
        });
      }
    }
    
    // Sort by distance
    verifiedMarkets.sort((a, b) => a.distance - b.distance);
    
    return verifiedMarkets;
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
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const total = this.registry.size;
    const verified = Array.from(this.registry.values()).filter(entry => entry.verified).length;
    const withCoordinates = Array.from(this.registry.values()).filter(entry => entry.lat && entry.lng).length;
    
    return {
      total_entries: total,
      verified_entries: verified,
      entries_with_coordinates: withCoordinates,
      verification_rate: total > 0 ? Math.round((verified / total) * 100) : 0
    };
  }

  /**
   * Export registry for debugging
   */
  exportRegistry() {
    return Array.from(this.registry.entries()).map(([id, entry]) => ({
      id,
      ...entry
    }));
  }
}

module.exports = MarketRegistry;