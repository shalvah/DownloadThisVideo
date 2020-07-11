'use strict';

const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: __dirname + '/../../thisvid-analytics-serviceaccount.json',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
});
const analytics = google.analyticsreporting({
    version: 'v4',
    auth
});

module.exports = (cache, cloudwatch, twitter) => {
    function getFollowersCount() {
        return twitter.getFollowersCount()
            .then(async r => {
                const l = Number(r).toLocaleString();
                await cache.setAsync('stats-followers', l, 'EX', 1 * 60 * 60);
                return l;
            });
    }

    function getNumberOfMentionsInPast7Days() {
        return cloudwatch.getNumberOfMentionsPast7Days()
            .then(async r => {
                const l = Number(r).toLocaleString();
                await cache.setAsync('stats-mentions7', l, 'EX', 1 * 60 * 60);
                return l;
            });
    }

    function getDownloadsInPast7Days() {
        return cache.scanAsync(0, 'match', 'tweet-*', 'count', 10000000)
            .then(async r => {
                const l = Number(r[1].length).toLocaleString();
                await cache.setAsync('stats-downloads7', l, 'EX', 30 * 60);
                return l;
            });
    }

    function getPageViewsInPast2Days() {
        return analytics.reports.batchGet({
            requestBody: {
                reportRequests:
                    [
                        {
                            viewId: "215671081",
                            dateRanges: [{startDate: "yesterday", endDate: "yesterday"}],
                            metrics: [{expression: "ga:pageviews"}]
                        }
                    ]
            }
        })
            .then(async r => {
                const l = Number(r.data.reports[0].data.totals[0].values[0]).toLocaleString();
                await cache.setAsync('stats-pageviewsY', l, 'EX', 1 * 60 * 60);
                return l;
            })
    }

    return {
        getNumberOfMentionsInPast7Days,
        getDownloadsInPast7Days,
        getFollowersCount,
        getPageViewsInPast2Days,
    };
};


