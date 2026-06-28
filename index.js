const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('@composio/core');

// Production Configuration
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/health', (req, res) => res.status(200).send('OK'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialize Clients
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

bot.on('text', async (ctx) => {
    const statusMsg = await ctx.reply('Searching and summarizing... 🔍');
    try {
        // Initialize Composio Session
        const session = await composio.createSession({ language: 'javascript' });
        
        // Get the Google Search tool using latest SDK session
        const tools = await session.getTools({ apps: ['google_search'] });
        
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash', 
            tools: [{ functionDeclarations: tools }]
        });

        // Generate response using tools
        const result = await model.generateContent(ctx.message.text);
        const responseText = result.response.text();

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, responseText);
        
        // Cleanup session
        await session.close();
    } catch (error) {
        console.error('Execution Error:', error);
        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'Error processing your request.');
    }
});

// Graceful Shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch().then(() => console.log('Bot is live.'));
