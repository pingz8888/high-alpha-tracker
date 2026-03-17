exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (!event.headers['x-app-password'] || event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "GEMINI_API_KEY is missing in Netlify Environment Variables." }) };
    }

    const prompt = `Act as a veteran Singaporean hedge fund manager. Mandate: 6-month swing trades, 20% capital appreciation. Recommend TWO new stocks (US or SGX listed) showing high-probability technical setups. Format: Ticker, Catalyst, Entry Strategy, Stop-Loss.`;

    try {
        // Updated to the current, supported model: gemini-2.5-flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

        return { statusCode: 200, body: JSON.stringify({ recommendations: data.candidates[0].content.parts[0].text }) };
    } catch (error) { 
        console.error("Server Crash:", error);
        return { statusCode: 500, body: JSON.stringify({ error: `Server Code Crash: ${error.message}` }) }; 
    }
};
