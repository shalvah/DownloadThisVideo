"use strict";

const {
    not ,
    and,
    pluck,
    randomSuccessResponse,
} = require('../utils');
const {
    haveIRepliedToTweetAlready,
    isTweetAReplyToMe,
    isTweetAReply
} = require('./tweet_operations');
const { wrapTwitterErrors, errors } = require('twitter-error-handler');
const aargh = require('aargh');
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
        const endpoint = 'statuses/mentions_timeline';
        return t.get(endpoint, options)
            .catch(e => wrapTwitterErrors(endpoint, e))
            .then(r => r.data)
            .then(tweets => tweets.filter(and(isTweetAReply, not(isTweetAReplyToMe))))
            .then(tweets => tweets.map(tweetObject => {
                return {
                    id: tweetObject.id_str,
                    time: tweetObject.created_at,
                    referencing_tweet: tweetObject.in_reply_to_status_id_str,
                    author: tweetObject.user.screen_name
                }
            }))
            .catch(e => {
                return aargh(e)
                    .type(errors.BadRequest)
                    .throw();
            });
    };

    const getActualTweetsReferenced = (tweets) => {
        return t.post(`statuses/lookup`, {
            id: pluck(tweets, 'referencing_tweet'),
            tweet_mode: 'extended',
        })
            .then(r => r.data)
            .catch(e => wrapTwitterErrors('statuses/lookup', e));
    };

    const reply = async (tweet, content) => {
        let options = {
            in_reply_to_status_id: tweet.id,
            status: `@${tweet.author} ${content}`
        };
        return t.post('statuses/update', options)
            .catch(e => wrapTwitterErrors('statuses/update', e))
            .catch(e => {
                return aargh(e)
                    .type(errors.RateLimited, async (e) => {
                        // not sending any more replies for 10 minutes
                        // to avoid Twitter blocking our API access
                        console.log('Rate limit reached, backing off for 10 minutes');
                        await cache.setAsync('no-reply', 1, 'EX', 10 * 60);
                    })
                    .type(errors.BadRequest, console.log)
                    .throw();
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
            .catch(e => wrapTwitterErrors('statuses/show', e));
    };

    const getRequestToken = (callbackUrl) => {
        // Monkey-patching JSON.parse because
        // https://github.com/ttezel/twit/issues/475#issuecomment-547688260
        const originalJsonParse = JSON.parse.bind(JSON);
        JSON.parse = function (value) {
            try {
                return originalJsonParse(value);
            } catch (e) {
                return value;
            }
        }

        const url = "https://api.twitter.com/oauth/request_token";
        const request = require("request");
        const originalRequestPost = request.post;
        request.post = (options) => {
            options.oauth.callback = callbackUrl;
            options.form = {x_auth_access_type: 'read'};
            return originalRequestPost(options);
        }
        return t.post(url).then(r => {
            JSON.parse = originalJsonParse;
            request.post = originalRequestPost;
            try {
                const data = JSON.parse(r.data);
                if (data.errors) {
                    return Promise.reject(data);
                }
            } catch (e) {
                return require('querystring').decode(r.data);
            }
        }).catch(e => {
            JSON.parse = originalJsonParse;
            request.post = originalRequestPost;
            throw e;
        });
    };

    const getAccessToken = (requestToken, requestTokenSecret, verifier) => {
        const t = new Twit({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token: requestToken,
            access_token_secret: requestTokenSecret,
        });
        const originalJsonParse = JSON.parse.bind(JSON);
        JSON.parse = function (value) {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        const request = require("request");
        const originalRequestPost = request.post;
        request.post = (options) => {
            options.form = {oauth_verifier: verifier};
            return originalRequestPost(options);
        }
        return t.post(`https://api.twitter.com/oauth/access_token`)
            .then(r => {
                console.log(r.data);
            JSON.parse = originalJsonParse;
                request.post = originalRequestPost;
            try {
                const data = originalJsonParse(r.data);
                if (data.errors) {
                    return Promise.reject(data);
                }
            } catch (e) {
                return require('querystring').decode(r.data);
            }
        }).catch(e => {
            JSON.parse = originalJsonParse;
                request.post = originalRequestPost;
            throw e;
        });
    };

    const getUser = (accessToken, accessTokenSecret) => {
        const t = new Twit({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token: accessToken,
            access_token_secret: accessTokenSecret,
        });
        return t.get(`account/verify_credentials`, {skip_status: 1})
            .then(r => (console.log(r), r.data));
    };

    return {
        getMentions,
        reply,
        replyWithRedirect,
        shouldDownloadVid,
        getActualTweetsReferenced,
        fetchTweet,
        getRequestToken,
        getAccessToken,
        getUser,
    };

};
