'use strict';

const cache = require('./src/services/cache');

const {finish, getRelativeTime, getSponsoredLink} = require('./src/utils');
const sns = require('./src/services/sns');
const cloudwatch = require('./src/services/cloudwatch');
const ops = require('./src/services/tweet_operations');
const twitter = require('./src/services/factory.twitter')(cache);
const chunk = require("lodash.chunk");

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
    // The lookup endpoint only allows fetching 100 tweets at a time
    const chunks = chunk(tweets, 100);
    await Promise.all(chunks.map(async chunk => {
        const tweetObjects = await twitter.getActualTweetsReferenced(chunk);
        let results = await Promise.all(tweetObjects.map((tweetObject) => {
            let tweet = chunk.find(t => t.referencing_tweet === tweetObject.id_str);
            return ops.extractVideoLink(tweetObject, {cache, twitter})
                .then(link => ops.handleTweetProcessingSuccess(tweet, link, {cache, twitter}))
                .catch(e => ops.handleTweetProcessingError(e, tweet, {cache, twitter, tweetObject}));
        }));

        results = results.filter(r => r !== null);
        return cloudwatch.logResults(results);
    }));
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

module.exports.getDownloadsOrStaticFiles = async (event, context) => {
    let username = event.pathParameters.username;
    username = typeof username == "string" ? username.replace(/\/$/, '') : username;
    switch (username) {
        case 'firebase-messaging-sw.js':
            return finish()
                .sendFile('firebase-messaging-sw.js', {'content-type': 'text/javascript; charset=UTF-8'});
        case 'sponsored-logo.png':
            return finish()
                .sendFile('sponsored-logo.png', {'content-type': 'image/png'});
        case 'faq':
            const faqs = require('./faqs');
            return finish().render('faq', {faqs, link: getSponsoredLink()});
        case null:
        case undefined:
        case '':
            return finish().render('home', {link: getSponsoredLink()});
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
    return finish().render('home', {link: getSponsoredLink()});
};

module.exports.storeFirebaseToken = async (event, context, callback) => {
    const body = JSON.parse(event.body);
    console.log(body);
    const {username, token} = body;

    let existing = JSON.parse(await cache.getAsync(`fbtoken-${username}`));
    if (existing && existing.authed) {
        existing.token = token;
        console.log("Updating fbtoken for " + username);
        let result = await cache.setAsync(`fbtoken-${username}`, JSON.stringify(existing));
        return result
            ? finish().successHttp({status: "success"})
            : finish().failHttp({status: "fail"});
    }

    const tweetIds = ["1075701130812948480", "1095308222276218884", "1075513980666474496", "1064326221901824000"];
    const data = {
        token,
        authed: false,
    };
    console.log("Saving fbtoken for " + username);
    let result = await cache.setAsync(`fbtoken-${username}`, JSON.stringify(data), 'EX', 30 * 60);
    return result
        ? finish().successHttp({status: "success"})
        : finish().failHttp({status: "fail"});
};
