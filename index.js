const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ComposioToolSet } = require('composio-core'); // यहाँ ComposioToolSet का इस्तेमाल किया है

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Composio की जगह ComposioToolSet सेट किया है
const composioToolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

const app = express();
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(process.env.PORT || 10000);

bot.start((ctx) => ctx.reply('Adil Claw AI एक्टिव है! अब कुछ भी पूछें।'));

bot.on('text', async (ctx) => {
    const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');
    try {
        // अब यहाँ getTools 100% काम करेगा
        const tools = await composioToolset.getTools({ apps: ['google_search'] });
        
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-1.5-flash', 
            tools: tools 
        });

        const result = await model.generateContent(ctx.message.text);
        const responseText = result.response.text();
        
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, responseText);
    } catch (error) {
        console.error('बोट एरर:', error);
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'सॉरी, सर्च करने में तकनीकी दिक्कत आ रही है।');
    }
});

bot.launch();
