'use strict';

const queue = require('./src/queue');
const twitter = require('./src/twitter');

module.exports.fetchTweetsToDownload = async (event, context, callback) => {
    let mentions = await twitter.getMentions();

    if (!mentions.length) {
        const response = {
            statusCode: 200,
            body: 'No new mentions'
        };
        callback(null, response);
        queue.close();
        return;
    }

    queue.mark('lastTweetRetrieved', mentions[0]);
    await queue.push(mentions);
    const response = {
        statusCode: 200,
        body: `Queued ${mentions.length} tweets`
    };
    callback(null, response);
    queue.close();
};

