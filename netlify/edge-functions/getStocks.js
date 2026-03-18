export default async (request, context) => {
  const url = new URL(request.url);
  const symbols = url.searchParams.get("symbols") || "";
  const appKey = request.headers.get("x-app-key");

  if (appKey !== Deno.env.get("APP_PASSWORD")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const results = {};
  const symbolList = symbols.split(",");

  try {
    await Promise.all(symbolList.map(async (symbol) => {
      const fetchUrl = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${symbol}&range=1d&interval=5m&indicators=close&includeTimestamps=false&includePrePost=false`;
      const response = await fetch(fetchUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const data = await response.json();
      const meta = data.spark?.result?.[0]?.response?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        results[symbol] = { price: meta.regularMarketPrice.toFixed(2), name: meta.longName || symbol };
      }
    }));
    return new Response(JSON.stringify(results), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Edge Failed" }), { status: 500 });
  }
};
