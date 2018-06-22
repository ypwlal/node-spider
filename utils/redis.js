const redis = require('redis');
const { REDIS } = require('../config');

module.exports = redis.createClient({
    host: REDIS.HOST,
    port: REDIS.PORT,
    password: REDIS.PASSWORD,
    retry_strategy(options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time ehausted.');
        }
        if (options.attempt > 10) {
            return new Error('Retry count exhausted');
        }
        return Math.min(options.attempt * 100, 5000);
    }
});
