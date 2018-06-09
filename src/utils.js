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

const randomSuccessResponse = () => {
    let responses = [
        "Here you go!",
        "Here's the link you requested:",
        "Enjoy!",
        "Yay, video!"
    ];
    return responses[Math.floor(Math.random() * responses.length)]
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
