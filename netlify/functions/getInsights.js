// This runs securely on Netlify's servers.
exports.handler = async function(event, context) {
    // Retrieve the securely stored API key
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: "API Key missing from Environment Variables" }) };
    }

    const prompt = "As a veteran Singaporean investor, provide a brief 3-sentence technical analysis on the current momentum of Sea Limited (SE), Seatrium (5E2.SI), UMS Holdings (558.SI), and Food Empire (F03.SI). Keep it strictly analytical and focus on 6-month swing trade potential.";

    try {
        // Native Node fetch is available in Netlify's Node 18+ environment
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
        }

        const insightText = data.candidates[0].content.parts[0].text;

        return {
            statusCode: 200,
            body: JSON.stringify({ insight: insightText })
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to fetch from Gemini." }) };
    }
};
