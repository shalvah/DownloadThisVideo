'use strict';

const hbs = require('handlebars');
const path = require('path');
const fs = require('fs');

const not = (fn) => (...args) => !fn(...args);

const and = (...fns) => (...args) => fns.reduce((y, fn) => fn(...args) && y, true);

const pluck = (values, key) => values.map(v => v[key]);

Array.prototype.random = function () {
    return this[Math.floor(Math.random() * this.length)];
};

const findItemWithGreatest = (key, arrayOfObjects) => {
    const max = Math.max(...pluck(arrayOfObjects, key));
    return arrayOfObjects.find(item => item[key] == max);
};

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

const finish = (cache = null) => {
    if (cache) cache.quit();

    return {
        success(body) {
            return body;
        },

        failHttp(body, headers = {
            'Access-Control-Allow-Origin': 'thisvid.space',
            "content-type": "text/html; charset=UTF-8",
        }) {
            return {
                statusCode: 400,
                body,
                headers,
            };
        },

        redirect(location) {
            return {
                statusCode: 302,
                headers: {
                    Location: location
                },
            };
        },

        render(view, data = {}) {
            view = path.resolve(__dirname, '..', 'views', `${view}.hbs`);
            let body = fs.readFileSync(view, "utf8");

            data['gTagId'] = process.env.GTAG_ID;
            data['adCode'] = process.env.AD_CODE;

            let template = hbs.compile(body);
            body = template(data);

            return {
                statusCode: 200,
                headers: {"content-type": "text/html"},
                body
            };
        },

        sendTextFile(filename, headers = {"content-type": "text/html; charset=utf-8"}) {
            const filePath = path.resolve(__dirname, '..', 'assets', filename);
            let body = fs.readFileSync(filePath, "utf8");

            return {
                statusCode: 200,
                headers,
                body,
            };
        }
    }
};

const randomSuccessResponse = (username) => {
    let responses = [
        `Yay, video! Your download link's at {link}. You can bookmark this link and check it whenever you make a new download request. Got questions? See ${process.env.EXTERNAL_URL}/p/faq. 🤗`,
        `Hey, hey, here's your download link: {link}. I may not always reply to you, so check that link whenever you make a new download request. Check out ${process.env.EXTERNAL_URL}/p/faq if you've got any questions.🤗`,
        `All done, boss! Your download link: {link}. Psst...your new downloads will always be there, even when I don't reply. See ${process.env.EXTERNAL_URL}/p/faq if you've got any questions.👍`,
        `You're all set! Your new video's at {link}. PS: you can bookmark that link and check it in future whenever you mention me. See you around.🤗`,
        `I've got you, boss. Your download's at {link}.\n\nPsst...you're awesome!🤗`,
        `All good, my friend! One new download for you at {link}. Enjoy your day!😁`,
    ];
    let response = responses.random();
    return response.replace('{link}', `http://${process.env.EXTERNAL_URL}/${username}`);
};

const getRelativeTime = (time) => {

    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;

    const elapsed = new Date - new Date(time);

    const pluralize = (value, unit) => parseInt(value) <= 1 ? unit : (unit + 's');

    if (elapsed < msPerMinute) {
        return 'Just now';
    } else if (elapsed < msPerHour) {
        let minutes = Math.round(elapsed/msPerMinute);
        return minutes + ` ${pluralize(minutes, 'minute')} ago`;
    } else if (elapsed < msPerDay ) {
        let hours = Math.round(elapsed/msPerHour);
        return hours + ` ${pluralize(hours, 'hour')} ago`;
    } else {
        let days = Math.round(elapsed/msPerDay);
        return days + ` ${pluralize(days, 'day')} ago`;
    }
};

const SUCCESS = 'Success';

const FAIL = 'Fail';

const UNCERTAIN = 'Uncertain';

module.exports = {
    not,
    and,
    pluck,
    findItemWithGreatest,
    get,
    finish,
    randomSuccessResponse,
    getRelativeTime,
    SUCCESS,
    FAIL,
    UNCERTAIN
};
