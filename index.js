const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');

// अपनी API Keys को एनवायरनमेंट वेरिएबल्स से लोड करें
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

bot.start((ctx) => ctx.reply('Adil Claw AI एक्टिव है! कुछ भी पूछो, मैं सर्च करके बताऊंगा।'));

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');

  try {
    const tools = await composio.getTools({ apps: ['google_search'] });
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
    
    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();
    
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, responseText);
  } catch (error) {
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'अभी कुछ तकनीकी दिक्कत है, फिर से कोशिश करें!');
  }
});

bot.launch().then(() => console.log('Bot is running on Render!'));
