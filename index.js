const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('@composio/core');

process.on('uncaughtException', (err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL]', reason);
  process.exit(1);
});

const { TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, COMPOSIO_API_KEY } = process.env;
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY || !COMPOSIO_API_KEY) {
  console.error('[FATAL] Missing environment variables!');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 10000;
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log(`Server on port ${PORT}`));

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const composio = new Composio({ apiKey: COMPOSIO_API_KEY });

bot.start((ctx) => ctx.reply('Salaam! Koi bhi sawaal poochho 🔍'));

bot.on('text', async (ctx) => {
  const userQuery = ctx.message.text;
  const statusMsg = await ctx.reply('🔍 Search kar raha hoon...');

  try {
    const session = await composio.create(String(ctx.from.id), {
      toolkits: ['serpapi'],
      authConfigs: {
        serpapi: 'ac_HfSUomaDKBya'
      }
    });

    const composioTools = await session.tools();

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: composioTools,
    });

    const result = await model.generateContent(
      `Search karo aur concise summary do: ${userQuery}`
    );

    const parts = result.response.candidates?.[0]?.content?.parts || [];
    let finalText = '';

    let toolCallHandled = false;
    for (const part of parts) {
      if (part.functionCall) {
        toolCallHandled = true;
        const toolResult = await session.execute(
          part.functionCall.name,
          part.functionCall.args || {}
        );

        const finalResult = await model.generateContent([
          { text: `User query: ${userQuery}` },
          {
            functionResponse: {
              name: part.functionCall.name,
              response: toolResult,
            },
          },
          { text: 'Ab in results ki concise summary do.' },
        ]);

        finalText = finalResult.response.text();
        break;
      }
    }

    if (!toolCallHandled) {
      finalText = result.response.text();
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      finalText || 'Koi result nahi mila.'
    );

  } catch (err) {
    console.error('[Error]', err.message || err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      `❌ Error: ${err.message}`
    );
  }
});

bot.catch((err) => console.error('[Telegraf]', err));
bot.launch().then(() => console.log('✅ Bot is live!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
