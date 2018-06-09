'use strict';

module.exports = {
    sendToSns,
    getPayloadFromSnsEvent
};

const AWS = require('aws-sdk');
const sns = new AWS.SNS();

function sendToSns (data) {
    const params = {
        Message: JSON.stringify(data),
        TopicArn: process.env.TOPIC_ARN
    };
    return sns.publish(params).promise();
}

function getPayloadFromSnsEvent(event) {
    return event.Records.reduce((acc, record) => acc.concat(JSON.parse(record.Sns.Message)), []);
}
