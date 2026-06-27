const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  ctx.reply('सोच रहा हूँ... 🤔');

  try {
    // 1. Composio से टूल्स लेना
    const tools = await composio.getTools({ apps: ['google_search', 'github'] });
    
    // 2. Gemini को मैसेज भेजना
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(userMessage);
    const response = await result.response.text();
    
    ctx.reply(response);
  } catch (error) {
    ctx.reply('बॉस, कुछ गड़बड़ हो गई: ' + error.message);
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') await bot.handleUpdate(req.body);
  res.status(200).send('OK');
};
