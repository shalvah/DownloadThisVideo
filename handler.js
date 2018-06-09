'use strict';

const finish = require('./src/utils').finish;
const sns = require('./src/services/sns');
const cloudwatch = require('./src/services/cloudwatch');
const ops = require('./src/services/tweet_operations');
const makeCache = require('./src/services/factory.cache');
const makeTwitter = require('./src/services/factory.twitter');

module.exports.fetchTweetsToDownload = async (event, context, callback) => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    const mentions = await twitter.getMentions();
    if (!mentions.length) {
        finish(callback, cache).success('No new mentions');
        return;
    }
    await sns.sendToSns(mentions);
    await cache.setAsync('lastTweetRetrieved', mentions[0].id);
    finish(callback, cache).success(`Published ${mentions.length} tweets`);
};

module.exports.sendDownloadLink = async (event, context, callback) => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    const tweets = sns.getPayloadFromSnsEvent(event);
    const tweetsData = await twitter.getTweets(tweets);
    let results = await Promise.all(tweetsData.map((tweet) => {
        return ops.extractVideoLink(tweet, {cache, twitter})
            .then(link => ops.handleTweetProcessingSuccess(tweet, link, {cache, twitter}))
            .catch(e => ops.handleTweetProcessingError(e, tweet, {cache, twitter}));
    }));

    results = results.filter(r => r !== null);
    cloudwatch.logResults(results);
    finish(callback, cache).success(`Processed ${tweets.length} tasks`);
};

module.exports.retryFailedTasks = async (event, context, callback) => {
    const cache = await makeCache();
    const tweets = await cache.lrangeAsync('Fail', 0, -1);

    if (!tweets.length) {
        finish(callback, cache).success(`No tasks for retrying`);
        return;
    }
    await sns.sendToSns(tweets.map(JSON.parse));
    await cache.delAsync('Fail');
    finish(callback, cache).success(`Sent ${tweets.length} tasks for retrying`);
};
