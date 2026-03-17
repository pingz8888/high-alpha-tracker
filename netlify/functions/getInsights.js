exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const tickers = JSON.parse(event.body).tickers || [];
    if (tickers.length === 0) return { statusCode: 200, body: JSON.stringify({ insight: "Watchlist empty." }) };

    const prompt = `Act as a veteran Singaporean institutional investor. Analyze this watchlist for a 6-month, 20% gain objective: ${tickers.join(', ')}. For EACH stock provide: 1. A 1-sentence technical trend. 2. A bolded [KEEP] or [SELL] recommendation.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify({ insight: data.candidates[0].content.parts[0].text }) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: "Analysis failed." }) }; }
};
