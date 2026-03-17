exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    const clientKey = event.headers['x-app-password'];

    if (!clientKey || clientKey !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const symbolsParam = event.queryStringParameters.symbols;
    if (!symbolsParam) return { statusCode: 200, body: JSON.stringify({}) };

    const symbols = symbolsParam.split(',');
    const livePrices = {};

    try {
        await Promise.all(symbols.map(async (symbol) => {
            try {
                // Using the v7 spark endpoint - often more reliable for server-side fetches
                const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbol}&range=1d&interval=5m&indicators=close&includeTimestamps=false&includePrePost=false`;
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Referer': 'https://finance.yahoo.com/'
                    }
                });

                if (!response.ok) return;

                const data = await response.json();
                // Navigate the v7 Spark JSON structure
                const result = data.spark?.result?.[0]?.response?.[0]?.meta;
                const price = result?.regularMarketPrice;
                
                if (price) {
                    livePrices[symbol] = price.toFixed(2);
                }
            } catch (err) {
                console.error(`Fetch failed for ${symbol}:`, err.message);
            }
        }));

        return {
            statusCode: 200,
            headers: { 
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" 
            },
            body: JSON.stringify(livePrices)
        };
        
    } catch (error) { 
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; 
    }
};
