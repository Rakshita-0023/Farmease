# Implementation Plan: Unified Smart Agriculture Dashboard

## Overview

This implementation plan breaks down the unified dashboard feature into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The plan follows a bottom-up approach: utilities → services → components → integration.

## Tasks

- [ ] 1. Set up utility functions and helpers
  - [ ] 1.1 Create farming advice generator utility
    - Implement `generateCropAdvice(weather)` function
    - Implement `generateIrrigationAdvice(weather, forecast)` function
    - Implement `generateWeatherAlert(weather)` function
    - Add logic for temperature-based crop recommendations
    - Add logic for humidity/rain-based irrigation advice
    - Add logic for weather alert levels (green/yellow/red)
    - _Requirements: US-2.1, US-2.2_
  
  - [ ]* 1.2 Write property test for crop advice generation
    - **Property 1: Crop advice consistency**
    - Generate random weather data (temp, condition, humidity)
    - Verify advice is non-empty string for all valid inputs
    - Verify advice changes when temperature crosses thresholds (15°C, 25°C, 35°C)
    - **Validates: Requirements US-2.2**
  
  - [ ]* 1.3 Write property test for irrigation advice generation
    - **Property 2: Irrigation advice consistency**
    - Generate random weather and forecast data
    - Verify advice is non-empty string for all valid inputs
    - Verify "skip watering" when rain expected or present
    - **Validates: Requirements US-2.2**
  
  - [ ]* 1.4 Write property test for weather alert generation
    - **Property 3: Weather alert levels**
    - Generate random weather data (temp, wind, condition)
    - Verify alert has valid level (green/yellow/red)
    - Verify red alert for extreme temps (>40°C or <5°C)
    - Verify yellow alert for high winds (>25 km/h)
    - **Validates: Requirements US-2.2**
  
  - [ ] 1.5 Create farm statistics calculator utility
    - Implement `calculateFarmStats(farms)` function
    - Calculate totalFarms (array length)
    - Calculate activeCrops (count where status='active')
    - Calculate harvestReady (count where progress≥90)
    - Calculate healthScore (average health, rounded)
    - Handle empty array edge case
    - _Requirements: US-6.1_
  
  - [ ]* 1.6 Write property test for farm statistics calculation
    - **Property 5: Farm Statistics Computation**
    - Generate random farm arrays with varying sizes (0-50 farms)
    - Generate random farm properties (status, progress, health)
    - Verify totalFarms equals array length
    - Verify activeCrops count matches filter
    - Verify harvestReady count matches progress≥90 filter
    - Verify healthScore equals rounded average
    - **Validates: Requirements US-6.1**

- [ ] 2. Checkpoint - Ensure utility tests pass
  - Run all utility tests
  - Verify property tests pass with 100+ iterations
  - Ask user if questions arise

- [ ] 3. Enhance weather service and caching
  - [ ] 3.1 Update weather cache TTL to 10 minutes
    - Modify `frontend/src/services/weatherCache.js`
    - Change CACHE_TTL from 2 minutes to 10 minutes (600000ms)
    - Update cache expiration logic
    - Add logging for cache hits/misses
    - _Requirements: TR-1.3_
  
  - [ ]* 3.2 Write property test for weather cache TTL
    - **Property 9: Weather Cache TTL Enforcement**
    - Generate random coordinates (lat, lon)
    - Fetch weather data, record API call count
    - Make requests at t=0, t=5min, t=11min
    - Verify cache hit at t=5min (no new API call)
    - Verify cache miss at t=11min (new API call)
    - **Validates: Requirements TR-1.3**
  
  - [ ] 3.3 Create unified weather service wrapper
    - Create `frontend/src/services/weatherService.js`
    - Implement `getCurrentWeather(lat, lon)` method
    - Implement `getForecast(lat, lon)` method
    - Implement `getWeatherData(lat, lon)` method (combines both)
    - Integrate with existing weatherCache
    - Add error handling and retry logic
    - _Requirements: TR-1.1, TR-1.2_
  
  - [ ]* 3.4 Write unit test for single weather API call
    - **Example 13: Single Weather API Call**
    - Mock weather API endpoint
    - Call getWeatherData()
    - Verify API called exactly once
    - Verify both current and forecast data returned
    - **Validates: Requirements TR-1.2**

- [ ] 4. Build core dashboard components
  - [ ] 4.1 Create CompactWeatherCard component
    - Create `frontend/src/components/Dashboard/CompactWeatherCard.jsx`
    - Accept props: weather, location, loading
    - Display temperature, condition icon, location
    - Display humidity, wind speed, rain probability
    - Apply glassmorphism styling (backdrop-blur-xl, bg-white/10)
    - Add loading skeleton state
    - _Requirements: US-3.1, US-3.2, US-3.3_
  
  - [ ]* 4.2 Write property test for weather card completeness
    - **Property 2: Weather Card Completeness**
    - Generate random weather objects with all 6 fields
    - Render CompactWeatherCard
    - Verify all 6 fields present in output (temperature, icon, location, humidity, wind, rain)
    - **Validates: Requirements US-3.2**
  
  - [ ]* 4.3 Write unit test for weather card styling
    - **Example 5: Glassmorphism Styling**
    - Render CompactWeatherCard
    - Verify CSS classes: backdrop-blur-xl, bg-white/10, border-white/10
    - **Validates: Requirements US-3.3**
  
  - [ ] 4.4 Create FarmConditionsSection with three advice cards
    - Create `frontend/src/components/Dashboard/FarmConditionsSection.jsx`
    - Create `frontend/src/components/Dashboard/CropAdviceCard.jsx`
    - Create `frontend/src/components/Dashboard/IrrigationAdviceCard.jsx`
    - Create `frontend/src/components/Dashboard/WeatherAlertCard.jsx`
    - Wire up advice generators from utilities
    - Apply color coding to WeatherAlertCard (green/yellow/red)
    - Use 3-column grid layout
    - _Requirements: US-2.1_
  
  - [ ]* 4.5 Write unit test for three cards presence
    - **Example 3: Farm Conditions Three Cards**
    - Render FarmConditionsSection with weather data
    - Verify exactly 3 cards rendered
    - Verify cards are CropAdviceCard, IrrigationAdviceCard, WeatherAlertCard
    - **Validates: Requirements US-2.1**
  
  - [ ]* 4.6 Write property test for weather data reactivity
    - **Property 1: Weather Data Reactivity**
    - Generate random initial weather data
    - Render FarmConditionsSection
    - Generate new random weather data
    - Update component props
    - Verify all 3 cards display updated content
    - **Validates: Requirements US-2.2**

- [ ] 5. Build farm statistics components
  - [ ] 5.1 Create StatCard component
    - Create `frontend/src/components/Dashboard/StatCard.jsx`
    - Accept props: title, value, icon, gradient
    - Apply glassmorphism with gradient overlay
    - Add rounded corners and subtle glow
    - _Requirements: US-6.1, US-6.2_
  
  - [ ] 5.2 Create FarmStatsRow component
    - Create `frontend/src/components/Dashboard/FarmStatsRow.jsx`
    - Accept props: stats (FarmStats object)
    - Render 4 StatCards: Total Farms, Active Crops, Harvest Ready, Health Score
    - Use 4-column grid layout (responsive to 2-col on tablet, 1-col on mobile)
    - _Requirements: US-6.1_
  
  - [ ]* 5.3 Write unit test for stat cards styling
    - **Example 10: Stat Cards Styling**
    - Render FarmStatsRow
    - Verify each StatCard has gradient, rounded corners, shadow classes
    - **Validates: Requirements US-6.2**
  
  - [ ]* 5.4 Write property test for farm statistics reactivity
    - **Property 6: Farm Statistics Reactivity**
    - Generate random initial farm array
    - Render FarmStatsRow with computed stats
    - Modify farm array (add/remove/update farms)
    - Recompute stats and update component
    - Verify displayed stats reflect changes
    - **Validates: Requirements US-6.3**

- [ ] 6. Build forecast components
  - [ ] 6.1 Create ForecastDayCard component
    - Create `frontend/src/components/Dashboard/ForecastDayCard.jsx`
    - Accept props: day, icon, maxTemp
    - Display day name, weather icon, max temperature
    - Do NOT display pressure or visibility
    - Apply glassmorphism styling
    - _Requirements: US-4.2, US-4.3_
  
  - [ ] 6.2 Create MiniForecastStrip component
    - Create `frontend/src/components/Dashboard/MiniForecastStrip.jsx`
    - Accept props: forecast (array of ForecastDay)
    - Render exactly 5 ForecastDayCard components
    - Use horizontal grid layout (scrollable on mobile)
    - _Requirements: US-4.1_
  
  - [ ]* 6.3 Write property test for forecast display consistency
    - **Property 3: Forecast Display Consistency**
    - Generate random forecast arrays (length 5-10)
    - Render MiniForecastStrip
    - Verify exactly 5 cards rendered
    - Verify each card has day name, icon, max temp
    - **Validates: Requirements US-4.1, US-4.2**
  
  - [ ]* 6.4 Write property test for technical metrics exclusion
    - **Property 4: Forecast Technical Metrics Exclusion**
    - Generate random forecast data including pressure and visibility
    - Render ForecastDayCard
    - Verify rendered output does NOT contain "pressure" or "visibility" text
    - **Validates: Requirements US-4.3**

- [ ] 7. Checkpoint - Ensure component tests pass
  - Run all component tests
  - Verify property tests pass with 100+ iterations
  - Verify components render correctly in isolation
  - Ask user if questions arise

- [ ] 8. Build alerts and market components
  - [ ] 8.1 Create RecentAlertsPanel component
    - Create `frontend/src/components/Dashboard/RecentAlertsPanel.jsx`
    - Accept props: alerts (array of Alert objects)
    - Display alert list with severity indicators
    - Show empty state: "All clear! No alerts right now ✨" when alerts.length === 0
    - Apply glassmorphism styling
    - _Requirements: US-7.2_
  
  - [ ]* 8.2 Write property test for alerts empty state handling
    - **Property 7: Alerts Empty State Handling**
    - Generate random alerts arrays (including empty array)
    - Render RecentAlertsPanel
    - Verify empty state message when array is empty
    - Verify alert items displayed when array has items
    - **Validates: Requirements US-7.2**
  
  - [ ] 8.3 Create MarketTrendsPanel component
    - Create `frontend/src/components/Dashboard/MarketTrendsPanel.jsx`
    - Accept props: trends (array of MarketItem), loading
    - Display crop name, location, price, trend indicator for each item
    - Add trend arrows (↑ up, ↓ down, → stable)
    - Apply glassmorphism styling
    - Add loading skeleton state
    - _Requirements: US-7.3_
  
  - [ ]* 8.4 Write property test for market trends display completeness
    - **Property 8: Market Trends Display Completeness**
    - Generate random market item objects
    - Render MarketTrendsPanel
    - Verify all 4 fields present: crop name, location, price, trend indicator
    - **Validates: Requirements US-7.3**
  
  - [ ] 8.5 Create AlertsAndMarketSection container
    - Create `frontend/src/components/Dashboard/AlertsAndMarketSection.jsx`
    - Use 2-column grid layout
    - Place RecentAlertsPanel on left
    - Place MarketTrendsPanel on right
    - Ensure both use consistent glassmorphism styling
    - Make responsive (stack on mobile)
    - _Requirements: US-7.1, US-7.4_
  
  - [ ]* 8.6 Write unit test for two-column layout
    - **Example 11: Two-Column Alerts/Market Layout**
    - Render AlertsAndMarketSection at desktop width
    - Verify CSS grid with 2 columns
    - **Validates: Requirements US-7.1**
  
  - [ ]* 8.7 Write unit test for glassmorphism consistency
    - **Example 12: Glassmorphism Consistency**
    - Render AlertsAndMarketSection
    - Verify both panels have glassmorphism classes
    - **Validates: Requirements US-7.4**

- [ ] 9. Build main UnifiedDashboard container
  - [ ] 9.1 Create DashboardHeader component
    - Create `frontend/src/components/Dashboard/DashboardHeader.jsx`
    - Create welcome section with user name
    - Position CompactWeatherCard in top-right
    - Use flex layout with space-between
    - _Requirements: US-3.1_
  
  - [ ]* 9.2 Write unit test for weather card positioning
    - **Example 4: Weather Card Positioning**
    - Render DashboardHeader
    - Verify CompactWeatherCard has top-right positioning classes
    - **Validates: Requirements US-3.1**
  
  - [ ] 9.3 Create UnifiedDashboard main component
    - Create `frontend/src/components/UnifiedDashboard.jsx`
    - Fetch weather data using weatherService
    - Fetch farm data from localStorage
    - Fetch market data using existing useMandiData hook
    - Compute farm statistics
    - Render DashboardHeader
    - Render FarmConditionsSection
    - Render FarmStatsRow
    - Render MiniForecastStrip
    - Render AlertsAndMarketSection
    - Handle loading and error states
    - _Requirements: US-1.1_
  
  - [ ]* 9.4 Write unit test for dashboard section presence
    - **Example 1: Dashboard Section Presence**
    - Render UnifiedDashboard with valid data
    - Verify all 5 sections present: Header, FarmConditions, FarmStats, Forecast, AlertsMarket
    - **Validates: Requirements US-1.1**

- [ ] 10. Implement responsive design and styling
  - [ ] 10.1 Add responsive CSS for all dashboard components
    - Create `frontend/src/components/Dashboard/UnifiedDashboard.css`
    - Define mobile breakpoint (<768px): stack sections vertically
    - Define tablet breakpoint (768-1024px): 2-column grids
    - Define desktop breakpoint (>1024px): full multi-column grids
    - Add glassmorphism CSS variables
    - Add animation transitions
    - _Requirements: TR-2.1, TR-2.2, TR-2.3_
  
  - [ ]* 10.2 Write property test for responsive layout adaptation
    - **Property 10: Responsive Layout Adaptation**
    - Generate random viewport widths (mobile: 320-767, tablet: 768-1023, desktop: 1024-1920)
    - Render UnifiedDashboard at each width
    - Verify layout classes match expected responsive behavior
    - **Validates: Requirements TR-2.1, TR-2.2, TR-2.3**
  
  - [ ]* 10.3 Write unit test for desktop viewport no scroll
    - **Example 2: Desktop Viewport No Scroll**
    - Render UnifiedDashboard at 1920x1080
    - Measure total content height
    - Verify height ≤ 1080px (no vertical scroll)
    - **Validates: Requirements US-1.4**

- [ ] 11. Checkpoint - Ensure integration tests pass
  - Run all integration tests
  - Verify UnifiedDashboard renders correctly with all sections
  - Verify responsive behavior at different breakpoints
  - Ask user if questions arise

- [ ] 12. Update routing and remove Weather page
  - [ ] 12.1 Update App.jsx routing configuration
    - Modify `frontend/src/App.jsx`
    - Replace Dashboard route with UnifiedDashboard
    - Remove Weather route (/weather)
    - Ensure no broken route references
    - _Requirements: US-5.1_
  
  - [ ]* 12.2 Write unit test for weather route removal
    - **Example 6: Weather Route Removal**
    - Check routing configuration
    - Verify no route exists for path "/weather"
    - **Validates: Requirements US-5.1**
  
  - [ ] 12.3 Update sidebar navigation
    - Modify `frontend/src/components/Layout.jsx` (or Sidebar component)
    - Remove Weather navigation item
    - Ensure Dashboard link points to UnifiedDashboard
    - Update navigation icons if needed
    - _Requirements: US-5.2_
  
  - [ ]* 12.4 Write unit test for sidebar weather link removal
    - **Example 7: Sidebar Weather Link Removal**
    - Render Sidebar component
    - Verify no link with href="/weather" or text "Weather"
    - **Validates: Requirements US-5.2**
  
  - [ ]* 12.5 Write unit test for navigation links validity
    - **Example 9: Navigation Links Validity**
    - Render Sidebar
    - Click each navigation link
    - Verify none result in 404 errors
    - **Validates: Requirements US-5.4**
  
  - [ ]* 12.6 Write unit test for weather functionality completeness
    - **Example 8: Weather Functionality Completeness**
    - List data points from old Weather page
    - Verify all present in UnifiedDashboard
    - Check: current conditions, forecast, advice
    - **Validates: Requirements US-5.3**

- [ ] 13. Implement accessibility features
  - [ ] 13.1 Add ARIA labels and semantic HTML
    - Add aria-labels to all icon-only buttons
    - Use semantic HTML elements (section, article, nav)
    - Add aria-live regions for dynamic updates
    - Add role attributes where needed
    - _Requirements: TR-4.3_
  
  - [ ] 13.2 Implement keyboard navigation
    - Ensure all interactive elements are focusable
    - Add visible focus indicators
    - Implement logical tab order
    - Add keyboard shortcuts for common actions
    - _Requirements: TR-4.2_
  
  - [ ] 13.3 Verify color contrast ratios
    - Check all text against backgrounds
    - Ensure 4.5:1 ratio for normal text
    - Ensure 3:1 ratio for large text
    - Adjust colors if needed
    - _Requirements: TR-4.4_
  
  - [ ]* 13.4 Write unit test for WCAG AA compliance
    - **Example 15: WCAG AA Compliance**
    - Render UnifiedDashboard
    - Run axe-core accessibility audit
    - Verify no WCAG AA violations
    - **Validates: Requirements TR-4.1**
  
  - [ ]* 13.5 Write unit test for keyboard navigation
    - **Example 16: Keyboard Navigation**
    - Render UnifiedDashboard
    - Simulate Tab key presses
    - Verify all interactive elements reachable
    - Verify visible focus indicators
    - **Validates: Requirements TR-4.2**
  
  - [ ]* 13.6 Write unit test for screen reader support
    - **Example 17: Screen Reader Support**
    - Render UnifiedDashboard
    - Verify all icons have aria-labels
    - Verify semantic HTML or ARIA roles
    - **Validates: Requirements TR-4.3**
  
  - [ ]* 13.7 Write unit test for color contrast compliance
    - **Example 18: Color Contrast Compliance**
    - Render UnifiedDashboard
    - Use contrast checker on all text
    - Verify all meet WCAG AA 4.5:1 ratio
    - **Validates: Requirements TR-4.4**

- [ ] 14. Implement performance optimizations
  - [ ] 14.1 Add lazy loading for non-critical components
    - Use React.lazy() for MarketTrendsPanel
    - Use React.lazy() for RecentAlertsPanel
    - Add Suspense boundaries with loading skeletons
    - _Requirements: TR-3.4_
  
  - [ ]* 14.2 Write unit test for lazy loading implementation
    - **Example 14: Lazy Loading Implementation**
    - Analyze webpack bundle
    - Verify MarketTrendsPanel in separate chunk
    - Verify RecentAlertsPanel in separate chunk
    - **Validates: Requirements TR-3.4**
  
  - [ ] 14.3 Add memoization for expensive computations
    - Use useMemo for farm statistics calculation
    - Use useMemo for farming advice generation
    - Use useCallback for event handlers
    - Prevent unnecessary re-renders
    - _Requirements: TR-3.1, TR-3.2_
  
  - [ ] 14.4 Optimize weather data fetching
    - Implement request deduplication
    - Add exponential backoff for retries
    - Prefetch forecast data in parallel with current weather
    - _Requirements: TR-1.2_

- [ ] 15. Final checkpoint and testing
  - [ ] 15.1 Run full test suite
    - Run all unit tests
    - Run all property tests (100+ iterations each)
    - Run accessibility tests
    - Verify all tests pass
  
  - [ ] 15.2 Manual testing checklist
    - Test on Chrome, Firefox, Safari
    - Test on mobile (iOS and Android)
    - Test with screen reader (NVDA or VoiceOver)
    - Test keyboard navigation
    - Test with slow network (throttling)
    - Test with location disabled
    - Test with empty farm data
  
  - [ ] 15.3 Performance verification
    - Measure initial load time (target: <2s)
    - Measure weather refresh time (target: <500ms)
    - Check Lighthouse score (target: >90)
    - Verify smooth animations (60fps)
  
  - [ ] 15.4 Final code review and cleanup
    - Remove console.log statements
    - Remove commented-out code
    - Ensure consistent code formatting
    - Update component documentation
    - Verify all requirements met

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass
  - Verify dashboard loads correctly in all browsers
  - Verify responsive design works on all devices
  - Ask user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (100+ iterations each)
- Unit tests validate specific examples and edge cases
- All tests use Jest + React Testing Library + fast-check
- Property tests must include comment tag: `// Feature: unified-dashboard, Property {number}: {property_text}`

## Testing Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: [
    'src/components/Dashboard/**/*.{js,jsx}',
    'src/utils/**/*.{js,jsx}',
    'src/services/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

```javascript
// Property test configuration
import fc from 'fast-check'

const propertyTestConfig = {
  numRuns: 100,
  verbose: true
}

// Use in all property tests:
fc.assert(fc.property(...), propertyTestConfig)
```
