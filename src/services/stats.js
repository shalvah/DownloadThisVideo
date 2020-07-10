'use strict';

const Twit = require('twit');
const t = new Twit({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

module.exports = (cache, cloudwatch) => {
    function getFollowersCount() {
        return t.get(`account/verify_credentials`, {screen_name: process.env.TWITTER_SCREEN_NAME})
            .then(r => r.data)
            .then(user => Number(user.followers_count).toLocaleString());
    }

    function getMentionsCount() {
        // Get from AWS
        return cloudwatch.getNumberOfMentions().then(r => (console.log(r), r));
    }

    function getDownloadsInLast7Days() {
        return cache.scanAsync(0, 'match', 'tweet-*', 'count', 10000000)
            .then(results => results[1].length);
    }

    function getPageViewsCount() {
        // Get from GA
        return 1;
    }


    function getPushNotificationsCount() {
        // Get from Firebase?
        return 1;
    }


    return {
        getMentionsCount,
        getDownloadsInLast7Days,
        getFollowersCount,
        getPageViewsCount,
        getPushNotificationsCount,
    }
};


