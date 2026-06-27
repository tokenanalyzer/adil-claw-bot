const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => ctx.reply('मैं अब वेबहुक पर हूँ! 🚀'));

bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  ctx.reply('मैंने सुना: ' + text);
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
  }
  res.status(200).send('OK');
};
