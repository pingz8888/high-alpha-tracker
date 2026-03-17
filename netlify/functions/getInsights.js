exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (!event.headers['x-app-password'] || event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY is missing in Netlify Environment Variables." }) };
    }

    let tickers = [];
    try {
        tickers = JSON.parse(event.body).tickers || [];
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: "Failed to read watchlist from frontend." }) };
    }

    if (tickers.length === 0) return { statusCode: 200, body: JSON.stringify({ insight: "Watchlist empty." }) };

    const prompt = `Act as a veteran Singaporean institutional investor. Analyze this watchlist for a 6-month, 20% gain objective: ${tickers.join(', ')}. For EACH stock provide: 1. A 1-sentence technical trend. 2. A bolded [KEEP] or [SELL] recommendation.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            console.error("Google API Error:", data);
            return { statusCode: 500, body: JSON.stringify({ error: `Google API Error: ${data.error?.message || response.statusText}` }) };
        }

        if (!data.candidates || data.candidates.length === 0) {
            console.error("Gemini blocked response:", data);
            return { statusCode: 500, body: JSON.stringify({ error: "Gemini returned an empty response. It may have triggered a safety filter." }) };
        }

        return { statusCode: 200, body: JSON.stringify({ insight: data.candidates[0].content.parts[0].text }) };
    } catch (error) { 
        console.error("Server Crash:", error);
        return { statusCode: 500, body: JSON.stringify({ error: `Server Code Crash: ${error.message}` }) }; 
    }
};
