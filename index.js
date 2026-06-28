const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const { TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, SERPAPI_KEY } = process.env;
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY || !SERPAPI_KEY) {
  console.error('[FATAL] Missing env vars');
  process.exit(1);
}

const app = express();
app.get('/health', (req, res) => res.send('OK'));
app.listen(process.env.PORT || 10000, () => console.log('Server ready'));

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function searchWeb(query) {
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}&num=5`;
  const res = await fetch(url);
  const data = await res.json();
  const results = (data.organic_results || [])
    .slice(0, 5)
    .map(r => `${r.title}: ${r.snippet}`)
    .join('\n\n');
  return results || 'No results found';
}

bot.start((ctx) => ctx.reply('Salaam! Koi bhi sawaal poochho 🔍'));

bot.on('text', async (ctx) => {
  const query = ctx.message.text;
  const statusMsg = await ctx.reply('🔍 Search kar raha hoon...');
  try {
    const searchResults = await searchWeb(query);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(
      `Yeh search results hain:\n\n${searchResults}\n\nIn results ki concise summary do Hinglish mein user ke liye jo poochh raha tha: "${query}"`
    );
    const text = result.response.text();
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, text);
  } catch (err) {
    console.error('[Error]', err.message);
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, `❌ Error: ${err.message}`);
  }
});

bot.launch().then(() => console.log('✅ Bot is live!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
