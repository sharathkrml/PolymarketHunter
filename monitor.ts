
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
                    let userUrl = `https://polymarket.com/profile/${message.payload.proxyWallet}`
                    const marketsTraded = await getMarketsTraded(message.payload.proxyWallet)
                    if (user.max_markets_traded > 0 && marketsTraded.traded > user.max_markets_traded) {
                         continue;
                    }
                    // Format wallet address (first 4 chars + last 2 chars)
                    const walletAddress = message.payload.proxyWallet
                    const shortWallet = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-2)}`
                    
                    // Format action text
                    const actionText = message.payload.side === "BUY" 
                         ? `Bought ${message.payload.outcome}` 
                         : `Sold ${message.payload.outcome}`

                    await bot.api.sendMessage(
                         user.user_id,
                         `New matching trade detected
Wallet: ${shortWallet}
Markets traded: ${marketsTraded.traded}
Total capital: ${Math.round(tradeValue).toLocaleString()}
Market: ${message.payload.title}
Action: ${actionText}
Size: ${message.payload.size.toFixed(2)}
Price: ${message.payload.price.toFixed(2)}`,
                         { parse_mode: "HTML" }
                    );
               }
          }
     }
});



const main = async () => {
     client.connect();
}

main();