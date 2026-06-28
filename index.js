const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Composio } = require('@composio/core');

// ── Crash handlers ──────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('[FATAL]', err.message);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL REJECTION]', reason);
  process.exit(1);
});

// ── Env Check ───────────────────────────────────────────────
const { TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, COMPOSIO_API_KEY } = process.env;
if (!TELEGRAM_BOT_TOKEN || !GEMINI_API_KEY || !COMPOSIO_API_KEY) {
  console.error('[FATAL] Missing environment variables!');
  process.exit(1);
}

// ── Express health check (Render ke liye zaroori) ───────────
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/health', (req, res) => res.send('OK'));
app.listen(PORT, () => console.log(`Health server on port ${PORT}`));

// ── Init ────────────────────────────────────────────────────
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const composio = new Composio({ apiKey: COMPOSIO_API_KEY });

// ── Bot Logic ───────────────────────────────────────────────
bot.start((ctx) => ctx.reply('Salaam! Koi bhi sawaal poochho, main search karke bataunga. 🔍'));

bot.on('text', async (ctx) => {
  const userQuery = ctx.message.text;
  const statusMsg = await ctx.reply('🔍 Search kar raha hoon...');

  try {
    // NEW SDK: session-based architecture
    const session = await composio.create(String(ctx.from.id), {
      toolkits: ['googleserp'],
    });

    // Tools fetch karo session se
    const composioTools = await session.tools();

    // Gemini ko tools ke saath initialize karo
    // gemini-1.5-flash DEPRECATED hai, ab gemini-2.0-flash use karo
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: composioTools,
    });

    const result = await model.generateContent(
      `Search karo aur concise summary do: ${userQuery}`
    );

    let finalText = '';

    // Tool call handle karo agar Gemini ne search kiya
    const candidate = result.response.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    let toolCallHandled = false;
    for (const part of parts) {
      if (part.functionCall) {
        toolCallHandled = true;
        const toolResult = await session.execute(
          part.functionCall.name,
          part.functionCall.args || {}
        );

        // Tool result ke baad final answer lo
        const finalResult = await model.generateContent([
          { text: `User query: ${userQuery}` },
          {
            functionResponse: {
              name: part.functionCall.name,
              response: toolResult,
            },
          },
          { text: 'Ab in results ki concise summary do Hinglish mein.' },
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
    console.error('[Bot Error]', err.message || err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      `❌ Error: ${err.message}`
    );
  }
});

bot.catch((err) => console.error('[Telegraf Error]', err));

// ── Launch ──────────────────────────────────────────────────
bot.launch().then(() => console.log('✅ Bot is live!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
