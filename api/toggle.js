import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  try {
    // Vercel KV aur Upstash Redis dono Environment Variables support karega
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (!url || !token) {
      return res.status(500).json({ 
        error: "Database variables missing. Make sure Upstash KV is connected." 
      });
    }

    const redis = new Redis({ url, token });
    const { token: botToken, id, status } = req.query;

    if (!botToken || !id || status === undefined) {
      return res.status(400).json({ error: "Missing parameters: token, id, or status" });
    }

    const targetChannelId = `-100${id}`;
    const isON = status.toLowerCase() === 'true';

    await redis.set('bot_config', {
      token: botToken,
      channelId: targetChannelId,
      enabled: isON
    });

    if (isON) {
      await redis.set('signal_count', 0);
    }

    return res.status(200).json({
      success: true,
      message: `RQA AI SIGNALS BOT turned ${isON ? 'ON' : 'OFF'}`,
      channelId: targetChannelId
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
