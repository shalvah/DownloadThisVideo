'use strict';

module.exports = {
    logResults,
    trackApiCalls
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

function trackApiCalls(endpoint) {
    const getPayload = generateMetricsPayload('TwitterApiCalls');
    const params = [
        getPayload('Endpoint', endpoint, 1)
    ];
    return Promise.all(params.map(p => cloudwatch.putMetricData(p).promise()));
}

