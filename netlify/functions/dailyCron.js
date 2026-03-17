const { schedule } = require('@netlify/functions');
const nodemailer = require('nodemailer');

const handler = async function(event, context) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const EMAIL_USER = process.env.EMAIL_USER; 
    const EMAIL_PASS = process.env.EMAIL_PASS; 
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const prompt = `You are a veteran Singaporean hedge fund manager with 30 years experience in investments and a solid track record in generating millions of dollars from stocks investments. Recommend THREE 6-month swing trades (SGX listed). Format: [Ticker] | Entry: [Price] | Stop: [Price] | Target: [Price]. Thesis: 3 sentences.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiText = (await response.json()).candidates[0].content.parts[0].text;
        const fullMessage = '📈 ALPHA v3 MORNING BRIEF:\n\n' + aiText;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: fullMessage })
            });
        }

        if (EMAIL_USER && EMAIL_PASS) {
            const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
            await transporter.sendMail({
                from: `"Alpha v3" <${EMAIL_USER}>`, to: EMAIL_USER,
                subject: 'Daily Alpha Briefing',
                html: `<div style="font-family:sans-serif;color:#333;"><p>${aiText.replace(/\n/g, '<br>')}</p></div>`
            });
        }
        return { statusCode: 200, body: "Dispatched." };
    } catch (error) { return { statusCode: 500, body: "Failed." }; }
};
exports.handler = schedule("0 0 * * *", handler);
