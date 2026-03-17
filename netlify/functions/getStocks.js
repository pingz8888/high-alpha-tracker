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
        const quotes = await Promise.all(symbols.map(symbol => yahooFinance.quote(symbol).catch(() => null)));
        quotes.forEach((quote, index) => {
            if (quote && quote.regularMarketPrice) livePrices[symbols[index]] = quote.regularMarketPrice.toFixed(2);
        });
        return { statusCode: 200, body: JSON.stringify(livePrices) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: "Data fetch failed." }) }; }
};
