'use strict';

module.exports = {
    logResults,
};

const { SUCCESS, FAIL, UNCERTAIN } = require('./../utils');
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

function logResults(results) {
    const all = results.length;
    if (!all) return;

    const successes = results.filter(r => r === SUCCESS).length;
    const uncertain = results.filter(r => r === UNCERTAIN).length;

    const params = [];
    if (successes) {
        params.push(generateMetricsPayload(SUCCESS, successes));
    }
    if (uncertain) {
        params.push(generateMetricsPayload(UNCERTAIN, uncertain));
    }
    params.push(generateMetricsPayload('All', all));
    return Promise.all(params.map(p => cloudwatch.putMetricData(p).promise()));
}

function generateMetricsPayload(dimension, value) {
    return {
        MetricData: [
            {
                MetricName: 'Requests',
                Dimensions: [
                    {
                        Name: 'Result',
                        Value: dimension
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
