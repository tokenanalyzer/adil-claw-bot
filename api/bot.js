const { Telegraf } = require('telegraf');

// बोट का सेटअप
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('Hello Boss! Adil Claw Bot Vercel पर लाइव है! 🚀'));

bot.on('text', (ctx) => {
  ctx.reply('आपका मैसेज मिला: ' + ctx.message.text + '\n(अब यह कभी स्लीप मोड में नहीं जाएगा!)');
});

// Vercel Serverless Function (Webhook Handler)
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
    } catch (error) {
      console.error('Error parsing update:', error);
    }
  }
  // Vercel को बताना कि काम हो गया
  res.status(200).send('OK');
};
