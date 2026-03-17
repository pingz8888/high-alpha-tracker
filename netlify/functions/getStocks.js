const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (!event.headers['x-app-password'] || event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const symbolsParam = event.queryStringParameters.symbols;
    if (!symbolsParam) return { statusCode: 200, body: JSON.stringify({}) };

    const symbols = symbolsParam.split(',');
    const livePrices = {};

    try {
        // Fetch each stock individually so one bad ticker doesn't crash the whole batch
        const quotes = await Promise.all(symbols.map(async (symbol) => {
            try {
                return await yahooFinance.quote(symbol);
            } catch (err) {
                console.error(`❌ Error fetching ${symbol}:`, err.message);
                return null; 
            }
        }));

        quotes.forEach((quote, index) => {
            if (quote && quote.regularMarketPrice) {
                livePrices[symbols[index]] = quote.regularMarketPrice.toFixed(2);
            }
        });

        // If the object is entirely empty, Yahoo blocked the Netlify server
        if (Object.keys(livePrices).length === 0) {
            console.error("❌ All tickers failed. Yahoo Finance may be rate-limiting this IP.");
            return { statusCode: 500, body: JSON.stringify({ error: "All data requests blocked." }) };
        }

        return { statusCode: 200, body: JSON.stringify(livePrices) };
        
    } catch (error) { 
        console.error("❌ Fatal Server Error in getStocks:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: `Data fetch failed: ${error.message}` }) }; 
    }
};
