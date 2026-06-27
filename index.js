bot.on('text', async (ctx) => {
  const userMessage = ctx.message.text;
  const statusMsg = await ctx.reply('सर्च कर रहा हूँ... 🔍');

  try {
    // 1. टूल्स लाएं
    const tools = await composio.getTools({ apps: ['google_search'] });
    
    // 2. Gemini को टूल कॉन्फ़िगरेशन दें (यह लाइन बहुत ज़रूरी है)
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash', 
        tools: tools // यहाँ टूल्स पास करना ज़रूरी है
    });
    
    // 3. टूल्स के साथ कंटेंट जनरेट करें
    const result = await model.generateContent(userMessage);
    
    // 4. जवाब भेजें
    const responseText = result.response.text();
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, responseText);
    
  } catch (error) {
    console.error('Bot Error:', error); // यह लॉग्स में असल गलती बताएगा
    await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, 'Error: ' + error.message);
  }
});
