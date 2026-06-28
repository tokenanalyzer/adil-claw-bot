const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ComposioToolSet } = require('composio-core'); 

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composioToolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

const app = express();
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(process.env.PORT || 10000);

bot.start((ctx) => ctx.reply('Adil Claw AI एक्टिव है!'));

bot.on('text', async (ctx) => {
    const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');
    try {
        const tools = await composioToolset.getTools({ apps: ['google_search'] });
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
        const result = await model.generateContent(ctx.message.text);
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, result.response.text());
    } catch (error) {
        // यह लाइन असली एरर को टेलीग्राम पर भेज देगी
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'असली एरर यह है: ' + error.message);
    }
});

bot.launch();
