require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');

// बोट का सेटअप
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();

// जब कोई बोट को स्टार्ट करेगा
bot.start((ctx) => {
  ctx.reply('Hello Boss! Adil Claw Bot चालू हो गया है और डेटा निकालने के लिए तैयार है। 🚀');
});

// जब कोई नॉर्मल मैसेज भेजेगा
bot.on('text', (ctx) => {
  ctx.reply('आपका मैसेज मिल गया: ' + ctx.message.text + '\n(अभी मैं सिर्फ रिप्लाई कर रहा हूँ, अगले स्टेप में हम इसमें Gemini और Composio का दिमाग लगाएंगे!)');
});

// सर्वर को 24 घंटे चालू रखने के लिए
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Adil Claw Bot is running smoothly!'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  bot.launch();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
