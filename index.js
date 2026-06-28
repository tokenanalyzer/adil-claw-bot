const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ComposioToolSet } = require('composio-core');

const app = express();
app.listen(process.env.PORT || 10000);

try {
    const bot = new Telegraf('8502050477:AAE3oXn-Xv8FVbwrGIkdMzg8PUunJj4b3EM');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const composioToolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

    bot.on('text', async (ctx) => {
        const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');
        try {
            const tools = await composioToolset.getTools({ apps: ['google_search'] });
            
            // यहाँ gemini-2.5-flash सेट कर दिया गया है
            const model = genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash', 
                tools: tools 
            });

            const result = await model.generateContent(ctx.message.text);
            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, result.response.text());
        } catch (error) {
            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'Error: ' + error.message);
        }
    });

    bot.launch();
} catch (e) {
    console.log('Setup Error:', e.message);
}
