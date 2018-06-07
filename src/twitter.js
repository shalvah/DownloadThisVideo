"use strict";

const not = require('./utils').not;
const and = require('./utils').and;
const message = require('./utils').randomSuccessResponse;
const CustomPublisherError = require('./utils').CustomPublisherError;
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

        let response = await t.get(`statuses/show`, {
            id: referencing_tweet,
            tweet_mode: 'extended',
            cards_platform: 'Web-12',
            include_cards: 1,
        });
        if (response.data.errors) {
            throw `Error in tweet response: ${JSON.stringify(response.data.errors)}`;
        }

        let tweet = response.data;

        // this function will recursively check for a link
        function lookForRecognizableLink(additonalMediaInfo) {
            const keys = Object.keys(additonalMediaInfo);
            for (let i = 0; i < keys.length; i++) {
                let k = keys[i];
                if (typeof additonalMediaInfo[k] === 'string'
                    && additonalMediaInfo[k].startsWith('http')) {
                    return additonalMediaInfo[k];
                } else if (typeof additonalMediaInfo[k] === 'object') {
                    let nestedLink = lookForRecognizableLink(additonalMediaInfo[k])
                    if (nestedLink) {
                        return nestedLink;
                    }
                }
            }
            return null;
        }

        try {
            console.log(JSON.stringify(tweet))
            // the direct path
            return tweet.extended_entities.media[0].video_info
                .variants.find(variant => variant.content_type === 'video/mp4')
                .url;
        } catch (e) {
            if (tweet.extended_entities
                && tweet.extended_entities.media.length
                && tweet.extended_entities.media[0].additional_media_info
                && !tweet.extended_entities.media[0].additional_media_info.embeddable) {
                // a custom publisher? not much we can do about it
                // see https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/extended-entities-object.html
                // We'll still try our best, though
                let additonalMediaInfo = tweet.extended_entities.media[0].additional_media_info;
                let link = lookForRecognizableLink(additonalMediaInfo);
                if (!link) {
                    throw new CustomPublisherError("Looks like this video's from a custom publisher who's restricted it, so I can't access it :(");
                }
                throw new CustomPublisherError("Looks like this video's from a custom publisher who's restricted it. Here's the best I could come up with: " + link);

            } else if (tweet.entities && tweet.entities.media && tweet.entities.media.length) {
                // sometimes, the tweet is a share of another tweet containing media
                // example: https://twitter.com/GalacticoHD/status/889023844991807489
                let expandedUrl = tweet.entities.media[0].expanded_url.split('/');
                let tweetId = expandedUrl[expandedUrl.length - 3];
                if (tweetId !== referencing_tweet) {
                    return await getVideoLink({referencing_tweet: tweetId});
                }
            }
            throw `Malformed tweet: ${JSON.stringify(tweet)}`;
        }
    };

    const reply = (tweet, content) => {
        let options = {
            in_reply_to_status_id: tweet.id,
            status: `@${tweet.author} ${content}`
        };
        return t.post('statuses/update', options)
            .then(r => {
                if (r.data.errors) {
                    throw `Error in statuses/update response: ${JSON.stringify(r.data.errors)}`;
                }
            });
    };

    const replyWithLink = (tweet, link) => {
        let content = `${message()} ${link}`;
        return reply(tweet, content);
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
        reply,
        replyWithLink,
        shouldDownloadVid,
    };

}
