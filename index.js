const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('composio-core');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

const app = express();
app.get('/', (req, res) => res.send('Bot is healthy!'));
app.listen(process.env.PORT || 10000);

bot.start((ctx) => ctx.reply('मैं पूरी तरह एक्टिव हूँ! अब पूछो क्या पूछना है?'));

bot.on('text', async (ctx) => {
    const statusMsg = await ctx.reply('प्रोसेस कर रहा हूँ...');
    try {
        const tools = await composio.getTools({ apps: ['google_search'] });
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
        const result = await model.generateContent(ctx.message.text);
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, result.response.text());
    } catch (e) {
        // यहाँ रेंडर लॉग्स में असली एरर दिखेगा
        console.error('बोट एरर:', e); 
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'सॉरी, सर्च करने में दिक्कत आ रही है।');
    }
});

bot.launch();
