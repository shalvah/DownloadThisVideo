'use strict';

const { finish, getRelativeTime, getSponsoredLink } = require('./src/utils');
const sns = require('./src/services/sns');
const cloudwatch = require('./src/services/cloudwatch');
const ops = require('./src/services/tweet_operations');
const makeCache = require('./src/services/factory.cache');
const makeTwitter = require('./src/services/factory.twitter');

(async () => {
    const cache = await makeCache();
    const twitter = makeTwitter(cache);

    module.exports.fetchTweetsToDownload = async (event, context, callback) => {
        // Since we're using a single cache connection,
        // we permit this instance of the function to exit without waiting for the cache
        context.callbackWaitsForEmptyEventLoop = false;

        let lastTweetRetrieved = null;
        let count = 0;
        let mentions = await twitter.getMentions();
        while (mentions.length) {
            await sns.sendToSns(mentions);
            lastTweetRetrieved = mentions[0].id;
            count += mentions.length;
            mentions = await twitter.getMentions(lastTweetRetrieved);
        }

        if (lastTweetRetrieved) {
            await cache.setAsync('lastTweetRetrieved', lastTweetRetrieved);
        }
        finish(callback).success(`Published ${count} tweets`);
    };

    module.exports.sendDownloadLink = async (event, context, callback) => {
        const tweets = sns.getPayloadFromSnsEvent(event);
        const tweetObjects = await twitter.getActualTweetsReferenced(tweets);
        let results = await Promise.all(tweetObjects.map((tweetObject) => {
            let tweet = tweets.find(t => t.referencing_tweet === tweetObject.id_str);
            return ops.extractVideoLink(tweetObject, {cache, twitter})
                .then(link => ops.handleTweetProcessingSuccess(tweet, link, {cache, twitter}))
                .catch(e => ops.handleTweetProcessingError(e, tweet, {cache, twitter, tweetObject}));
        }));

        results = results.filter(r => r !== null);
        cloudwatch.logResults(results);
        finish(callback).success(`Processed ${tweets.length} tasks`);
    };

    module.exports.retryFailedTasks = async (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false;

        const tweets = await cache.lrangeAsync('Fail', 0, -1);

        if (!tweets.length) {
            finish(callback).success(`No tasks for retrying`);
            return;
        }
        await sns.sendToSns(tweets.map(JSON.parse));
        await cache.delAsync('Fail');
        finish(callback).success(`Sent ${tweets.length} tasks for retrying`);
    };

    module.exports.getDownloads = async (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false;

        const username = event.pathParameters.username;
        switch (username) {
            case null:
            case undefined:
            case '':
                finish(callback).render('home', {link: getSponsoredLink()});
                return;
            case 'faq':
                const faqs = require('./faqs');
                finish(callback).render('faq', {faqs, link: getSponsoredLink()});
                return;
            default:
                let downloads = await ops.getUserDownloads(cache, username);
                const prepareDownloadforFrontend = (d) => {
                    return JSON.parse(d, function convertTimeToRelative(key, value) {
                        return key === 'time' ? getRelativeTime(value) : value;
                    })
                };
                downloads = downloads.map(prepareDownloadforFrontend);

                finish(callback).render('downloads', {username, downloads, link: getSponsoredLink()});
        }
    };

    module.exports.getHomePage = (event, context, callback) => {
        context.callbackWaitsForEmptyEventLoop = false;

        finish(callback).render('home', {link: getSponsoredLink()});
    };

})();