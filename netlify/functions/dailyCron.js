const { schedule } = require('@netlify/functions');
const nodemailer = require('nodemailer');

const handler = async function(event, context) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const EMAIL_USER = process.env.EMAIL_USER; 
    const EMAIL_PASS = process.env.EMAIL_PASS; 
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const prompt = `Recommend TWO swing trades (US/SGX). FORMAT: [Ticker] | [Entry] | [Stop] | [Target]. Concise.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiText = (await response.json()).candidates[0].content.parts[0].text;
        const fullMessage = '📈 ALPHA ALERT:\n\n' + aiText;

        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: fullMessage })
            });
        }

        if (EMAIL_USER && EMAIL_PASS) {
            const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
            await transporter.sendMail({
                from: `"Alpha Engine" <${EMAIL_USER}>`, to: EMAIL_USER,
                subject: 'Daily Alpha Brief',
                html: `<p>${aiText.replace(/\n/g, '<br>')}</p>`
            });
        }
        return { statusCode: 200, body: "Dispatched." };
    } catch (error) { return { statusCode: 500, body: "Failed." }; }
};
exports.handler = schedule("0 0 * * *", handler);
