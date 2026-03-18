exports.handler = async (event) => {
    const { ticker, price, stop, key } = JSON.parse(event.body);
    if (key !== process.env.APP_PASSWORD) return { statusCode: 401, body: "Unauthorized" };

    const msg = `🚨 ALPHA ALERT: ${ticker} @ $${price} (Below Stop: $${stop})`;
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: msg })
    });
    return { statusCode: 200, body: "Alerted" };
};
