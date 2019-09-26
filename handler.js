'use strict';

const cache = require('./src/services/cache');

const { finish, getRelativeTime, getSponsoredLink } = require('./src/utils');
const sns = require('./src/services/sns');
const cloudwatch = require('./src/services/cloudwatch');
const ops = require('./src/services/tweet_operations');
const twitter = require('./src/services/factory.twitter')(cache);

module.exports.fetchTweetsToDownload = async (event, context) => {
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
    return finish().success(`Published ${count} tweets`);
};

module.exports.sendDownloadLink = async (event, context) => {
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
    return finish().success(`Processed ${tweets.length} tasks`);
};

module.exports.retryFailedTasks = async (event, context) => {
    const tweets = await cache.lrangeAsync('Fail', 0, -1);

    if (!tweets.length) {
        return finish().success(`No tasks for retrying`);
    }
    await sns.sendToSns(tweets.map(JSON.parse));
    await cache.delAsync('Fail');
    return finish().success(`Sent ${tweets.length} tasks for retrying`);
};

module.exports.getDownloads = async (event, context) => {
    const username = event.pathParameters.username;
    switch (username) {
        case null:
        case undefined:
        case 'firebase-messaging-sw.js':
            return finish().sendFile('firebase-messaging-sw.js', {'content-type': 'text/javascript; charset=UTF-8'});
        case '':
            return finish().render('home', { link: getSponsoredLink() });
        case 'faq':
            const faqs = require('./faqs');
            return finish().render('faq', { faqs, link: getSponsoredLink() });
        default:
            let downloads = await ops.getUserDownloads(cache, username);
            const prepareDownloadforFrontend = (d) => {
                return JSON.parse(d, function convertTimeToRelative(key, value) {
                    return key === 'time' ? getRelativeTime(value) : value;
                })
            };
            downloads = downloads.map(prepareDownloadforFrontend);

            return finish().render('downloads', {username, downloads, link: getSponsoredLink()});
    }
};

module.exports.getHomePage = async (event, context) => {
    return finish().render('home',  { link: getSponsoredLink() });
};

module.exports.storeFirebaseToken = async (event, context, callback) => {
    const body = JSON.parse(event.body);
    console.log(body);
    const { username, token } = body;
    await cache.setAsync(`fbtoken-${username}`, token);

    return {
        statusCode: 200,
        body: JSON.stringify({status: "success"}),
        headers: {
            'Access-Control-Allow-Origin': 'thisvid.space',
        },
    };
};
