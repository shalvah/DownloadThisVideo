'use strict';

module.exports = (cache, cloudwatch, twitter) => {
    function getFollowersCount() {
        return twitter.getFollowersCount().then(r => Number(r).toLocaleString());
    }

    function getNumberOfMentionsPast7Days() {
        return cloudwatch.getNumberOfMentionsPast7Days()
            .then(r => Number(r).toLocaleString());
    }

    function getDownloadsInLast7Days() {
        return cache.scanAsync(0, 'match', 'tweet-*', 'count', 10000000)
            .then(results => Number(results[1].length).toLocaleString());
    }

    function getPageViewsCount() {
        const {google} = require('googleapis');
        const auth = new google.auth.GoogleAuth({
            keyFile: __dirname + '/../../thisvid-analytics-serviceaccount.json',
            scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
        });
        const analytics = google.analyticsreporting({
            version: 'v4',
            auth
        });
        return analytics.reports.batchGet({
            requestBody: {
                reportRequests:
                    [
                        {
                            viewId: "215671081",
                            dateRanges: [{startDate: "2daysAgo", endDate: "today"}],
                            metrics: [{expression: "ga:pageviews"}]
                        }
                    ]
            }
        }).then(r => {
            return r.data.reports[0].data.totals[0].values[0];
        });
    }

    return {
        getNumberOfMentionsPast7Days,
        getDownloadsInLast7Days,
        getFollowersCount,
        getPageViewsCount,
    }
};


