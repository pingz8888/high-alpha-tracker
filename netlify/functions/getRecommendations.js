exports.handler = async function(event, context) {
    const APP_PASSWORD = process.env.APP_PASSWORD;
    if (event.headers['x-app-password'] !== APP_PASSWORD) {
        return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // ULTRA CONCISE PROMPT
    const prompt = `Act as a veteran Singaporean hedge fund manager. Recommend TWO 6-month swing trades (US/SGX). 
    FORMAT: [Ticker] | [Entry] | [Stop] | [Target]. 
    1 short setup sentence per stock. No intro.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return { statusCode: 200, body: JSON.stringify({ recommendations: data.candidates[0].content.parts[0].text }) };
    } catch (error) { return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; }
};
