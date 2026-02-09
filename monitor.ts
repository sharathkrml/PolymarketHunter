import { InlineKeyboard } from "grammy"
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
          const eventUrl = `https://polymarket.com/event/${message.payload.eventSlug}`
          const enciesTxUrl = `https://app.encies.com/tx/${message.payload.transactionHash}`
          const shareText =
            `🔥 Insider alert: ${message.payload.side === "BUY" ? "Bought" : "Sold"} ${message.payload.size.toFixed(0)} ${message.payload.outcome} @ $${message.payload.price.toFixed(2)}\n` +
            `Market: ${message.payload.title}\n` +
            `Value: $${tradeValue.toFixed(0)}\n` +
            `Track & trade on Encies 👇`
          const shareOnXUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(enciesTxUrl)}`

          const keyboard = new InlineKeyboard()
            .url("Trade on Encies", enciesTxUrl)
            .row()
            .url("Share on X", shareOnXUrl)

          const alertMessage =
            `🚨 **Insider Alert!**\n\n` +
            `🔥 **${message.payload.side}** **${message.payload.size.toFixed(2)}** shares of **${message.payload.outcome}** @ **$${message.payload.price.toFixed(2)}**\n\n` +
            `📌 **Market**: ${message.payload.title}\n` +
            `💰 **Value**: $${tradeValue.toFixed(2)}\n` +
            `💧 **Liquidity By User**: ${liquidityPercent.toFixed(2)}%\n\n` +
            `${triggerReason}\n\n` +
            `👤 **Trader**: [View Profile](${userUrl})\n` +
            `📊 **History**: ${marketsTraded.traded} markets traded\n\n` +
            `🔗 [View Event](${eventUrl})`

          await bot.api.sendMessage(user.user_id, alertMessage, {
            parse_mode: "Markdown",
            reply_markup: keyboard,
          })
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
