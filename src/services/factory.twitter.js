"use strict";

const {
    not ,
    and,
    pluck,
    randomSuccessResponse,
} = require('../utils');
const { TwitterErrorResponse } = require('../errors');
const {
    haveIRepliedToTweetAlready,
    isTweetAReplyToMe,
    isTweetAReply
} = require('./tweet_operations');
const Twit = require('twit');

const t = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

module.exports = (cache) => {

    const getMentions = async (lastTweetRetrieved) => {
        let lastTweetId = lastTweetRetrieved || await cache.getAsync('lastTweetRetrieved');
        let options = {count: 200};
        if (lastTweetId) {
            options.since_id = lastTweetId;
        }
        return t.get('statuses/mentions_timeline', options)
            .then(r => r.data)
            .catch(e => {
                throw new TwitterErrorResponse('statuses/mentions_timeline', e);
            })
            .then(tweets => tweets.filter(and(isTweetAReply, not(isTweetAReplyToMe))))
            .then(tweets => tweets.map(tweetObject => {
                return {
                    id: tweetObject.id_str,
                    time: tweetObject.created_at,
                    referencing_tweet: tweetObject.in_reply_to_status_id_str,
                    author: tweetObject.user.screen_name
                }
            }));
    };

    const getActualTweetsReferenced = (tweets) => {
        return t.post(`statuses/lookup`, {
            id: pluck(tweets, 'referencing_tweet'),
            tweet_mode: 'extended',
        }).then(r => r.data)
            .catch(e => {
                throw new TwitterErrorResponse('statuses/lookup', e);
            });
    };

    const reply = async (tweet, content) => {
        let options = {
            in_reply_to_status_id: tweet.id,
            status: `@${tweet.author} ${content}`
        };
        return t.post('statuses/update', options)
            .catch(e => {
                if ((e.valueOf() + '').includes('User is over daily status update limit')) {
                    // not sending any more replies for 10 minutes
                    // to avoid Twitter blocking our API access
                    console.log('Rate limit reached, backing off for 10 minutes');
                    return cache.setAsync('no-reply', 1, 'EX', 10 * 60);
                }

                throw new TwitterErrorResponse('statuses/update', e);
            })
    };

    const replyWithRedirect = async (tweet) => {
        let noReply = await cache.getAsync('no-reply');
        if (noReply == 1) {
            return true;
        }

        let content = randomSuccessResponse(tweet.author);
        return reply(tweet, content);
    };

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

    const shouldDownloadVid = async ({ id }) => {
        return not(haveIRepliedToTweetAlready)(id, await getMyTweets());
    };

    const fetchTweet = (tweetId) => {
        return t.get(`statuses/show`, {
            id: tweetId,
            tweet_mode: 'extended',
        }).then(r => r.data)
            .catch(e => {
                throw new TwitterErrorResponse('statuses/show', e);
            });
    };

    return {
        getMentions,
        reply,
        replyWithRedirect,
        shouldDownloadVid,
        getActualTweetsReferenced,
        fetchTweet
    };

};
