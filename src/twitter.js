"use strict";

const cache = require('./cache');
const not = require('./utils').not;
const and = require('./utils').and;
const message = require('./utils').randomSuccessResponse;
const Twit = require('twit');

const t = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const getMentions = async () => {
    let lastTweetId = await cache.getAsync('lastTweetRetrieved');
    let options = {count: 5};
    if (lastTweetId) {
        options.count = 800;
        options.since_id = lastTweetId;
    }
    return t.get('statuses/mentions_timeline', options)
        .then(r => r.data)
        .then(tweets => tweets.filter(and(isTweetAReply, not(isTweetAReplyToMe))))
        .then(tweets => tweets.map(tweet => {
            return {
                id: tweet.id_str,
                referencing_tweet: tweet.in_reply_to_status_id_str,
                author: tweet.user.screen_name
            }
        }));
};

const getVideoLink = async ({ referencing_tweet }) => {
    let cachedLink = await cache.getAsync(`tweet-${referencing_tweet}`);
    if (cachedLink) {
        return cachedLink;
    }

    return t.get(`statuses/show`, { id: referencing_tweet })
        .then(r => r.data)
        .then(tweet => {
            let videoLink;
            try {
                videoLink = tweet.extended_entities.media[0].video_info.variants[0].url;
            } catch (e) {
                return null;
            }
            return videoLink;
        })
};

const replyWithLink = async (tweet, link) => {
    let options = {
        in_reply_to_status_id: tweet.id,
        status: `@${tweet.author} ${message()} ${link}`
    };
    return t.post('statuses/update', options);
};

const isTweetAReply = (tweet) => !!tweet.in_reply_to_status_id_str;

const isTweetAReplyToMe = (tweet) => tweet.in_reply_to_screen_name === process.env.TWITTER_SCREEN_NAME;

// I'd like to add another layer of redundancy to prevent processing tweets
// we've already replied to
// but cant think of a way to do that now
// without making multiple API calls
const shouldDownloadVid = (tweet) => true;

module.exports = {
    getMentions,
    getVideoLink,
    replyWithLink,
    shouldDownloadVid
};
