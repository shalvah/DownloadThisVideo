'use strict';

const queue = require('./src/queue');
const cache = require('./src/cache');
const twitter = require('./src/twitter');
let finish = require('./src/utils').finish;

module.exports.fetchTweetsToDownload = async (event, context, callback) => {
    let mentions = await twitter.getMentions();

    if (!mentions.length) {
        finish(callback).success('No new mentions');
        return;
    }

    await Promise.all([
        cache.setAsync('lastTweetRetrieved', mentions[0].id),
        queue.push(mentions)
    ]);
    finish(callback).success(`Queued ${mentions.length} tweets`);
};

module.exports.sendDownloadLinks = async (event, context, callback) => {
    let taskCount = 0;
    while (await queue.hasTask()) {
        let tweet = await queue.nextTask();
        let link = await twitter.getVideoLink(tweet);
        if (!link) {
            twitter.replyWithError(tweet, 'No video or GIF in this tweet');
        } else {
            await Promise.all([
                cache.setAsync(`tweet-${tweet.referencing_tweet}`, link),
                twitter.replyWithLink(tweet, link),
            ]);
        }
        queue.taskDone()
        taskCount++;
    }

    finish(callback).success(`Processed ${taskCount} tasks`);
};
