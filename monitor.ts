import { RealTimeDataClient } from "./polymarket/client"
import { type Message } from "./polymarket/model"
import { getUsersForTrade, markUserAsBlocked } from "./db"
import { getLiquidityPercentage } from "./polymarket/utils"
import { getMarketsTraded } from "./polymarket/api"
import bot from "./bot"

const client = new RealTimeDataClient({
  onConnect: (c) => {
    console.log("Connected to Polymarket WebSocket")
    c.subscribe({
      subscriptions: [{ topic: "activity", type: "trades" }],
    })
  },
  onMessage: async (c: RealTimeDataClient, message: Message) => {
    if (message.payload.size && message.payload.price) {
      const tradeValue = message.payload.size * message.payload.price

      if (message.payload.side != "BUY") return
      const liquidityPercent = await getLiquidityPercentage(
        message.payload.asset,
        tradeValue
      )
      // Find users whose budget or liquidity threshold is met
      const userIds = await getUsersForTrade(tradeValue, liquidityPercent)
      for (const user of userIds) {
        let userUrl = `https://polymarket.com/profile/${message.payload.proxyWallet}`
        const marketsTraded = await getMarketsTraded(
          message.payload.proxyWallet
        )
        if (
          user.max_markets_traded > 0 &&
          marketsTraded.traded > user.max_markets_traded
        ) {
          continue
        }

        // Determine which condition(s) triggered the alert
        const budgetMet = tradeValue >= user.budget_threshold
        const liquidityMet = liquidityPercent >= user.liquidity_threshold

        let triggerReason = ""
        if (budgetMet && liquidityMet) {
          triggerReason =
            "✅ **Triggered by**: Trade size AND Liquidity threshold"
        } else if (budgetMet) {
          triggerReason = "✅ **Triggered by**: Trade size threshold"
        } else if (liquidityMet) {
          triggerReason = "✅ **Triggered by**: Liquidity threshold"
        }

        try {
          await bot.api.sendMessage(
            user.user_id,
            `🚨 **Insider Alert!**

🔥 **${message.payload.side}** **${message.payload.size.toFixed(
              2
            )}** shares of **${
              message.payload.outcome
            }** @ **$${message.payload.price.toFixed(2)}**

📌 **Market**: ${message.payload.title}
💰 **Value**: $${tradeValue.toFixed(2)}
💧 **Liquidity By User**: ${liquidityPercent.toFixed(2)}%

${triggerReason}

👤 **Trader**: [View Profile](${userUrl})
📊 **History**: ${marketsTraded.traded} markets traded

🔗 [View Event](https://polymarket.com/event/${message.payload.eventSlug})`,
            { parse_mode: "Markdown" }
          )
        } catch (error: any) {
          // Check if the error is a 403 (bot blocked by user)
          if (
            error?.error_code === 403 ||
            error?.description?.includes("blocked")
          ) {
            console.log(
              `User ${user.user_id} has blocked the bot. Marking as blocked.`
            )
            await markUserAsBlocked(user.user_id)
          } else {
            // Log other errors but don't mark as blocked
            console.error(
              `Error sending message to user ${user.user_id}:`,
              error
            )
          }
        }
      }
    }
  },
})

const main = async () => {
  client.connect()
}

main()
