
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
               const liquidityPercent = await getLiquidityPercentage(message.payload.asset, tradeValue)
               // Find users whose budget is lower than this trade
               const userIds = await getUsersForTrade(tradeValue, liquidityPercent);
               for (const user of userIds) {
                    let userUrl = `https://polymarket.com/@${message.payload.name}`;
                    if (message.payload.name === "") {
                         userUrl = `https://polymarket.com/profile/${message.payload.proxyWallet}`;
                    }
                    const marketsTraded = await getMarketsTraded(message.payload.proxyWallet)
                    if (user.max_markets_traded > 0 && marketsTraded.traded > user.max_markets_traded) {
                         continue;
                    }
                    await bot.api.sendMessage(
                         user.user_id,
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