import { Redis } from '@upstash/redis';
import TelegramBot from 'node-telegram-bot-api';

const redis = Redis.fromEnv();
const OWNER_ID = 7476086614;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook active');
  }

  const { message } = req.body;
  if (!message || !message.text) {
    return res.status(200).send('OK');
  }

  const chatId = message.chat.id;
  const text = message.text.trim();
  const config = (await redis.get('bot_config')) || {};
  const token = config.token || process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return res.status(200).send('Token not set');
  }

  const bot = new TelegramBot(token);

  // Check if sender is owner
  if (chatId === OWNER_ID) {
    if (text === '/start') {
      await bot.sendMessage(chatId, "Hello bhai Kya session start Karun?");
    } else if (text === '/ready') {
      await bot.sendMessage(chatId, "SESSION START KAR RAHA HOON");

      // Turn ON signal loop in Redis
      config.enabled = true;
      await redis.set('bot_config', config);
      await redis.set('signal_count', 0);
    }
  }

  return res.status(200).send('OK');
}
