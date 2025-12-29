---
description: How to run and test the Dynamic Market Data Aggregation system
---

# Dynamic Market Data Aggregation Workflow

This workflow describes how to run the FarmEase backend with the new dynamic market data aggregation system.

## Prerequisites

- Node.js installed
- Internet connection (for fetching external API data)
- OpenWeatherMap API Key (in `.env` or default will be used)

## Steps

1.  **Navigate to the backend directory**
    ```bash
    cd backend
    ```

2.  **Install dependencies**
    Ensure `axios` is installed (it was added recently).
    ```bash
    npm install
    ```

3.  **Configure Environment (Optional)**
    You can set the following environment variables in `backend/.env`:
    - `MARKET_DATA_MODE`: Set to `LIVE` to attempt real API calls (Agmarknet), or `DEMO` (default) for realistic simulation.
    - `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key for geocoding.

4.  **Start the Backend Server**
    ```bash
    npm run dev
    ```
    or
    ```bash
    node server.js
    ```

5.  **Verify Output**
    Look for the following logs to confirm the system is running in dynamic mode:
    - `⚠️ Market data will still be fetched dynamically from providers` (if DB is missing)
    - `📡 Fetching live Agmarknet data for ...` (if in LIVE mode)

## Testing Endpoints

You can test the following endpoints using `curl` or Postman:

-   **Nearby Markets (requires lat/lng):**
    `GET http://localhost:5001/api/market/nearby?lat=17.385&lng=78.4867`

-   **Market Trends:**
    `GET http://localhost:5001/api/market/trends?city=Hyderabad&crop=Rice`

-   **Market Comparison:**
    `GET http://localhost:5001/api/market/compare?location=Hyderabad`

## Troubleshooting

-   **"Location coordinates are required"**: Ensure you are passing `lat` and `lng` query parameters.
-   **"Could not resolve city"**: The geocoding API might be failing or the coordinates are in an unsupported location (e.g., ocean).
-   **Empty Data**: In `LIVE` mode, the external API might be down or rate-limited. Switch to `DEMO` mode to verify logic.
