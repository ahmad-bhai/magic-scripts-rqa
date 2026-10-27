import { Redis } from '@upstash/redis';

// Safe initialization check
let redis;
try {
  redis = Redis.fromEnv();
} catch (e) {
  console.error("Redis connection error:", e);
}

export default async function handler(req, res) {
  try {
    if (!redis) {
      return res.status(500).json({ error: "Upstash Redis environment variables are missing in Vercel." });
    }

    const { token, id, status } = req.query;

    if (!token || !id || status === undefined) {
      return res.status(400).json({ error: "Missing parameters: token, id, or status" });
    }

    const targetChannelId = `-100${id}`;
    const isON = status.toLowerCase() === 'true';

    await redis.set('bot_config', {
      token: token,
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
