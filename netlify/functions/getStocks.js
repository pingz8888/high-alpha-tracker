
exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const symbols = (event.queryStringParameters.symbols || "").split(',');
    const results = {};

    try {
        await Promise.all(symbols.map(async (symbol) => {
            try {
                const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbol}&range=1d&interval=5m&indicators=close&includeTimestamps=false&includePrePost=false`;
                const response = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' }
                });
                const data = await response.json();
                const meta = data.spark?.result?.[0]?.response?.[0]?.meta;
                
                if (meta?.regularMarketPrice) {
                    results[symbol] = {
                        price: meta.regularMarketPrice.toFixed(2),
                        name: meta.longName || symbol
                    };
                }
            } catch (err) { console.error(`Failed ${symbol}:`, err.message); }
        }));
        return { statusCode: 200, body: JSON.stringify(results) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};
