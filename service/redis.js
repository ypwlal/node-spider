const redis = require('../utils/redis');
const promisify = require('../utils/promisify');

const p_set = promisify(redis.set).bind(redis);
const p_get = promisify(redis.get).bind(redis);
const p_has = promisify(redis.has).bind(redis);
const p_del = promisify(redis.del).bind(redis);
const p_hget = promisify(redis.hget).bind(redis);
const p_hset = promisify(redis.hset).bind(redis);
const p_hdel = promisify(redis.hdel).bind(redis);
const p_sadd = promisify(redis.sadd).bind(redis);
const p_spop = promisify(redis.spop).bind(redis);

module.exports = {
    async set(key, value, duration) {
        const _value = typeof value === 'object' ? JSON.stringify(value) : value;
        if (duration) {
            return p_set(key, _value, 'EX', duration);
        }
        return p_set(key, _value);
    },

    async get(key) {
        const value = await p_get(key);
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    async del(key) {
        return p_del(key);
    },

    async hset(key, field, value) {
        const _value = typeof value === 'object' ? JSON.stringify(value) : value;
        return p_hset(key, field, _value);
    },

    async hget(key, field) {
        const value = await p_hget(key, field);
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },

    async hdel(key, field) {
        return p_hdel(key, field);
    },

    async sadd(key, value) {
        const _value = typeof value === 'object' ? JSON.stringify(value) : value;
        return p_sadd(key, _value);
    },

    async spop(key) {
        return p_spop(key);
    },

    quit() {
        return redis.quit();
    }
};
