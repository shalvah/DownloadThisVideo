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

async function nextTask() {
    return await client.rpoplpushAsync(waitQueue, workQueue);
}

async function hasTask(items) {
    let tasks = await client.existsAsync(waitQueue);
    if (!tasks) {
        return false;
    }
    tasks = await client.lrangeAsync(waitQueue, 0, 1);
    return tasks && tasks.length;
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
    hasTask,
    mark,
    marker,
    close
};
