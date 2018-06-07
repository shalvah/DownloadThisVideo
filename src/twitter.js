"use strict";

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

module.exports = (cache) => {
    const getMentions = async () => {
        let lastTweetId = await cache.getAsync('lastTweetRetrieved');
        let options = {count: 100};
        if (lastTweetId) {
            options.since_id = lastTweetId;
        }
        return t.get('statuses/mentions_timeline', options)
            .then(r => {
                if (r.data.errors) {
                    throw `Error in statuses/mentions_timeline response: ${JSON.stringify(r.data.errors)}`;
                }
                return r.data;
            })
            .then(tweets => tweets.filter(and(isTweetAReply, not(isTweetAReplyToMe))))
            .then(tweets => tweets.map(tweet => {
                return {
                    id: tweet.id_str,
                    referencing_tweet: tweet.in_reply_to_status_id_str,
                    author: tweet.user.screen_name
                }
            }));
    };

    const getVideoLink = async ({referencing_tweet}) => {
        let cachedLink = await cache.getAsync(`tweet-${referencing_tweet}`);
        if (cachedLink) {
            return cachedLink;
        }

        return t.get(`statuses/show`, {
            id: referencing_tweet,
            tweet_mode: 'extended',
            // cards_platform: 'Web-12',
            // include_cards: 1,
        }).then(r => {
            if (r.data.errors) {
                throw `Error in tweet response: ${JSON.stringify(r.data)}`;
            }
            return r.data;
        })
            .then(tweet => {
                try {
                    return tweet.extended_entities.media[0].video_info.variants[0].url;
                } catch (e) {
                    throw `Malformed tweet: ${JSON.stringify(tweet)}`;
                }
            })
    };

    const replyWithLink = (tweet, link) => {
        let options = {
            in_reply_to_status_id: tweet.id,
            status: `@${tweet.author} ${message()} ${link}`
        };
        return t.post('statuses/update', options)
            .then(r => {
                if (r.data.errors) {
                    throw `Error in statuses/update response: ${JSON.stringify(r.data.errors)}`;
                }
            });
    };

    const isTweetAReply = (tweet) => !!tweet.in_reply_to_status_id_str;

    const isTweetAReplyToMe = (tweet) => tweet.in_reply_to_screen_name === process.env.TWITTER_SCREEN_NAME;

    const getMyTweets = async () => {
        let myTweets = await cache.lrangeAsync('myTweets', 0, -1);
        if (myTweets.length) {
            return myTweets;
        }

        return t.get(`statuses/user_timeline`, {
            screen_name: process.env.TWITTER_SCREEN_NAME,
            include_rts: false,
            count: 200,
        }).then(r => {
            myTweets = r.data.map(t => t.in_reply_to_status_id_str);
            return cache.lpushAsync('myTweets', myTweets)
        }).then(() => myTweets);
    };

    const haveIRepliedToTweetAlready = (tweetId, myTweets) => {
        return !!myTweets.find(t => t === tweetId);
    };

    const shouldDownloadVid = async ({id}) => {
        return not(haveIRepliedToTweetAlready)(id, await getMyTweets());
    };

    return {
        getMentions,
        getVideoLink,
        replyWithLink,
        shouldDownloadVid,
    };

}
