'use strict';

const not = (fn) => (...args) => !fn(...args);

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

module.exports = {
    not,
    finish
};
