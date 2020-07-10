'use strict';

module.exports = (cache, cloudwatch, twitter) => {
    function getFollowersCount() {
        return twitter.getFollowersCount();
    }

    function getMentionsCount() {
        // Get from AWS
        return cloudwatch.getNumberOfMentions();
    }

    function getDownloadsInLast7Days() {
        return cache.scanAsync(0, 'match', 'tweet-*', 'count', 10000000)
            .then(results => Number(results[1].length).toLocaleString());
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


