import { Redis } from '@upstash/redis';
import TelegramBot from 'node-telegram-bot-api';

const pairsList = [
  { pair: "USDBRLOTC", title: "💖 USD / BRL OTC 💖" },
  { pair: "USDMXNOTC", title: "🌸 USD / MXN OTC 🌸" },
  { pair: "USDNGNOTC", title: "✨ USD / NGN OTC ✨" },
  { pair: "USDZAROTC", title: "💫 USD / ZAR OTC 💫" },
  { pair: "USDINROTC", title: "🌸 USD / INR OTC 🌸" },
  { pair: "USDPKROTC", title: "🌸 USD / PKR OTC 🌸" },
  { pair: "NZDCHFOTC", title: "🌸 NZD / CHF OTC 🌸" },
  { pair: "USDARSOTC", title: "🌸 USD / ARS OTC 🌸" },
  { pair: "USDCOPOTC", title: "🌸 USD / COP OTC 🌸" },
  { pair: "CADCHFOTC", title: "🌸 CAD / CHF OTC 🌸" },
  { pair: "USDBDTOTC", title: "🌸 USD / BDT OTC 🌸" }
];

export default async function handler(req, res) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      return res.status(500).json({ 
        error: "Database variables missing. Make sure Upstash KV is connected." 
      });
    }

    const redis = new Redis({ url, token });
    const config = await redis.get('bot_config');

    if (!config || !config.enabled) {
      return res.status(200).json({ status: "Bot is OFF" });
    }

    let count = (await redis.get('signal_count')) || 0;

    if (count >= 100) {
      const bot = new TelegramBot(config.token);
      const summaryMsg = 
        "❤️ RQA AI SIGNALS BOT ❤️\n\n" +
        "      TODAY TOTAL SIGNALS = 100\n\n" +
        "      ALL SIGNALS COMPLETED SUCCESSFULLY! ✨";

      await bot.sendMessage(config.channelId, summaryMsg);
      
      config.enabled = false;
      await redis.set('bot_config', config);

      return res.status(200).json({ status: "Daily 100 Signals Completed" });
    }

    const selected = pairsList[Math.floor(Math.random() * pairsList.length)];

    let directionStr = "🔼 UP / CALL";
    try {
      const apiRes = await fetch(`https://magic-scripts-live.vercel.app/s/?pair=${selected.pair}&tf=1M`);
      const apiData = await apiRes.json();

      if (apiData && apiData.data && apiData.data.signal) {
        if (apiData.data.signal.toUpperCase() === "SELL") {
          directionStr = "🔽 DOWN / PUT";
        } else {
          directionStr = "🔼 UP / CALL";
        }
      }
    } catch (err) {
      console.error("API Fetch Error:", err);
    }

    count += 1;
    await redis.set('signal_count', count);

    const tradeTime = new Date(Date.now() + 30 * 1000);
    const hours = String(tradeTime.getHours()).padStart(2, '0');
    const minutes = String(tradeTime.getMinutes()).padStart(2, '0');
    const timeFormatted = `${hours}:${minutes}`;

    const fullMsg = 
      `${selected.title}\n\n` +
      `😍 1 MINUTES 💗\n\n` +
      `${directionStr}\n\n` +
      `⏰ TIME = ${timeFormatted}\n` +
      `📊 SIGNAL = ${count} / 100`;

    const bot = new TelegramBot(config.token);
    await bot.sendMessage(config.channelId, fullMsg);

    return res.status(200).json({ success: true, signalSent: count, pair: selected.pair, direction: directionStr });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
