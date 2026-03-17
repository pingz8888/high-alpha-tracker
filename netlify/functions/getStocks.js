exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    const clientKey = event.headers['x-app-password'];

    // 1. Security Check
    if (!clientKey || clientKey !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const symbolsParam = event.queryStringParameters.symbols;
    if (!symbolsParam) return { statusCode: 200, body: JSON.stringify({}) };

    const symbols = symbolsParam.split(',');
    const livePrices = {};

    try {
        // 2. Defensive Data Fetching
        await Promise.all(symbols.map(async (symbol) => {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                
                // Using global fetch (Requires Node 18+)
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' }
                });

                if (!response.ok) return console.error(`Yahoo error ${symbol}: ${response.status}`);

                const data = await response.json();
                const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
                
                if (price) {
                    livePrices[symbol] = price.toFixed(2);
                }
            } catch (err) {
                console.error(`Fetch failed for ${symbol}:`, err.message);
            }
        }));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(livePrices)
        };
        
    } catch (error) { 
        console.error("Fatal 500 Error:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; 
    }
};
