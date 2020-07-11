'use strict';

module.exports = {
    logResults,
    getNumberOfMentionsPast7Days,
};

const { SUCCESS, UNCERTAIN } = require('./../utils');
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

function logResults(results) {
    const all = results.length;
    if (!all) return;

    const successes = results.filter(r => r === SUCCESS).length;
    const uncertain = results.filter(r => r === UNCERTAIN).length;

    const params = [];
    const getPayload = generateMetricsPayload('Requests');
    if (successes) {
        params.push(getPayload('Result', SUCCESS, successes));
    }
    if (uncertain) {
        params.push(getPayload('Result', UNCERTAIN, uncertain));
    }
    params.push(getPayload('Result', 'All', all));
    return Promise.all(params.map(p => cloudwatch.putMetricData(p).promise()));
}

function generateMetricsPayload (metricName) {
    return function (dimension, dimensionValue, value) {
        return {
            MetricData: [
                {
                    MetricName: metricName,
                    Dimensions: [
                        {
                            Name: dimension,
                            Value: dimensionValue
                        },
                    ],
                    Timestamp: new Date,
                    Unit: 'Count',
                    Value: value
                },
            ],
            Namespace: 'DownloadThisVideo'
        };
    }
}

function getNumberOfMentionsPast7Days() {
    const now = new Date();
    const params = {
        StartTime: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)), // 7 days ago
        EndTime: now,
        MetricName: 'Requests',
        Namespace: 'DownloadThisVideo',
        Period: 7 * 24 * 60 * 60,
        Statistics: ['Sum'],
        Unit: 'Count',
        Dimensions: [
            {
                Name: 'Result',
                Value: 'All',
            },
        ],
    };
    return cloudwatch.getMetricStatistics(params).promise()
        .then(r => r.Datapoints[0].Sum);
}