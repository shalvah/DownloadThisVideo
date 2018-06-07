'use strict';

const finish = require('./src/utils').finish;
const AWS = require('aws-sdk');
const makeCache = require('./src/cache');
const makeTwitter = require('./src/twitter');

module.exports.fetchTweetsToDownload = async (event, context, callback) => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    const mentions = await twitter.getMentions();
    if (!mentions.length) {
        finish(callback, cache).success('No new mentions');
        return;
    }

    const sns = new AWS.SNS();
    const params = {
        Message: JSON.stringify(mentions),
        TopicArn: process.env.TOPIC_ARN
    };
    await sns.publish(params).promise();
    await cache.setAsync('lastTweetRetrieved', mentions[0].id);

   // log('run', { published: { length: mentions.length, data: mentions } });
    finish(callback, cache).success(`Published ${mentions.length} tweets`);
    return;
};

module.exports.sendDownloadLink = async (event, context, callback) => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    const tweets = event.Records.reduce((acc, record) => acc.concat(JSON.parse(record.Sns.Message)), []);

    await Promise.all(tweets.map(async (tweet) => {
        if (await twitter.shouldDownloadVid(tweet)) {
            try {
                let link = await twitter.getVideoLink(tweet);
                if (link) {
                    return await Promise.all([
                        cache.setAsync(`tweet-${tweet.referencing_tweet}`, link),
                        twitter.replyWithLink(tweet, link),
                    ]);
                }
            } catch (e) {
                if (e.name === 'CustomPublisherError') {
                    twitter.reply(tweet, e.message);
                    return 1;
                }
                console.log(`Failed processing tweet: ${JSON.stringify(tweet)} - Error: ${e}`);
                return await cache.lpushAsync('Fail', [JSON.stringify(tweet)]);
            }
        } else {
            console.log(`Nothing to download: ${JSON.stringify(tweet)}`);
            return 1;
        }
    }));

    finish(callback, cache).success(`Processed ${tweets.length} tasks`);
};

module.exports.retryFailedTasks = async (event, context, callback) => {
    const cache = await makeCache();
    const tweets = await cache.lrangeAsync('Fail', 0, -1);

    if (!tweets.length) {
        finish(callback, cache).success(`No tasks for retrying`);
        return;
    }
    const sns = new AWS.SNS();
    const params = {
        Message: JSON.stringify(tweets.map(JSON.parse)),
        TopicArn: process.env.TOPIC_ARN
    };
    await sns.publish(params).promise();
    await cache.delAsync('Fail');

    finish(callback, cache).success(`Sent ${tweets.length} tasks for retrying`);
};

