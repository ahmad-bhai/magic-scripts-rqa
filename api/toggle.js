import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { token, id, status } = req.query;

  if (!token || !id || status === undefined) {
    return res.status(400).json({ error: "Missing parameters: token, id, or status" });
  }

  // Pure ID ke aage -100 attach ho jayega
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
}
