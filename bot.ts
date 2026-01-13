import { Bot, InlineKeyboard } from "grammy"
import {
  saveCompleteSettings,
  getUserBudget,
  setMonitoringStatus,
  isMonitoringActive,
} from "./db"
import * as dotenv from "dotenv"
dotenv.config()

const bot = new Bot(process.env.BOT_TOKEN!)

// State management for user flow
interface UserFlowState {
  step: "market_activity" | "bet_amount" | "liquidity" | "review" | null
  maxMarkets?: number | null
  betAmount?: number
  liquidity?: number
}

const userFlowState = new Map<number, UserFlowState>()

// Helper function to clear user state
const clearUserState = (userId: number) => {
  userFlowState.delete(userId)
}

// Helper function to get display text for market activity
const getMarketActivityText = (value: number | null): string => {
  if (value === null || value === 0) return "Any"
  if (value === 4) return "Less than 5"
  if (value === 19) return "Less than 20"
  if (value === 49) return "Less than 50"
  if (value === 99) return "Less than 100"
  return `Less than ${value + 1}`
}

// Helper function to get display text for bet amount
const getBetAmountText = (value: number): string => {
  if (value === 999) return "$1,000"
  if (value === 9999) return "$10,000"
  if (value === 49999) return "$50,000"
  if (value === 99999) return "$100,000"
  return `$${value.toLocaleString()}`
}

// Helper function to get display text for liquidity
const getLiquidityText = (value: number): string => {
  return `${value}%`
}

// START COMMAND - Entry point
bot.command("start", async (ctx) => {
  if (!ctx.from) return
  try {
    clearUserState(ctx.from.id)

    const keyboard = new InlineKeyboard().text("🚀 Set Up Alerts", "flow_start")

    await ctx.reply(
      "👋 Welcome to Polymarket Hunter!\n\n" +
        "🔍 Track smart money traders on Polymarket in real-time\n" +
        "⚡ Get instant alerts when trades match your criteria\n" +
        "🎯 Set your filters once and let us do the monitoring\n\n" +
        "Ready to get started? Click the button below to configure your alert filters.",
      { reply_markup: keyboard }
    )
  } catch (error) {
    console.error("Error in start command:", error)
    try {
      await ctx.reply(
        "❌ <b>Oops! Something went wrong</b>\n\n" +
          "We encountered an error while starting. Please try again in a moment.",
        { parse_mode: "HTML" }
      )
    } catch (replyError) {
      console.error("Error sending error message:", replyError)
    }
  }
})

// RESET COMMAND - Restart configuration
bot.command("reset", async (ctx) => {
  if (!ctx.from) return
  try {
    // Immediately stop monitoring to prevent new messages
    await setMonitoringStatus(ctx.from.id, false)
    clearUserState(ctx.from.id)

    const keyboard = new InlineKeyboard().text("🚀 Set Up Alerts", "flow_start")

    await ctx.reply(
      "🔄 Configuration reset successfully!\n\n" +
        "All your previous settings have been cleared. Let's set up your filters from scratch.\n\n" +
        "Click the button below to begin the setup process.",
      { reply_markup: keyboard }
    )
  } catch (error) {
    console.error("Error in reset command:", error)
    try {
      await ctx.reply(
        "❌ <b>Failed to Reset</b>\n\n" +
          "We encountered an error while resetting your configuration. Please try again.",
        { parse_mode: "HTML" }
      )
    } catch (replyError) {
      console.error("Error sending error message:", replyError)
    }
  }
})

// STATUS COMMAND - Show current settings and monitoring status
bot.command("status", async (ctx) => {
  if (!ctx.from) return
  try {
    const settings = await getUserBudget(ctx.from.id)
    const monitoringActive = await isMonitoringActive(ctx.from.id)

    if (settings) {
      const marketText =
        settings.max_markets_traded === 0 ||
        settings.max_markets_traded === null
          ? "Any"
          : getMarketActivityText(settings.max_markets_traded)

      const lines = [
        "📊 <b>Your Alert Configuration</b>",
        "",
        "🎯 <b>Filters:</b>",
        `   • Max markets traded: <b>${marketText}</b>`,
        `   • Min trade size: <b>${getBetAmountText(
          parseInt(settings.budget_threshold)
        )}</b>`,
        `   • Min liquidity: <b>${getLiquidityText(
          parseInt(settings.liquidity_threshold)
        )}</b>`,
        "",
        "⚡ <b>Alert Logic:</b> You'll receive alerts when <b>either</b> the trade size <b>OR</b> liquidity threshold is met (or both).",
        "",
        `📡 <b>Status:</b> ${
          monitoringActive
            ? "🟢 <b>Active</b> - Receiving alerts"
            : "🔴 <b>Inactive</b> - Alerts paused"
        }`,
        "",
        monitoringActive
          ? "💡 You'll receive notifications when trades match your criteria."
          : "💡 Start monitoring to begin receiving real-time alerts.",
      ]

      const keyboard = new InlineKeyboard()
      if (monitoringActive) {
        keyboard.text("⏸️ Pause Monitoring", "stop_monitoring_confirm")
      } else {
        keyboard.text("▶️ Start Monitoring", "start_monitoring")
      }
      keyboard.row().text("🔄 Reset Settings", "reset_confirm")

      await ctx.reply(lines.join("\n"), {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
    } else {
      const keyboard = new InlineKeyboard().text(
        "🚀 Set Up Alerts",
        "flow_start"
      )
      await ctx.reply(
        "⚠️ <b>No Configuration Found</b>\n\n" +
          "You haven't set up your alert filters yet. Click the button below to configure your settings and start tracking Polymarket trades.",
        { reply_markup: keyboard, parse_mode: "HTML" }
      )
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    await ctx.reply(
      "❌ <b>Oops! Something went wrong</b>\n\n" +
        "We couldn't retrieve your settings. Please try again in a moment, or use /reset to start fresh.",
      { parse_mode: "HTML" }
    )
  }
})

// INFO COMMAND - Alias for status
bot.command("info", async (ctx) => {
  // Just call the status handler logic directly
  if (!ctx.from) return
  try {
    const settings = await getUserBudget(ctx.from.id)
    const monitoringActive = await isMonitoringActive(ctx.from.id)

    if (settings) {
      const marketText =
        settings.max_markets_traded === 0 ||
        settings.max_markets_traded === null
          ? "Any"
          : getMarketActivityText(settings.max_markets_traded)

      const lines = [
        "📊 <b>Your Alert Configuration</b>",
        "",
        "🎯 <b>Filters:</b>",
        `   • Max markets traded: <b>${marketText}</b>`,
        `   • Min trade size: <b>${getBetAmountText(
          parseInt(settings.budget_threshold)
        )}</b>`,
        `   • Min liquidity: <b>${getLiquidityText(
          parseInt(settings.liquidity_threshold)
        )}</b>`,
        "",
        "⚡ <b>Alert Logic:</b> You'll receive alerts when <b>either</b> the trade size <b>OR</b> liquidity threshold is met (or both).",
        "",
        `📡 <b>Status:</b> ${
          monitoringActive
            ? "🟢 <b>Active</b> - Receiving alerts"
            : "🔴 <b>Inactive</b> - Alerts paused"
        }`,
        "",
        monitoringActive
          ? "💡 You'll receive notifications when trades match your criteria."
          : "💡 Start monitoring to begin receiving real-time alerts.",
      ]

      const keyboard = new InlineKeyboard()
      if (monitoringActive) {
        keyboard.text("⏸️ Pause Monitoring", "stop_monitoring_confirm")
      } else {
        keyboard.text("▶️ Start Monitoring", "start_monitoring")
      }
      keyboard.row().text("🔄 Reset Settings", "reset_confirm")

      await ctx.reply(lines.join("\n"), {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
    } else {
      const keyboard = new InlineKeyboard().text(
        "🚀 Set Up Alerts",
        "flow_start"
      )
      await ctx.reply(
        "⚠️ <b>No Configuration Found</b>\n\n" +
          "You haven't set up your alert filters yet. Click the button below to configure your settings and start tracking Polymarket trades.",
        { reply_markup: keyboard, parse_mode: "HTML" }
      )
    }
  } catch (error) {
    console.error("Error fetching settings:", error)
    await ctx.reply(
      "❌ <b>Oops! Something went wrong</b>\n\n" +
        "We couldn't retrieve your settings. Please try again in a moment, or use /reset to start fresh.",
      { parse_mode: "HTML" }
    )
  }
})

// STOP COMMAND - Stop monitoring
bot.command("stop", async (ctx) => {
  if (!ctx.from) return
  try {
    // Immediately stop monitoring to prevent new messages
    await setMonitoringStatus(ctx.from.id, false)

    const keyboard = new InlineKeyboard()
      .text("⏸️ Yes, Pause Monitoring", "stop_monitoring")
      .row()
      .text("❌ Cancel", "cancel_stop")

    await ctx.reply(
      "⏸️ <b>Pause Monitoring?</b>\n\n" +
        "If you pause monitoring, you'll stop receiving real-time alerts until you resume.\n\n" +
        "Your settings will be saved, so you can easily restart later with /start_monitoring.",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in stop command:", error)
    try {
      await ctx.reply(
        "❌ <b>Failed to Load Confirmation</b>\n\n" +
          "We encountered an error. Please try again in a moment.",
        { parse_mode: "HTML" }
      )
    } catch (replyError) {
      console.error("Error sending error message:", replyError)
    }
  }
})

// START_MONITORING COMMAND - Resume monitoring
bot.command("start_monitoring", async (ctx) => {
  if (!ctx.from) return
  try {
    const settings = await getUserBudget(ctx.from.id)
    if (!settings) {
      const keyboard = new InlineKeyboard().text(
        "🚀 Set Up Alerts",
        "flow_start"
      )
      await ctx.reply(
        "⚠️ <b>Configuration Required</b>\n\n" +
          "You need to set up your alert filters before you can start monitoring. Click the button below to begin.",
        { reply_markup: keyboard, parse_mode: "HTML" }
      )
      return
    }

    await setMonitoringStatus(ctx.from.id, true)
    await ctx.reply(
      "✅ <b>Monitoring Active!</b>\n\n" +
        "🟢 You're now receiving real-time alerts\n" +
        "📊 Watching for trades matching your criteria\n" +
        "🔔 Notifications will arrive as matching trades are detected\n\n" +
        "Use /status to view your settings or /stop to pause monitoring.",
      { parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error starting monitoring:", error)
    await ctx.reply(
      "❌ <b>Failed to Start Monitoring</b>\n\n" +
        "We encountered an error while starting monitoring. Please try again in a moment.",
      { parse_mode: "HTML" }
    )
  }
})

// FLOW: Start button clicked
bot.callbackQuery("flow_start", async (ctx) => {
  if (!ctx.from) return
  try {
    clearUserState(ctx.from.id)
    userFlowState.set(ctx.from.id, { step: "market_activity" })

    const keyboard = new InlineKeyboard()
      .text("Less than 5", "market_5")
      .text("Less than 20", "market_20")
      .row()
      .text("Less than 50", "market_50")
      .text("Less than 100", "market_100")
      .row()
      .text("Any", "market_any")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "📋 <b>Step 1 of 4: Market Activity</b>\n\n" +
        "What's the maximum number of markets a wallet should have traded in?\n\n" +
        "💡 <i>Tip: Lower numbers help you track newer or less active traders.</i>",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in flow_start callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Failed to start setup. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// FLOW: Market activity selected
bot.callbackQuery(/^market_(5|20|50|100|any)$/, async (ctx) => {
  if (!ctx.from || !ctx.match || !ctx.match[1]) return

  try {
    const state = userFlowState.get(ctx.from.id) || { step: null }
    let maxMarkets: number | null

    if (ctx.match[1] === "any") {
      maxMarkets = null
    } else {
      const value = parseInt(ctx.match[1])
      if (isNaN(value)) {
        throw new Error(`Invalid market value: ${ctx.match[1]}`)
      }
      maxMarkets = value === 5 ? 4 : value === 20 ? 19 : value === 50 ? 49 : 99
    }

    state.maxMarkets = maxMarkets
    state.step = "bet_amount"
    userFlowState.set(ctx.from.id, state)

    const keyboard = new InlineKeyboard()
      .text("$1,000", "bet_1000")
      .text("$10,000", "bet_10000")
      .row()
      .text("$50,000", "bet_50000")
      .text("$100,000", "bet_100000")
      .row()
      .text("Custom", "bet_custom")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `✅ Selected: <b>${getMarketActivityText(maxMarkets)}</b>\n\n` +
        `📋 <b>Step 2 of 4: Trade Size</b>\n\n` +
        `What's the minimum trade size (in USD) you want to track?\n\n` +
        `💡 <i>Tip: Higher amounts help you focus on significant trades.</i>`,
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in market selection callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error processing selection. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// FLOW: Bet amount selected
bot.callbackQuery(/^bet_(1000|10000|50000|100000|custom)$/, async (ctx) => {
  if (!ctx.from || !ctx.match || !ctx.match[1]) return

  try {
    if (ctx.match[1] === "custom") {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(
        "💰 <b>Custom Trade Size</b>\n\n" +
          "Please enter the minimum trade amount in USD.\n\n" +
          "📝 <b>Example:</b> <code>5000</code> (for $5,000)\n" +
          "📝 <b>Example:</b> <code>25000</code> (for $25,000)\n\n" +
          "💡 Enter just the number (no dollar signs or commas).\n\n" +
          "Or use /reset to start over.",
        { parse_mode: "HTML" }
      )
      // Set state to wait for custom input
      const state = userFlowState.get(ctx.from.id) || { step: null }
      state.step = "bet_amount"
      state.betAmount = -1 // Flag for custom input
      userFlowState.set(ctx.from.id, state)
      return
    }

    const state = userFlowState.get(ctx.from.id) || { step: null }
    const value = parseInt(ctx.match[1])
    if (isNaN(value)) {
      throw new Error(`Invalid bet amount value: ${ctx.match[1]}`)
    }

    const betAmount =
      value === 1000
        ? 999
        : value === 10000
        ? 9999
        : value === 50000
        ? 49999
        : 99999

    state.betAmount = betAmount
    state.step = "liquidity"
    userFlowState.set(ctx.from.id, state)

    const keyboard = new InlineKeyboard()
      .text("5%", "liquidity_5")
      .text("10%", "liquidity_10")
      .row()
      .text("Custom", "liquidity_custom")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      `✅ Selected: <b>${getBetAmountText(betAmount)}</b>\n\n` +
        `📋 <b>Step 3 of 4: Liquidity</b>\n\n` +
        `What's the minimum liquidity percentage the trader should provide?\n\n` +
        `💡 <i>Tip: Higher percentages indicate traders adding significant liquidity to markets.</i>`,
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in bet amount selection callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error processing selection. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// FLOW: Liquidity selected
bot.callbackQuery(/^liquidity_(5|10|custom)$/, async (ctx) => {
  if (!ctx.from || !ctx.match || !ctx.match[1]) return

  try {
    if (ctx.match[1] === "custom") {
      await ctx.answerCallbackQuery()
      await ctx.editMessageText(
        "💧 <b>Custom Liquidity Percentage</b>\n\n" +
          "Please enter the minimum liquidity percentage (1-100).\n\n" +
          "📝 <b>Example:</b> <code>15</code> (for 15%)\n" +
          "📝 <b>Example:</b> <code>25</code> (for 25%)\n\n" +
          "💡 Enter just the number (no percentage sign).\n\n" +
          "Or use /reset to start over.",
        { parse_mode: "HTML" }
      )
      // Set state to wait for custom input
      const state = userFlowState.get(ctx.from.id) || { step: null }
      state.step = "liquidity"
      state.liquidity = -1 // Flag for custom input
      userFlowState.set(ctx.from.id, state)
      return
    }

    const state = userFlowState.get(ctx.from.id) || { step: null }
    const liquidity = parseInt(ctx.match[1])
    if (isNaN(liquidity) || liquidity < 1 || liquidity > 100) {
      throw new Error(`Invalid liquidity value: ${ctx.match[1]}`)
    }

    if (!state.betAmount) {
      throw new Error("Bet amount not set in state")
    }

    state.liquidity = liquidity
    state.step = "review"
    userFlowState.set(ctx.from.id, state)

    // Show review screen
    const keyboard = new InlineKeyboard()
      .text("✅ Activate Monitoring", "activate_monitoring")
      .row()
      .text("✏️ Edit Market Activity", "edit_market")
      .text("✏️ Edit Trade Size", "edit_bet")
      .row()
      .text("✏️ Edit Liquidity", "edit_liquidity")

    const reviewText = [
      "🎯 <b>Review Your Configuration</b>",
      "",
      "Your alert filters are ready! Review your settings below:",
      "",
      "📊 <b>Your Filters:</b>",
      `   • Max markets traded: <b>${getMarketActivityText(
        state.maxMarkets ?? null
      )}</b>`,
      `   • Min trade size: <b>${getBetAmountText(state.betAmount)}</b>`,
      `   • Min liquidity: <b>${getLiquidityText(state.liquidity)}</b>`,
      "",
      "⚡ <b>Alert Logic:</b> You'll receive alerts when <b>either</b> the trade size <b>OR</b> liquidity threshold is met (or both).",
      "",
      "Once activated, we'll monitor Polymarket 24/7 and send you alerts whenever a trade matches these criteria.",
    ].join("\n")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(reviewText, {
      parse_mode: "HTML",
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error("Error in liquidity selection callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error processing selection. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// FLOW: Handle custom bet amount input
bot.on("message:text", async (ctx) => {
  if (!ctx.from) return
  const state = userFlowState.get(ctx.from.id)

  try {
    if (state?.step === "bet_amount" && state.betAmount === -1) {
      const text = ctx.message.text.trim()
      const amount = parseInt(text)

      if (isNaN(amount) || amount < 1) {
        await ctx.reply(
          "⚠️ <b>Invalid Amount</b>\n\n" +
            "Please enter a valid number greater than 0.\n\n" +
            "📝 <b>Example:</b> <code>5000</code> (for $5,000)\n\n" +
            "Or use /reset to start over.",
          { parse_mode: "HTML" }
        )
        return
      }

      state.betAmount = amount
      state.step = "liquidity"
      userFlowState.set(ctx.from.id, state)

      const keyboard = new InlineKeyboard()
        .text("5%", "liquidity_5")
        .text("10%", "liquidity_10")
        .row()
        .text("Custom", "liquidity_custom")

      await ctx.reply(
        `✅ Selected: <b>${getBetAmountText(amount)}</b>\n\n` +
          `📋 <b>Step 3 of 4: Liquidity</b>\n\n` +
          `What's the minimum liquidity percentage the trader should provide?\n\n` +
          `💡 <i>Tip: Higher percentages indicate traders adding significant liquidity to markets.</i>`,
        { reply_markup: keyboard, parse_mode: "HTML" }
      )
      return
    }

    if (state?.step === "liquidity" && state.liquidity === -1) {
      const text = ctx.message.text.trim()
      const liquidity = parseInt(text)

      if (isNaN(liquidity) || liquidity < 1 || liquidity > 100) {
        await ctx.reply(
          "⚠️ <b>Invalid Percentage</b>\n\n" +
            "Please enter a number between 1 and 100.\n\n" +
            "📝 <b>Example:</b> <code>15</code> (for 15%)\n" +
            "📝 <b>Example:</b> <code>25</code> (for 25%)\n\n" +
            "Or use /reset to start over.",
          { parse_mode: "HTML" }
        )
        return
      }

      if (!state.betAmount) {
        throw new Error("Bet amount not set in state")
      }

      state.liquidity = liquidity
      state.step = "review"
      userFlowState.set(ctx.from.id, state)

      // Show review screen
      const keyboard = new InlineKeyboard()
        .text("✅ Activate Monitoring", "activate_monitoring")
        .row()
        .text("✏️ Edit Market Activity", "edit_market")
        .text("✏️ Edit Trade Size", "edit_bet")
        .row()
        .text("✏️ Edit Liquidity", "edit_liquidity")

      const reviewText = [
        "🎯 <b>Review Your Configuration</b>",
        "",
        "Your alert filters are ready! Review your settings below:",
        "",
        "📊 <b>Your Filters:</b>",
        `   • Max markets traded: <b>${getMarketActivityText(
          state.maxMarkets ?? null
        )}</b>`,
        `   • Min trade size: <b>${getBetAmountText(state.betAmount)}</b>`,
        `   • Min liquidity: <b>${getLiquidityText(state.liquidity)}</b>`,
        "",
        "⚡ <b>Alert Logic:</b> You'll receive alerts when <b>either</b> the trade size <b>OR</b> liquidity threshold is met (or both).",
        "",
        "Once activated, we'll monitor Polymarket 24/7 and send you alerts whenever a trade matches these criteria.",
      ].join("\n")

      await ctx.reply(reviewText, {
        parse_mode: "HTML",
        reply_markup: keyboard,
      })
      return
    }
  } catch (error) {
    console.error("Error processing text message:", error)
    try {
      await ctx.reply(
        "❌ <b>Error Processing Input</b>\n\n" +
          "We encountered an error while processing your input. Please try again or use /reset to start over.",
        { parse_mode: "HTML" }
      )
    } catch (replyError) {
      console.error("Error sending error message:", replyError)
    }
  }
})

// FLOW: Edit options
bot.callbackQuery("edit_market", async (ctx) => {
  if (!ctx.from) return
  try {
    const state = userFlowState.get(ctx.from.id) || { step: null }
    state.step = "market_activity"
    userFlowState.set(ctx.from.id, state)

    const keyboard = new InlineKeyboard()
      .text("Less than 5", "market_5")
      .text("Less than 20", "market_20")
      .row()
      .text("Less than 50", "market_50")
      .text("Less than 100", "market_100")
      .row()
      .text("Any", "market_any")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "📋 <b>Step 1 of 4: Market Activity</b>\n\n" +
        "What's the maximum number of markets a wallet should have traded in?\n\n" +
        "💡 <i>Tip: Lower numbers help you track newer or less active traders.</i>",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in edit_market callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error loading edit screen. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

bot.callbackQuery("edit_bet", async (ctx) => {
  if (!ctx.from) return
  try {
    const state = userFlowState.get(ctx.from.id) || { step: null }
    state.step = "bet_amount"
    userFlowState.set(ctx.from.id, state)

    const keyboard = new InlineKeyboard()
      .text("$1,000", "bet_1000")
      .text("$10,000", "bet_10000")
      .row()
      .text("$50,000", "bet_50000")
      .text("$100,000", "bet_100000")
      .row()
      .text("Custom", "bet_custom")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "📋 <b>Step 2 of 4: Trade Size</b>\n\n" +
        "What's the minimum trade size (in USD) you want to track?\n\n" +
        "💡 <i>Tip: Higher amounts help you focus on significant trades.</i>",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in edit_bet callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error loading edit screen. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

bot.callbackQuery("edit_liquidity", async (ctx) => {
  if (!ctx.from) return
  try {
    const state = userFlowState.get(ctx.from.id) || { step: null }
    state.step = "liquidity"
    userFlowState.set(ctx.from.id, state)

    const keyboard = new InlineKeyboard()
      .text("5%", "liquidity_5")
      .text("10%", "liquidity_10")
      .row()
      .text("Custom", "liquidity_custom")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "📋 <b>Step 3 of 4: Liquidity</b>\n\n" +
        "What's the minimum liquidity percentage the trader should provide?\n\n" +
        "💡 <i>Tip: Higher percentages indicate traders adding significant liquidity to markets.</i>",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in edit_liquidity callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error loading edit screen. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// FLOW: Activate monitoring
bot.callbackQuery("activate_monitoring", async (ctx) => {
  if (!ctx.from) return
  const state = userFlowState.get(ctx.from.id)

  if (!state || !state.betAmount || !state.liquidity) {
    await ctx.answerCallbackQuery({
      text: "⚠️ Configuration incomplete. Please complete all steps.",
      show_alert: true,
    })
    return
  }

  try {
    await saveCompleteSettings(
      ctx.from.id,
      state.betAmount,
      state.liquidity,
      state.maxMarkets ?? 0
    )

    clearUserState(ctx.from.id)

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "🎉 <b>Monitoring Activated!</b>\n\n" +
        "✅ Your alert filters have been saved\n" +
        "🟢 Real-time monitoring is now active\n" +
        "🔔 You'll receive instant notifications when matching trades are detected\n\n" +
        "<b>What's next?</b>\n" +
        "• Use /status to view your settings anytime\n" +
        "• Use /stop to pause monitoring\n" +
        "• Sit back and wait for alerts! 🚀",
      { parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error saving settings:", error)
    await ctx.answerCallbackQuery({
      text: "❌ Failed to save settings. Please try again.",
      show_alert: true,
    })
  }
})

// Stop monitoring callbacks
bot.callbackQuery("stop_monitoring_confirm", async (ctx) => {
  if (!ctx.from) return
  try {
    const keyboard = new InlineKeyboard()
      .text("⏸️ Yes, Pause Monitoring", "stop_monitoring")
      .row()
      .text("❌ Cancel", "cancel_stop")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "⏸️ <b>Pause Monitoring?</b>\n\n" +
        "If you pause monitoring, you'll stop receiving real-time alerts until you resume.\n\n" +
        "Your settings will be saved, so you can easily restart later with /start_monitoring.",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in stop_monitoring_confirm callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error loading confirmation. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

bot.callbackQuery("stop_monitoring", async (ctx) => {
  if (!ctx.from) return
  try {
    await setMonitoringStatus(ctx.from.id, false)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "⏸️ <b>Monitoring Paused</b>\n\n" +
        "🔴 Alerts are now paused\n" +
        "💾 Your settings have been saved\n\n" +
        "You won't receive notifications until you resume monitoring.\n\n" +
        "Use /start_monitoring to reactivate alerts anytime.",
      { parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error stopping monitoring:", error)
    await ctx.answerCallbackQuery({
      text: "❌ Failed to pause monitoring. Please try again.",
      show_alert: true,
    })
  }
})

bot.callbackQuery("cancel_stop", async (ctx) => {
  try {
    await ctx.answerCallbackQuery()
    await ctx.deleteMessage()
  } catch (error) {
    console.error("Error in cancel_stop callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error canceling. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

bot.callbackQuery("start_monitoring", async (ctx) => {
  if (!ctx.from) return
  try {
    const settings = await getUserBudget(ctx.from.id)
    if (!settings) {
      await ctx.answerCallbackQuery({
        text: "⚠️ Please configure your filters first using /start",
        show_alert: true,
      })
      return
    }

    await setMonitoringStatus(ctx.from.id, true)
    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "✅ <b>Monitoring Active!</b>\n\n" +
        "🟢 You're now receiving real-time alerts\n" +
        "📊 Watching for trades matching your criteria\n" +
        "🔔 Notifications will arrive as matching trades are detected\n\n" +
        "Use /status to view your settings or /stop to pause monitoring.",
      { parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error starting monitoring:", error)
    await ctx.answerCallbackQuery({
      text: "❌ Failed to start monitoring. Please try again.",
      show_alert: true,
    })
  }
})

bot.callbackQuery("reset_confirm", async (ctx) => {
  if (!ctx.from) return
  try {
    // Immediately stop monitoring to prevent new messages
    await setMonitoringStatus(ctx.from.id, false)
    clearUserState(ctx.from.id)

    const keyboard = new InlineKeyboard().text("🚀 Set Up Alerts", "flow_start")

    await ctx.answerCallbackQuery()
    await ctx.editMessageText(
      "🔄 <b>Configuration Reset</b>\n\n" +
        "All your previous settings have been cleared.\n\n" +
        "Let's set up your filters from scratch. Click the button below to begin.",
      { reply_markup: keyboard, parse_mode: "HTML" }
    )
  } catch (error) {
    console.error("Error in reset_confirm callback:", error)
    try {
      await ctx.answerCallbackQuery({
        text: "❌ Error resetting configuration. Please try again.",
        show_alert: true,
      })
    } catch (callbackError) {
      console.error("Error answering callback query:", callbackError)
    }
  }
})

// Set bot commands
try {
  bot.api
    .setMyCommands([
      {
        command: "start",
        description: "🚀 Start the bot and configure alert filters",
      },
      {
        command: "status",
        description: "📊 View your current settings and monitoring status",
      },
      {
        command: "reset",
        description: "🔄 Reset and reconfigure your filters",
      },
      {
        command: "stop",
        description: "⏸️ Pause monitoring and stop receiving alerts",
      },
      {
        command: "start_monitoring",
        description: "▶️ Resume monitoring and start receiving alerts",
      },
      {
        command: "info",
        description: "ℹ️ View your alert settings (alias for /status)",
      },
    ])
    .catch((error) => {
      console.error("Error setting bot commands:", error)
    })
} catch (error) {
  console.error("Error initializing bot commands:", error)
}

// Check if this module is being run directly
// @ts-ignore
if (require.main === module) {
  bot.start().catch((error) => {
    console.error("Fatal error starting bot:", error)
    process.exit(1)
  })
}

// Global error handler for unhandled errors
bot.catch((err) => {
  const ctx = err.ctx
  console.error(
    `Error while handling update ${ctx.update.update_id}:`,
    err.error
  )

  // Try to send error message to user if possible
  if (ctx && ctx.from) {
    ctx
      .reply(
        "❌ <b>An unexpected error occurred</b>\n\n" +
          "We're sorry for the inconvenience. Please try again in a moment.",
        { parse_mode: "HTML" }
      )
      .catch((replyError) => {
        console.error("Error sending error message to user:", replyError)
      })
  }
})

export default bot
