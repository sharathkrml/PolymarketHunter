import { Bot, InlineKeyboard } from 'grammy';
import { saveBudget } from './db';
import dotenv from 'dotenv';
dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('10k', 'set_10000').text('15k', 'set_15000').row()
    .text('20k', 'set_20000').text('Custom', 'set_custom');

  await ctx.reply(
    'Welcome to Polymarket Hunter! 🎯\n\n' +
    'Use the buttons below or commands to set your alert threshold.\n\n' +
    'COMMANDS:\n' +
    '/alert <amount> [liquidity] - Set alert (e.g. /alert 5000 10)\n' +
    '/help - Show usage instructions',
    { reply_markup: keyboard }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '🤖 *Polymarket Hunter Bot Help*\n\n' +
    '*Setting Alerts:*\n' +
    '• Use quick buttons for common thresholds.\n' +
    '• Use `/alert <amount>` to set a custom dollar threshold.\n' +
    '  Example: `/alert 5000` (Alerts for bets > $5000)\n\n' +
    '*Advanced Usage:*\n' +
    '• You can specify a liquidity % filter.\n' +
    '  Usage: `/alert <amount> <liquidity>`\n' +
    '  Example: `/alert 5000 10` (Bets > $5k or market liquidity > 10%)\n\n' +
    'Default liquidity is 5% if not specified.',
    { parse_mode: 'Markdown' }
  );
});

bot.command('alert', async (ctx) => {
  const text = ctx.match; // command args
  if (!text || typeof text !== 'string' || !text.trim()) {
    return ctx.reply('⚠️ detailed usage:\n/alert <amount> [liquidity]\nExample: /alert 5000 10');
  }

  const parts = text.trim().split(/\s+/);
  const amountStr = parts[0];
  if (!amountStr) {
    return ctx.reply('⚠️ Invalid amount.');
  }

  const amount = parseInt(amountStr.replace(/[^0-9]/g, ''));
  let liquidity = 5;

  if (parts.length > 1 && parts[1]) {
    const parsedLiq = parseFloat(parts[1]);
    if (!isNaN(parsedLiq)) liquidity = parsedLiq;
  }

  if (!isNaN(amount)) {
    await saveBudget(ctx.from?.id!, amount, liquidity);
    await ctx.reply(`✅ Threshold set to $${amount.toLocaleString()} with ${liquidity}% liquidity filter.`);
  } else {
    await ctx.reply("❌ Invalid amount. Please use a number like 5000.");
  }
});

// Handle button clicks
bot.callbackQuery(/set_(\d+)/, async (ctx) => {
  if (!ctx.match) return;
  const matchStr = ctx.match[1];
  if (matchStr && ctx.from) {
    const amount = parseInt(matchStr);
    await saveBudget(ctx.from.id, amount);
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`✅ Alert set! You'll be notified for trades over $${amount.toLocaleString()}.`);
  }
});

bot.callbackQuery('set_custom', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('To set a custom alert, please use the /alert command.\n\nExample: /alert 5000');
});

bot.start();
export default bot;
