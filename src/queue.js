'use strict';

const waitQueue = 'Wait';
const workQueue = 'Work';

const client = require('./cache');

async function push(items) {
    return await client.lpushAsync(waitQueue, items.map(JSON.stringify));
}

async function nextTask() {
    return await client.rpoplpushAsync(waitQueue, workQueue).then(JSON.parse);
}

async function hasTask() {
    let tasks = await client.existsAsync(waitQueue);
    if (!tasks) {
        return false;
    }
    tasks = await client.lrangeAsync(waitQueue, 0, 1);
    return tasks && tasks.length;
}

async function taskDone() {
    return await client.rpopAsync(workQueue);
}

module.exports = {
    push,
    nextTask,
    hasTask,
    taskDone
};
