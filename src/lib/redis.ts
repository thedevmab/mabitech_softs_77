import Redis from "ioredis";
import { isProduction } from "@/lib/env";

const globalForRedis = globalThis as unknown as { redis?: Redis | null };

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (isProduction()) {
      throw new Error("REDIS_URL is required in production");
    }
    return null;
  }
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) return globalForRedis.redis;
  globalForRedis.redis = createRedis();
  return globalForRedis.redis;
}

const memoryHits = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  if (redis) {
    try {
      if (redis.status !== "ready") await redis.connect().catch(() => undefined);
      const redisKey = `rl:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) await redis.expire(redisKey, windowSeconds);
      return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
    } catch {
      // fall through to memory limiter in development
      if (isProduction()) throw new Error("Rate limiter unavailable");
    }
  }

  const now = Date.now();
  const entry = memoryHits.get(key);
  if (!entry || entry.resetAt < now) {
    memoryHits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
