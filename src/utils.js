'use strict';

const not = (fn) => (...args) => !fn(...args);
const and = (...fns) => (...args) => fns.reduce((y, fn) => fn(...args) && y, true);

const finish = (cb) => {
    return {
        success(body) {
            const response = {
                statusCode: 200,
                body
            };
            cb(null, response);
            require('./cache').quit();
        }
    }
};

const randomSuccessResponse = () => {
    let responses = [
        "Here you go!",
        "Here's the link you requested:",
        "Enjoy!",
    ];
    return responses[Math.floor(Math.random() * responses.length)]
};

module.exports = {
    not,
    and,
    finish,
    randomSuccessResponse
};
