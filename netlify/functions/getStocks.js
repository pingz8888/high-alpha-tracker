exports.handler = async function(event, context) {
    // 1. Security Bouncer
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (!event.headers['x-app-password'] || event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const symbolsParam = event.queryStringParameters.symbols;
    if (!symbolsParam) return { statusCode: 200, body: JSON.stringify({}) };

    const symbols = symbolsParam.split(',');
    const livePrices = {};

    try {
        // 2. Native Fetch directly to Yahoo's public v8 API (No libraries needed)
        await Promise.all(symbols.map(async (symbol) => {
            try {
                // Yahoo's raw charting endpoint
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                // Navigate Yahoo's JSON structure to find the current market price
                const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                
                if (price) {
                    livePrices[symbol] = price.toFixed(2);
                }
            } catch (err) {
                console.error(`❌ Failed to fetch ${symbol}:`, err.message);
                // We don't throw here so that one bad ticker doesn't break the rest
            }
        }));

        if (Object.keys(livePrices).length === 0) {
            return { statusCode: 500, body: JSON.stringify({ error: "Yahoo Finance blocked the data request." }) };
        }

        return { statusCode: 200, body: JSON.stringify(livePrices) };
        
    } catch (error) { 
        console.error("❌ Fatal Server Error:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: `Data fetch failed: ${error.message}` }) }; 
    }
};
