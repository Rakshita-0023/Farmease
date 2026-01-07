const axios = require('axios');

// LAYER 1: REAL AGMARKNET API INTEGRATION
// Official Government of India Agricultural Marketing API

class AgmarknetAPI {
  constructor() {
    // Official Agmarknet API endpoints
    this.baseURL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    this.apiKey = process.env.AGMARKNET_API_KEY || '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
    this.timeout = 10000; // 10 seconds
  }

  /**
   * Fetch live market prices from official Agmarknet API
   * @param {Object} params - Query parameters
   * @param {string} params.state - State name
   * @param {string} params.district - District name
   * @param {string} params.market - Market name (optional)
   * @param {string} params.commodity - Commodity name (optional)
   * @returns {Promise<Array>} Array of market price records
   */
  async fetchMarketPrices({ state, district, market, commodity }) {
    try {
      console.log('📡 Fetching REAL Agmarknet data for:', { state, district, market, commodity });

      const params = {
        'api-key': this.apiKey,
        'format': 'json',
        'limit': 100, // Increased limit for more data
        'offset': 0
      };

      // Add filters based on available parameters
      if (state) {
        params['filters[state]'] = state;
      }
      if (district) {
        params['filters[district]'] = district;
      }
      if (market) {
        params['filters[market]'] = market;
      }
      if (commodity) {
        params['filters[commodity]'] = commodity;
      }

      const response = await axios.get(this.baseURL, {
        params,
        timeout: this.timeout,
        headers: {
          'User-Agent': 'FarmEase-Agricultural-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      console.log('📡 Agmarknet API Response Status:', response.status);
      console.log('📡 Agmarknet API Response Headers:', response.headers['content-type']);

      if (!response.data || !response.data.records) {
        console.warn('⚠️ Agmarknet API returned no records');
        return [];
      }

      const records = response.data.records;
      console.log(`✅ Agmarknet API returned ${records.length} records`);

      // Transform Agmarknet data to our standard format
      const transformedData = records.map((record, index) => ({
        // Standard fields
        id: `agmarknet-${record.state}-${record.district}-${record.market}-${record.commodity}-${index}`,
        commodity: record.commodity,
        variety: record.variety || 'Standard',
        market: record.market,
        district: record.district,
        state: record.state,
        
        // Price data
        min_price: parseFloat(record.min_price) || 0,
        max_price: parseFloat(record.max_price) || 0,
        modal_price: parseFloat(record.modal_price) || 0,
        
        // Date and source information
        date: record.arrival_date,
        last_updated: record.arrival_date ? new Date(record.arrival_date).toISOString() : new Date().toISOString(),
        
        // REAL API verification fields
        source: 'AGMARKNET - Government of India',
        unit: 'quintal', // Standard unit for Agmarknet
        market_id: `agmarknet-${record.market?.toLowerCase().replace(/\s+/g, '-')}-${record.district?.toLowerCase()}`,
        verification_status: 'agmarknet_verified',
        data_freshness: this.calculateFreshness(record.arrival_date),
        
        // Additional metadata
        api_source: 'agmarknet',
        fetch_timestamp: new Date().toISOString(),
        
        // Calculate trend (simplified - would need historical data for real trends)
        trend: this.calculateTrend(record.min_price, record.max_price, record.modal_price)
      }));

      // Filter out invalid records
      const validRecords = transformedData.filter(record => 
        record.commodity && 
        record.market && 
        record.modal_price > 0
      );

      console.log(`✅ Processed ${validRecords.length}/${transformedData.length} valid Agmarknet records`);
      return validRecords;

    } catch (error) {
      console.error('❌ Agmarknet API Error:', error.message);
      
      if (error.response) {
        console.error('❌ API Response Status:', error.response.status);
        console.error('❌ API Response Data:', error.response.data);
      }
      
      // Don't throw - return empty array to allow fallback
      return [];
    }
  }

  /**
   * Get available states from Agmarknet
   */
  async getAvailableStates() {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          'api-key': this.apiKey,
          'format': 'json',
          'limit': 1000
        },
        timeout: this.timeout
      });

      if (!response.data?.records) return [];

      // Extract unique states
      const states = [...new Set(response.data.records.map(record => record.state))];
      return states.filter(state => state && state.trim());

    } catch (error) {
      console.error('❌ Failed to fetch available states:', error.message);
      return [];
    }
  }

  /**
   * Get available districts for a state
   */
  async getAvailableDistricts(state) {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          'api-key': this.apiKey,
          'format': 'json',
          'filters[state]': state,
          'limit': 1000
        },
        timeout: this.timeout
      });

      if (!response.data?.records) return [];

      // Extract unique districts
      const districts = [...new Set(response.data.records.map(record => record.district))];
      return districts.filter(district => district && district.trim());

    } catch (error) {
      console.error('❌ Failed to fetch available districts:', error.message);
      return [];
    }
  }

  /**
   * Calculate data freshness based on arrival date
   */
  calculateFreshness(arrivalDate) {
    if (!arrivalDate) return 'unknown';
    
    const date = new Date(arrivalDate);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours <= 24) return 'fresh';
    if (diffHours <= 72) return 'recent';
    return 'stale';
  }

  /**
   * Calculate simple trend based on price range
   */
  calculateTrend(minPrice, maxPrice, modalPrice) {
    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || 0;
    const modal = parseFloat(modalPrice) || 0;
    
    if (modal > (min + max) / 2) return 'up';
    if (modal < (min + max) / 2) return 'down';
    return 'stable';
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      const response = await axios.get(this.baseURL, {
        params: {
          'api-key': this.apiKey,
          'format': 'json',
          'limit': 1
        },
        timeout: 5000
      });

      return {
        success: true,
        status: response.status,
        message: 'Agmarknet API connection successful'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Agmarknet API connection failed'
      };
    }
  }
}

module.exports = AgmarknetAPI;