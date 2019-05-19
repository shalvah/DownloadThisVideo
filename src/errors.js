'use strict';

class ExternalPublisherError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ExternalPublisherError';
        this.status = status;
    }
}

class NoVideoInTweet extends Error {
    constructor(tweetObject) {
        super("Couldn't find any video in this tweet");
        this.name = 'NoVideoInTweet';
        this.tweetObject = tweetObject;
    }
}

module.exports = {
    ExternalPublisherError,
    NoVideoInTweet
};
