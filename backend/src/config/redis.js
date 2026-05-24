const redis = require('redis');

function createMockRedisClient() {
  return {
    async connect() {
      return true;
    },
    async quit() {
      return true;
    },
    async get() {
      return null;
    },
    async set() {
      return 'OK';
    },
    async del() {
      return 0;
    },
    on() {
      return this;
    },
  };
}

if (!process.env.REDIS_URL) {
  module.exports = createMockRedisClient();
} else {
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.on('connect', () => console.log('✓ Redis Connected'));

  module.exports = redisClient;
}
