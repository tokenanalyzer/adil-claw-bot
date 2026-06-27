const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');
const express = require('express'); // Express जोड़ें

const app = express();
const port = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

// Express हेल्थ चेक रूट - यह रेंडर को "Live" रखने के लिए ज़रूरी है
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(port, () => console.log(`Server is running on port ${port}`));

bot.start((ctx) => ctx.reply('Adil Claw AI एक्टिव है!'));

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');

  try {
    const tools = await composio.getTools({ apps: ['google_search'] });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
    const result = await model.generateContent(userMessage);
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, result.response.text());
  } catch (error) {
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'तकनीकी दिक्कत है!');
  }
});

bot.launch();
