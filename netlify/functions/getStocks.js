// This runs securely on Netlify's servers.
exports.handler = async function(event, context) {
    // If you use Finnhub or Alpha Vantage, your key goes here
    const STOCK_API_KEY = process.env.STOCK_API_KEY; 

    // For demonstration, we are mocking the secure return data. 
    // In production, you would use a fetch() call here just like in getInsights.js
    // to hit Finnhub or Alpha Vantage using your STOCK_API_KEY.
    
    const mockLivePrices = {
        'SE': (Math.random() * (60 - 55) + 55).toFixed(2),
        '5E2.SI': (Math.random() * (2.50 - 2.30) + 2.30).toFixed(2),
        '558.SI': (Math.random() * (2.20 - 2.00) + 2.00).toFixed(2),
        'F03.SI': (Math.random() * (4.30 - 4.10) + 4.10).toFixed(2)
    };

    return {
        statusCode: 200,
        body: JSON.stringify(mockLivePrices)
    };
};
