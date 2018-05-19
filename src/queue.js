'use strict';

const waitQueue = 'Wait';
const workQueue = 'Work';

const redis = require("redis");
require('bluebird').promisifyAll(redis.RedisClient.prototype);

let client;

(async function init() {
    client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOSTNAME, {no_ready_check: true});
    await client.authAsync(process.env.REDIS_PASSWORD);
})();

async function push(items) {
    return await client.lpushAsync(waitQueue, items);
}

async function nextTask(items) {
    return await client.rpoplpushAsync(waitQueue, workQueue, items);
}

async function mark(key, value) {
    return await client.setAsync(key, value);
}

async function marker(key) {
    return await client.getAsync(key);
}

function close() {
    return client.quit();
}

module.exports = {
    push,
    nextTask,
    mark,
    marker,
    close
};
