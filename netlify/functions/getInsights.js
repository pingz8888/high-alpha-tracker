exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const tickers = JSON.parse(event.body).tickers || [];
    
    // ULTRA CONCISE PROMPT
    const prompt = `Act as a veteran Singaporean institutional investor. Analyze for 6-month, 20% gain: ${tickers.join(', ')}. 
    FORMAT: [TICKER]: [SIGNAL] - [1 SHORT REASON]. 
    USE: [KEEP], [SELL], or [WATCH]. No intro/outro.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify({ insight: data.candidates[0].content.parts[0].text }) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};
