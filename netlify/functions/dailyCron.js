const { schedule } = require('@netlify/functions');
const nodemailer = require('nodemailer');

const handler = async function(event, context) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const EMAIL_USER = process.env.EMAIL_USER; 
    const EMAIL_PASS = process.env.EMAIL_PASS; 

    const prompt = `Act as a veteran Singaporean hedge fund manager. Mandate: 6-month swing trades, 20% upside. Recommend TWO new stocks (US or SGX). Format: Ticker, Catalyst, Entry Strategy, Stop-Loss.`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiText = (await response.json()).candidates[0].content.parts[0].text;

        const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
        await transporter.sendMail({
            from: `"Alpha AI Engine" <${EMAIL_USER}>`, to: EMAIL_USER,
            subject: '📈 Daily Alpha: 20% Swing Trade Setups',
            html: `<div style="font-family: sans-serif;"><h2>Today's High-Alpha Setups</h2><p>${aiText.replace(/\n/g, '<br>')}</p></div>`
        });
        return { statusCode: 200, body: "Email sent." };
    } catch (error) { return { statusCode: 500, body: "Cron failed." }; }
};
exports.handler = schedule("0 0 * * *", handler);
