import { ConnectionOptions } from 'bullmq';
import { env } from './env.config'

export const redisConnection: ConnectionOptions = {
  host: new URL(env.REDIS_URL).hostname,
  password: new URL(env.REDIS_URL).password || undefined
};