const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
const port = process.env.PORT || 10000;

// एरर हैंडलिंग ताकि बोट क्रैश न हो
process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(port, () => console.log(`Server running on port ${port}`));

bot.start((ctx) => ctx.reply('Bot is working!'));

bot.on('text', async (ctx) => {
    ctx.reply('मैं अभी सेटअप मोड में हूँ, थोडा इंतज़ार करें!');
});

bot.launch();
