exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const tickers = JSON.parse(event.body).tickers || [];
    
    const prompt = `You are a veteran Singaporean institutional investor wirh 30 years of experience in investment, with a proven record in earning millions from stocks investments. Analyze this watchlist for 6-month, 20% upside: ${tickers.join(', ')}. 
    
    For each stock, provide:
    TICKER: [SIGNAL] - Analysis (1 meaningful sentences). Target: [Price] | Stop: [Price]
    
    Use [KEEP], [SELL], or [WATCH]. Focus on technical momentum. No intro.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;

        const insightMap = {};
        const lines = aiResponse.split('\n');
        lines.forEach(line => {
            const match = line.match(/^([A-Z0-9.]+):/);
            if (match) {
                const ticker = match[1];
                insightMap[ticker] = line.replace(`${ticker}:`, '').trim();
            }
        });

        return { statusCode: 200, body: JSON.stringify({ insights: insightMap }) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};
