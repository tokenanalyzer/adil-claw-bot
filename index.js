const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ComposioToolSet } = require('composio-core');

process.on('uncaughtException', (err) => console.log('🔥 Fatal Error:', err.message));
process.on('unhandledRejection', (err) => console.log('🔥 Promise Error:', err.message));

const app = express();
app.get('/', (req, res) => res.send('सर्वर बिना क्रैश हुए चल रहा है!'));

app.listen(process.env.PORT || 10000, () => {
    console.log('✅ Web Server Running!');
});

try {
    // तुम्हारा परमानेंट टोकन
    const bot = new Telegraf('8502050477:AAE3oXn-Xv8FVbwrGIkdMzg8PUunJj4b3EM'); 
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const composioToolset = new ComposioToolSet({ apiKey: process.env.COMPOSIO_API_KEY });

    bot.start((ctx) => ctx.reply('Adil Claw AI एक्टिव है!'));

    bot.on('text', async (ctx) => {
        const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');
        try {
            let tools;
            
            // Composio का नया फंक्शन नाम खुद ढूंढने की निंजा तकनीक 🥷
            if (typeof composioToolset.getTools === 'function') {
                tools = await composioToolset.getTools({ apps: ['google_search'] });
            } else if (typeof composioToolset.get_tools === 'function') {
                tools = await composioToolset.get_tools({ apps: ['google_search'] });
            } else if (typeof composioToolset.getAppTools === 'function') {
                tools = await composioToolset.getAppTools({ apps: ['google_search'] });
            } else if (typeof composioToolset.getActions === 'function') {
                tools = await composioToolset.getActions({ apps: ['google_search'] });
            } else {
                // अगर नाम कुछ और ही है, तो टेलीग्राम पर सारे मौजूद नाम प्रिंट कर दो
                const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(composioToolset));
                const keys = Object.keys(composioToolset);
                throw new Error("असली नाम इनमें से कोई एक है: " + methods.join(', ') + " | " + keys.join(', '));
            }

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', tools: tools });
            const result = await model.generateContent(ctx.message.text);
            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, result.response.text());
        } catch (error) {
            console.log('Runtime Error:', error.message);
            await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'सर्च में दिक्कत: ' + error.message);
        }
    });

    bot.launch().then(() => {
        console.log('✅ Telegram Bot Started Successfully!');
    }).catch((err) => {
        console.log('❌ Telegram Connection Error:', err.message);
    });

} catch (e) {
    console.log('❌ Setup Error:', e.message);
}
