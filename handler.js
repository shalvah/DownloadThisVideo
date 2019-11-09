'use strict';

const cache = require('./src/services/cache');

const {finish, getRelativeTime, getSponsoredLink} = require('./src/utils');
const sns = require('./src/services/sns');
const cloudwatch = require('./src/services/cloudwatch');
const ops = require('./src/services/tweet_operations');
const twitter = require('./src/services/factory.twitter')(cache);
const twitterSignIn = require('twittersignin')({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});
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
                .sendTextFile('firebase-messaging-sw.js', {'content-type': 'text/javascript; charset=UTF-8'});
        default: {
            const getSettings = cache.getAsync(`settings-${username}`);
            const getDownloads = ops.getUserDownloads(cache, username);
            let [settings, downloads] = await Promise.all([getSettings, getDownloads]);
            settings = JSON.parse(settings) || {};
            const prepareDownloadforFrontend = (d) => {
                return JSON.parse(d, function convertTimeToRelative(key, value) {
                    return key === 'time' ? getRelativeTime(value) : value;
                })
            };
            downloads = downloads.map(prepareDownloadforFrontend);

            return finish().render('downloads', {username, downloads, settings, link: getSponsoredLink()});
        }
    }
};

module.exports.page = async (event, context) => {
    let page = event.pathParameters.page;
    switch (page) {
        case 'faqs':
        case 'faq': {
            const faqs = require('./faqs');
            return finish().render('faq', {faqs, link: getSponsoredLink()});
        }
    }
};

module.exports.getHomePage = async (event, context) => {
    return finish().render('home', {link: getSponsoredLink()});
};

module.exports.startTwitterSignIn = async (event, context) => {
    console.log({ event });
    if (event.queryStringParameters.action) {
        if (event.queryStringParameters.action !== "disable") {
            throw new Error('Unknown value of action in query params');
        }
    } else if (!event.queryStringParameters.username || !event.queryStringParameters.fbtoken) {
        throw new Error('Missing fbtoken or username in query params');
    }

    let {username, fbtoken: token, action} = event.queryStringParameters;
    const callbackUrl = process.env.TWITTER_CALLBACK_URL
        + `?username=${username}`
        + (action ? `&action=${action}` : '')
        + (token ? `&fbtoken=${token}` : '');
    const {
        oauth_token: requestToken,
        oauth_token_secret: requestTokenSecret,
        oauth_callback_confirmed
    } = await twitterSignIn.getRequestToken({
        oauth_callback: callbackUrl,
        x_auth_access_type: "read",
    });
    if (!oauth_callback_confirmed) {
        throw new Error('OAuth callback not confirmed!');
    }
    await cache.setAsync(`requestTokenSecret-${username}`, requestTokenSecret, 'EX', 5 * 60);
    const redirect = {
        statusCode: 302,
        headers: {
            Location: 'https://api.twitter.com/oauth/authorize?screen_name=' + username + '&oauth_token=' + requestToken,
        }
    };
    return redirect;
};

module.exports.completeTwitterSignIn = async (event, context) => {
    if (event.queryStringParameters.action) {
        if (event.queryStringParameters.action !== "disable") {
            throw new Error('Unknown value of action in query params');
        }
    } else if (!event.queryStringParameters.username || !event.queryStringParameters.fbtoken) {
        throw new Error('Missing fbtoken or username in query params');
    }

    const fbToken = event.queryStringParameters.fbtoken;
    const userWereTryingToGainAccessFor = event.queryStringParameters.username;
    const action = event.queryStringParameters.action;
    const oauthToken = event.queryStringParameters.oauth_token;
    const oauthVerifier = event.queryStringParameters.oauth_verifier;

    const requestTokenSecret = await cache.getAsync(`requestTokenSecret-${userWereTryingToGainAccessFor}`);
    const {oauth_token, oauth_token_secret, screen_name: actualUser} =
        await twitterSignIn.getAccessToken(oauthToken, requestTokenSecret, oauthVerifier);

    if (actualUser !== userWereTryingToGainAccessFor) {
        return {
            statusCode: 403,
            body: "Unauthorized."
        };
    }

    let data;
    if (action === "disable") {
        data = {
            notifications: false,
        };
    } else {
        data = {
            fbToken,
            notifications: true,
        };
    }
    console.log("Saving settings for " + userWereTryingToGainAccessFor, JSON.stringify(data));
    await cache.setAsync(`settings-${userWereTryingToGainAccessFor}`, JSON.stringify(data));
    const redirect = {
        statusCode: 302,
        headers: {
            Location: `http://${process.env.EXTERNAL_URL}/${userWereTryingToGainAccessFor}` + (action === "disable" ? '' : `?fbt=${fbToken}`)
        }
    };
    return redirect;
};