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
        return twitter.getFollowersCount().then(r => Number(r).toLocaleString());
    }

    function getNumberOfMentionsInPast7Days() {
        return cloudwatch.getNumberOfMentionsPast7Days()
            .then(r => Number(r).toLocaleString());
    }

    function getDownloadsInPast7Days() {
        return cache.scanAsync(0, 'match', 'tweet-*', 'count', 10000000)
            .then(results => Number(results[1].length).toLocaleString());
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
        }).then(r => Number(r.data.reports[0].data.totals[0].values[0]).toLocaleString());
    }

    return {
        getNumberOfMentionsInPast7Days,
        getDownloadsInPast7Days,
        getFollowersCount,
        getPageViewsInPast2Days,
    }
};


