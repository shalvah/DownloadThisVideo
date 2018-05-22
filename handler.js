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

    console.log(process.env.topicARN)
    const sns = new AWS.SNS();
    await Promise.all(mentions.map(tweet => {
        const params = {
            Message: JSON.stringify(tweet),
            TopicArn: process.env.topicARN
        };
        return sns.publish(params).promise();
    })).then(console.log);

    await cache.setAsync('lastTweetRetrieved', mentions[0].id);

    finish(callback, cache).success(`Published ${mentions.length} tweets`);
    return;
};

module.exports.sendDownloadLink = async (event, context, callback) => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    event.Records.forEach(async (record) => {
        let tweet = JSON.parse(record.Sns.Message);
        if (twitter.shouldDownloadVid(tweet)) {
            try {
                let link = await twitter.getVideoLink(tweet);
                if (link) {
                    await Promise.all([
                        cache.setAsync(`tweet-${tweet.referencing_tweet}`, link),
                        twitter.replyWithLink(tweet, link),
                    ]);
                }
            } catch (e) {
                await cache.lpushAsync('Fail', [JSON.stringify(tweet)]);
            }
        }
    });

    finish(callback, cache).success(`Processed ${event.Records.length} tasks`);
};
