'use strict';

const not = (fn) => (...args) => !fn(...args);

const and = (...fns) => (...args) => fns.reduce((y, fn) => fn(...args) && y, true);

const pluck = (values, key) => values.map(v => v[key]);

const get = (object, path) => {
    let lookup = Object.assign({}, object);
    let keys = path.split('.');
    for (let key of keys) {
        if (lookup[key]) {
            lookup = lookup[key];
        } else {
            return null;
        }
    }
    return lookup;
};

const finish = (cb, cache) => {
    cache.quit();
    return {
        success(body) {
            console.log(`Response: ${body}`);
            const response = {
                statusCode: 200,
                body
            };
            cb(null, response);
        },

        fail(body) {
            console.log(`Fail response: ${body}`);
            cb(body);
        }
    }
};

const randomSuccessResponse = (username) => {
    let responses = [
        "Yay, video! Check for your download link at {link}.\nNote: I won't show ths message in the future, so just check that link whenever you make a new download request.🤗🤗",
        "Your video is ready! Your download link is at {link}.\nNote: I won't show ths message in the future, so check that link whenever you make a new download request.🤗",
    ];
    let response = responses[Math.floor(Math.random() * responses.length)];
    return response.replace('{link}', `http://${process.env.EXTERNAL_URL}/${username}`);
};

class ExternalPublisherError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExternalPublisherError';
    }
}

class TwitterErrorResponse extends Error {
    constructor(endpoint, errors) {
        super('Error from Twitter API call');
        this.name = 'TwitterErrorResponse';
        this.errors = errors;
        this.endpoint = endpoint;
    }
}

const SUCCESS = 'Success';

const FAIL = 'Fail';

const UNCERTAIN = 'Uncertain';

module.exports = {
    not,
    and,
    pluck,
    get,
    finish,
    randomSuccessResponse,
    ExternalPublisherError,
    TwitterErrorResponse,
    SUCCESS,
    FAIL,
    UNCERTAIN
};
