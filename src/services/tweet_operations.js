'use strict';

const { get, findItemWithGreatest, SUCCESS, FAIL, UNCERTAIN } = require('../utils');
const { ExternalPublisherError, NoVideoInTweet } = require('../errors');

const isTweetAReply = (tweet) => !!tweet.in_reply_to_status_id_str;

const isTweetAReplyToMe = (tweet) => tweet.in_reply_to_screen_name === process.env.TWITTER_SCREEN_NAME;

const haveIRepliedToTweetAlready = (tweetId, myTweets) => {
    return !!myTweets.find(t => t === tweetId);
};

const extractVideoLink = async (tweetObject, { cache, twitter }) => {
    let cachedLink = await cache.getAsync(`tweet-${tweetObject.id_str}`);
    if (cachedLink) {
        return cachedLink;
    }

    // recursively check for a  link
    function lookForLink(object) {
        const keys = Object.keys(object);
        for (let k of keys) {
            if (typeof object[k] === 'string'
                && object[k].startsWith('http')) {
                return object[k];
            } else if (typeof object[k] === 'object') {
                let nestedLink = lookForLink(object[k]);
                if (nestedLink) {
                    return nestedLink;
                }
            }
        }
        return null;
    }

    try {
        // the direct path
        const variants =  tweetObject.extended_entities.media[0].video_info
            .variants.filter(variant => variant.content_type === 'video/mp4');
        return findItemWithGreatest('bitrate', variants).url;
    } catch (e) {
        let additionalMediaInfo = get(tweetObject, 'extended_entities.media.0.additional_media_info');
        if (additionalMediaInfo && !additionalMediaInfo.embeddable) {
            // a custom publisher? not much we can do about it
            // see https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/extended-entities-object.html
            // We'll still try our best, though
            let link = lookForLink(additionalMediaInfo);
            if (!link) {
                throw new ExternalPublisherError("Looks like this video's from an external publisher who's restricted it, so I can't access it :(", FAIL);
            }
            throw new ExternalPublisherError("Looks like this video's from an external publisher who's restricted it. Here's the best I could come up with: " + link, UNCERTAIN);

        } else if (get(tweetObject, 'entities.media')) {
            // sometimes, the tweet is a share of another tweet containing media
            // example: https://twitter.com/GalacticoHD/status/889023844991807489
            let expandedUrl = tweetObject.entities.media[0].expanded_url.split('/');
            let tweetId = expandedUrl[expandedUrl.length - 3];
            if (tweetId !== tweetObject.id_str) {
                return await twitter.fetchTweet(tweetId)
                    .then(t => extractVideoLink(t, { cache, twitter }));
            }
        }
        throw new NoVideoInTweet(tweetObject);
    }
};

const handleTweetProcessingError = (e, tweet, { cache, twitter, tweetObject }) => {
    if (e.name === 'ExternalPublisherError') {
        return twitter.reply(tweet, e.message).then(() => e.status);
    }
    console.log(`Failed processing tweet: ${JSON.stringify(tweetObject)} - Error: ${e.valueOf()}`);
    return cache.lpushAsync('Fail', [JSON.stringify(tweet)])
        .then(() => e.name === 'NoVideoInTweet' ? null : FAIL);
};

const updateUserDownloads = (tweet, link, cache) => {
    const key = `user-${tweet.author}`;
    const entry = {
        videoUrl: link,
        tweet: tweet.referencing_tweet,
        time: tweet.time,
    };
    return cache.lpushAsync(key, [JSON.stringify(entry)])
        .then(() => cache.expireAsync(key, 24 * 60 * 60));
};

const handleTweetProcessingSuccess = (tweet, link, { cache, twitter }) => {
    return Promise.all([
        cache.setAsync(`tweet-${tweet.referencing_tweet}`, link, 'EX', 7 * 24 * 60 * 60),
        updateUserDownloads(tweet, link, cache),
        twitter.replyWithRedirect(tweet),
    ]).then(() => SUCCESS);
};

module.exports = {
    isTweetAReply,
    isTweetAReplyToMe,
    haveIRepliedToTweetAlready,
    extractVideoLink,
    handleTweetProcessingError,
    handleTweetProcessingSuccess
};
