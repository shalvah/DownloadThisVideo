"use strict";

const mock = require('mock-require');

const mockCache = () => {
    const redis = require("redis-mock");
    require('bluebird').promisifyAll(redis.RedisClient.prototype);
    const cache = redis.createClient();
    mock('../../src/services/cache', cache);
    return cache;
};

const mockMetrics = () => {
    mock('../../src/services/cloudwatch', {
        logResults() { return Promise.resolve(); },
    });
};

const mockNotifications = () => {
    mock('../../src/services/notifications', {
        sendNotification() { return Promise.resolve(); },
    });
};

const mockTwitterAPI = () => {
    const tls = require('tls');
    // MITM converts HTTPS requests to HTTP, so we need to do this
    // so we don't get TLS errors on the response
    tls.TLSSocket.prototype.getPeerCertificate = (detailed) => null;
    const Mitm = require("mitm");
    const mitm = Mitm();
    const requests = [];
    mitm.on("connect", (socket, opts) => {
        if (!opts.host.includes("twitter.com")) socket.bypass();
    });
    mitm.on("request", (req, res) => {
        let rawData = '';
        req.on("data", (chunk) => { console.log(chunk); rawData += chunk; })
        if (req.url.includes("statuses/lookup")) {
            req.on("end", () => {
                const ids = require('url').parse(req.url, true).query.id;
                requests.push(ids);
                res.statusCode = 400;
                const response = {errors: [{code:352,message:"Too many values."}]};
                res.end(JSON.stringify(response));
            });
        }
    });
    return requests;
};

const mockSns = () => {
    const sns = {
        sendToSns(data) {
        }
    };
    const mock = require('mock-require');
    mock('../../src/services/sns', {
        newReminderSet() {
        }
    });
};

module.exports = {
    mockCache,
    mockMetrics,
    mockTwitterAPI,
    mockSns,
    mockNotifications,
};