
import { RealTimeDataClient } from "./polymarket/client";
import { type Message } from "./polymarket/model";
import { getUsersForTrade } from "./db";
import { getLiquidityPercentage } from "./polymarket/utils";
import { getMarketsTraded } from "./polymarket/api";
import bot from "./bot";



const client = new RealTimeDataClient({
 onConnect: (c) => {
  console.log("Connected to Polymarket WebSocket");
  c.subscribe({
   subscriptions: [{ topic: "activity", type: "trades" }]
  });
 },
 onMessage: async (c: RealTimeDataClient, message: Message) => {
  if (message.payload.size && message.payload.price) {
   const tradeValue = message.payload.size * message.payload.price;

   if (message.payload.side != "BUY") return;

   // Find users whose budget is lower than this trade
   const userIds = await getUsersForTrade(tradeValue);
   console.log(message);
   for (const userId of userIds) {
    let userUrl = `https://polymarket.com/@${message.payload.name}`;
    if (message.payload.name === "") {
     userUrl = `https://polymarket.com/profile/${message.payload.proxyWallet}`;
    }
    const [liquidityPercent, marketsTraded] = await Promise.all([
     getLiquidityPercentage(message.payload.asset, tradeValue),
     getMarketsTraded(message.payload.proxyWallet)
    ]);
    await bot.api.sendMessage(
     userId,
     `🚨 **Insider Alert!**

🔥 **${message.payload.side}** **${message.payload.size.toFixed(2)}** shares of **${message.payload.outcome}** @ **$${message.payload.price.toFixed(2)}**

📌 **Market**: ${message.payload.title}
💰 **Value**: $${tradeValue.toFixed(2)}
💧 **Liquidity By User**: ${liquidityPercent.toFixed(2)}%

👤 **Trader**: [View Profile](${userUrl})
📊 **History**: ${marketsTraded.traded} markets traded

🔗 [View Event](https://polymarket.com/event/${message.payload.eventSlug})`,
     { parse_mode: "Markdown" }
    );
   }
  }
 }
});



const main = async () => {
 client.connect();
}

main();