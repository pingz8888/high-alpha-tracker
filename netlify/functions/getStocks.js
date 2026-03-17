const yahooFinance = require('yahoo-finance2').default;

exports.handler = async function(event, context) {
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
