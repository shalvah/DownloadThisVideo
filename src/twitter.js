"use strict";

const queue = require('./queue');
const Twit = require('twit');

const t = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const getMentions = async () => {
    let lastTweetId = await queue.marker('lastTweetRetrieved');
    let options = {count: 5};
    if (lastTweetId) {
        options.count = 800
        options.since_id = lastTweetId;
    }
    return t.get('statuses/mentions_timeline', options)
        .then(r => r.data.map(tweet => tweet.id_str));
};


module.exports = {
    getMentions,
};
