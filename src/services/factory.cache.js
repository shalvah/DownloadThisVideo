'use strict';

const redis = require("redis");
require('bluebird').promisifyAll(redis.RedisClient.prototype);

async function init() {
    let client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOSTNAME, {no_ready_check: true});
    await client.authAsync(process.env.REDIS_PASSWORD);
    return client;
}

module.exports = init;
