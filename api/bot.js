const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('मैं लाइव हूँ! 🚀'));
bot.on('text', (ctx) => ctx.reply('मैसेज मिला: ' + ctx.message.text));

// वेबहुक हटा दिया, अब यह बिना किसी लिंक के काम करेगा
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
