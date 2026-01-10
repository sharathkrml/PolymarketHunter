import { Bot, InlineKeyboard } from "grammy"
import {
  saveBudget,
  getUserBudget,
  updateMaxMarketsTraded,
  updateLiquidityThreshold,
  updateTradeThreshold,
} from "./db"
import * as dotenv from "dotenv"
dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN!)

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("10k", "set_10000")
    .text("15k", "set_15000")
    .row()
    .text("20k", "set_20000")
    .text("Custom", "set_custom")

  await ctx.reply(
    [
      "🎯 Welcome to Polymarket Hunter!",
      "",
      "Use buttons below *or* these commands:",
      "",
      "/set_trade_threshold <amount> — set trade threshold (e.g. `/set_trade_threshold 5000`)",
      "/set_liquidity_threshold <amount> — set liquidity threshold (e.g. `/set_liquidity_threshold 10`)",
      "/set_max_markets_traded <amount> — set max markets traded (e.g. `/set_max_markets_traded 8`)",
      "/info — show your current settings",
      "/help — show usage instructions"
    ].join("\n"),
    { reply_markup: keyboard, parse_mode: "Markdown" }
  )
})

bot.command("help", async (ctx) => {
  await ctx.reply(
    [
      "*Polymarket Hunter Bot Help*",
      "",
      "*Set Alerts:*",
      "• Tap quick buttons or use commands below.",
      "",
      "*Trade threshold:*",
      "Use `/set_trade_threshold <amount>` to set a minimum trade dollar amount.",
      "_Example_: `/set_trade_threshold 5000`",
      "",
      "*Liquidity threshold:*",
      "Use `/set_liquidity_threshold <percent>` (minimum: 5)",
      "_Example_: `/set_liquidity_threshold 10`",
      "",
      "*Max markets traded:*",
      "Use `/set_max_markets_traded <number>` to receive alerts only if the trader traded fewer markets.",
      "_Example_: `/set_max_markets_traded 10`",
      "",
      "*Info:*",
      "Use `/info` to check your settings.",
    ].join("\n"),
    { parse_mode: "Markdown" }
  )
})

bot.command("set_liquidity_threshold", async (ctx) => {
  const text = ctx.match
  if (!text || typeof text !== "string" || !text.trim()) {
    return ctx.reply(
      [
        "⚠️ Usage: `/set_liquidity_threshold <percent>`",
        "_Example_: `/set_liquidity_threshold 10`",
      ].join("\n"),
      { parse_mode: "Markdown" }
    )
  }
  const amount = parseInt(text.trim())
  if (!ctx.from) return
  await updateLiquidityThreshold(ctx.from.id, amount)
  await ctx.reply(
    `✅ Liquidity threshold updated.\n\nYou will get alerts for markets with at least *${amount}%* liquidity.`,
    { parse_mode: "Markdown" }
  )
})

bot.command("set_max_markets_traded", async (ctx) => {
  const text = ctx.match
  if (!text || typeof text !== "string" || !text.trim()) {
    return ctx.reply(
      [
        "⚠️ Usage: `/set_max_markets_traded <number>`",
        "_Example_: `/set_max_markets_traded 10`",
      ].join("\n"),
      { parse_mode: "Markdown" }
    )
  }
  const amount = parseInt(text.trim())
  if (!ctx.from) return
  await updateMaxMarketsTraded(ctx.from.id, amount)
  await ctx.reply(
    `✅ Max markets traded updated.\n\nYou will only be alerted if a trader has traded *${amount}* or fewer markets.`,
    { parse_mode: "Markdown" }
  )
})

bot.command("set_trade_threshold", async (ctx) => {
  const text = ctx.match
  if (!text || typeof text !== "string" || !text.trim()) {
    return ctx.reply(
      [
        "⚠️ Usage: `/set_trade_threshold <amount>`",
        "_Example_: `/set_trade_threshold 5000`",
      ].join("\n"),
      { parse_mode: "Markdown" }
    )
  }
  const amount = parseInt(text.trim())
  if (!ctx.from) return
  await updateTradeThreshold(ctx.from.id, amount)
  await ctx.reply(
    `✅ Trade threshold updated.\n\nYou will receive alerts for trades over *$${amount.toLocaleString()}*.`,
    { parse_mode: "Markdown" }
  )
})

bot.command("info", async (ctx) => {
  if (!ctx.from) return
  try {
    const settings = await getUserBudget(ctx.from.id)
    if (settings) {
      let lines = [
        "*Your Polymarket Alert Settings:*",
        "",
        `• Min Bet Size: *$${parseInt(settings.budget_threshold).toLocaleString()}*`,
        `• Min Liquidity: *${settings.liquidity_threshold}%*`
      ]
      await ctx.reply(lines.join("\n"), { parse_mode: "Markdown" })
    } else {
      await ctx.reply(
        [
          "⚠️ No alerts configured.",
          "Use /start or the setup commands to begin."
        ].join("\n")
      )
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    await ctx.reply("❌ Error: could not get your settings. Please try again.")
  }
})

bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "help", description: "Show help" },
  { command: "set_trade_threshold", description: "Set the trade ($) threshold" },
  { command: "set_liquidity_threshold", description: "Set liquidity (%) threshold" },
  { command: "set_max_markets_traded", description: "Set max markets traded" },
  { command: "info", description: "Show your alert settings" },
])

bot.callbackQuery(/set_(\d+)/, async (ctx) => {
  if (!ctx.match) return
  const matchStr = ctx.match[1]
  if (matchStr && ctx.from) {
    const amount = parseInt(matchStr)
    await saveBudget(ctx.from.id, amount)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `✅ Alert threshold set!\n\nYou'll be notified for trades over *$${amount.toLocaleString()}*.\n\nYou can further tweak thresholds with:\n• /set_liquidity_threshold\n• /set_max_markets_traded\nUse /help for more options.`,
      { parse_mode: "Markdown" }
    )
  }
})

bot.callbackQuery("set_custom", async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(
    [
      "To set a custom trade alert, use:",
      "",
      "`/set_trade_threshold <amount>`",
      "",
      "_Example_: `/set_trade_threshold 5000`",
    ].join("\n"),
    { parse_mode: "Markdown" }
  )
})

// Check if this module is being run directly
// @ts-ignore
if (require.main === module) {
  bot.start()
}
export default bot
