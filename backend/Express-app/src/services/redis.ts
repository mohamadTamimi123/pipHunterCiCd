import { createClient } from 'redis';
import { config } from '../config';

export const redis = createClient({ url: config.redisUrl });
redis.on('error', (err) => console.error('[redis]', err.message));

export async function connectRedis() {
    if (!redis.isOpen) await redis.connect();
}
