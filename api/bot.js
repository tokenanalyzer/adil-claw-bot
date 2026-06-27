const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const statusMsg = await ctx.reply('🔍 इंटरनेट खंगाल रहा हूँ...');

  try {
    // 1. इंटरनेट और टूल्स को जोड़ना
    const tools = await composio.getTools({ apps: ['google_search'] });
    
    // 2. Gemini को टूल्स के साथ सेट करना
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        tools: tools 
    });

    // 3. जवाब पाना
    const result = await model.generateContent(userMessage);
    const response = result.response.text();
    
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, response);
  } catch (error) {
    ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'बॉस, सर्च में गड़बड़ हो गई: ' + error.message);
  }
});

bot.launch();
