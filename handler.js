'use strict';

const Sentry = require("@sentry/serverless");

Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
});

module.exports.getHomePage = async (event, context) => {
    Sentry.configureScope(scope => scope.setTransactionName("getHomePage"));

    return finish().render('home');
};

(process.env.NODE_ENV === 'production') && (exports.getHomePage = Sentry.AWSLambda.wrapHandler(exports.getHomePage, {
    timeoutWarningLimit: 1000,
}));