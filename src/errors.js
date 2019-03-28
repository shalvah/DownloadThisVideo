'use strict';

class ExternalPublisherError extends Error {
    constructor(message, status) {
        super(message);
        this.name = 'ExternalPublisherError';
        this.status = status;
    }
}

class TwitterErrorResponse extends Error {
    constructor(endpoint, errors) {
        super('Error from Twitter API call: ' + JSON.strinigify(errors));
        this.name = 'TwitterErrorResponse';
        this.errors = errors;
        this.endpoint = endpoint;
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
    TwitterErrorResponse,
    NoVideoInTweet
};
