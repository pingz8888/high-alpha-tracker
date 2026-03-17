const { schedule } = require('@netlify/functions');
const nodemailer = require('nodemailer');

const handler = async function(event, context) {
    // 1. Core API Keys
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    // 2. Email Config
    const EMAIL_USER = process.env.EMAIL_USER; 
    const EMAIL_PASS = process.env.EMAIL_PASS; 

    // 3. Telegram Config
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    const prompt = `Act as a veteran Singaporean hedge fund manager. Mandate: 6-month swing trades, 20% upside. Recommend TWO new stocks (US or SGX). Format: Ticker, Catalyst, Entry Strategy, Stop-Loss.`;

    try {
        // --- FETCH AI RECOMMENDATION ---
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const aiText = (await response.json()).candidates[0].content.parts[0].text;
        
        const msgTitle = '📈 Daily Alpha: 20% Swing Trade Setups\n\n';
        const fullMessage = msgTitle + aiText;

        // --- DISPATCH 1: TELEGRAM ---
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            try {
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: fullMessage })
                });
                console.log("Telegram sent successfully.");
            } catch (e) { console.error("Telegram failed:", e); }
        }

        // --- DISPATCH 2: EMAIL ---
        if (EMAIL_USER && EMAIL_PASS) {
            try {
                const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: EMAIL_USER, pass: EMAIL_PASS } });
                await transporter.sendMail({
                    from: `"Alpha Engine" <${EMAIL_USER}>`, to: EMAIL_USER,
                    subject: '📈 Daily Alpha Setups',
                    html: `<div style="font-family: sans-serif;"><p>${aiText.replace(/\n/g, '<br>')}</p></div>`
                });
                console.log("Email sent successfully.");
            } catch (e) { console.error("Email failed:", e); }
        }

        return { statusCode: 200, body: "Dual-channel dispatch complete." };
    } catch (error) { 
        console.error("Cron core engine failed:", error);
        return { statusCode: 500, body: "Engine failed." }; 
    }
};

// Runs at 00:00 UTC (8:00 AM Singapore Time)
exports.handler = schedule("0 0 * * *", handler);
