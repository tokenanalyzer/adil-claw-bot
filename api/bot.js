const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  try {
    const tools = await composio.getTools({ apps: ['google_search'] });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
    const result = await model.generateContent(userMessage);
    ctx.reply(result.response.text());
  } catch (error) {
    ctx.reply('अभी कुछ सर्च करने में दिक्कत आ रही है, फिर से कोशिश करो!');
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') await bot.handleUpdate(req.body);
  res.status(200).send('OK');
};
