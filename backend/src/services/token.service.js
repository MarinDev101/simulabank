let redisClient = null;
let useRedis = false;

const init = async (redisUrl) => {
  if (!redisUrl) return;
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(redisUrl);
    useRedis = true;
    await redisClient.ping();
  } catch (err) {
    // no Redis disponible, caemos a memoria
    useRedis = false;
  }
};

// In-memory fallback: Map<userId, Map<token, meta>>
const memoryStore = new Map();

const parseExpireToSeconds = (val) => {
  if (!val) return null;
  if (typeof val === 'number') return val;
  const m = /^([0-9]+)\s*([smhd])?$/.exec(val);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2] || 's';
  switch (unit) {
    case 's':
      return n;
    case 'm':
      return n * 60;
    case 'h':
      return n * 60 * 60;
    case 'd':
      return n * 60 * 60 * 24;
    default:
      return n;
  }
};

const saveRefreshToken = async (token, userId, expires, meta = {}) => {
  const ttl = parseExpireToSeconds(expires);
  if (useRedis && redisClient) {
    const payload = JSON.stringify({ userId, createdAt: Date.now(), meta });
    if (ttl) await redisClient.setex(`refresh:${token}`, ttl, payload);
    else await redisClient.set(`refresh:${token}`, payload);
    // add to user's set
    if (userId) await redisClient.sadd(`user_sessions:${userId}`, token);
    return;
  }

  if (!memoryStore.has(userId)) memoryStore.set(userId, new Map());
  memoryStore
    .get(userId)
    .set(token, { createdAt: Date.now(), expiresAt: ttl ? Date.now() + ttl * 1000 : null, meta });
};

const isRefreshTokenValid = async (token) => {
  if (!token) return false;
  if (useRedis && redisClient) {
    const v = await redisClient.get(`refresh:${token}`);
    return !!v;
  }
  // check memory store
  for (const [, map] of memoryStore.entries()) {
    if (map.has(token)) {
      const meta = map.get(token);
      if (meta.expiresAt && Date.now() > meta.expiresAt) {
        map.delete(token);
        return false;
      }
      return true;
    }
  }
  return false;
};

const revokeRefreshToken = async (token) => {
  if (!token) return;
  if (useRedis && redisClient) {
    // remove key and from any user set
    const raw = await redisClient.get(`refresh:${token}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.userId)
          await redisClient.srem(`user_sessions:${parsed.userId}`, token);
      } catch {
        // ignore
      }
    }
    await redisClient.del(`refresh:${token}`);
    return;
  }

  for (const [, map] of memoryStore.entries()) {
    if (map.has(token)) {
      map.delete(token);
      return;
    }
  }
};

const revokeAll = async (userId) => {
  if (!userId) return;
  if (useRedis && redisClient) {
    const tokens = await redisClient.smembers(`user_sessions:${userId}`);
    if (tokens && tokens.length) {
      const pipeline = redisClient.pipeline();
      for (const t of tokens) {
        pipeline.del(`refresh:${t}`);
        pipeline.srem(`user_sessions:${userId}`, t);
      }
      await pipeline.exec();
    }
    return;
  }

  // memory
  memoryStore.delete(userId);
};

const listSessions = async (userId) => {
  if (!userId) return [];
  if (useRedis && redisClient) {
    const tokens = await redisClient.smembers(`user_sessions:${userId}`);
    const sessions = [];
    for (const t of tokens) {
      const raw = await redisClient.get(`refresh:${t}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          sessions.push({ token: t, createdAt: parsed.createdAt, meta: parsed.meta || null });
        } catch {
          sessions.push({ token: t });
        }
      } else {
        // cleanup stale token entries
        await redisClient.srem(`user_sessions:${userId}`, t);
      }
    }
    return sessions;
  }

  const map = memoryStore.get(userId);
  if (!map) return [];
  const out = [];
  for (const [t, meta] of map.entries()) {
    // filter expired
    if (meta.expiresAt && Date.now() > meta.expiresAt) {
      map.delete(t);
      continue;
    }
    out.push({
      token: t,
      createdAt: meta.createdAt,
      expiresAt: meta.expiresAt,
      meta: meta.meta || null,
    });
  }
  return out;
};

module.exports = {
  init,
  saveRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
  listSessions,
  revokeAll,
};
